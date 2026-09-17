<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\ApiKey;
use App\Models\Department;
use App\Models\Employee;
use App\Models\EmployeeType;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The MCP transport, covered at the boundary that matters: who gets in, and
 * whether the numbers that come out can be trusted.
 */
final class McpServerTest extends TestCase
{
    use RefreshDatabase;

    private const ENDPOINT = '/api/mcp';

    private function user(string $role): User
    {
        return User::create([
            'name'      => ucfirst($role) . ' User',
            'email'     => $role . '-' . uniqid() . '@example.test',
            'password'  => bcrypt('secret'),
            'role'      => $role,
            'is_active' => true,
        ]);
    }

    private function keyFor(?User $user, array $permissions = ['mcp.use']): string
    {
        $plain = ApiKey::generateKey();

        ApiKey::create([
            'user_id'     => $user?->id,
            'name'        => 'test-' . uniqid(),
            'key'         => $plain,
            'permissions' => $permissions,
            'is_active'   => true,
        ]);

        return $plain;
    }

    private function rpc(string $key, array $body): \Illuminate\Testing\TestResponse
    {
        return $this->withHeaders(['X-API-Key' => $key])->postJson(self::ENDPOINT, $body);
    }

    public function test_it_refuses_a_request_with_no_credential(): void
    {
        $this->postJson(self::ENDPOINT, ['jsonrpc' => '2.0', 'id' => 1, 'method' => 'tools/list'])
            ->assertStatus(401);
    }

    public function test_it_refuses_an_employee_and_a_manager(): void
    {
        foreach (['employee', 'manager'] as $role) {
            $this->rpc($this->keyFor($this->user($role)), [
                'jsonrpc' => '2.0', 'id' => 1, 'method' => 'tools/list',
            ])->assertStatus(403);
        }
    }

    /**
     * The reason api_keys.user_id exists. A key with no owner cannot be given
     * an identity safely, so it must not reach tools that return data.
     */
    public function test_it_refuses_a_key_that_is_not_bound_to_a_user(): void
    {
        $this->rpc($this->keyFor(null), [
            'jsonrpc' => '2.0', 'id' => 1, 'method' => 'tools/list',
        ])->assertStatus(401);
    }

    public function test_it_refuses_an_admin_key_lacking_the_mcp_permission(): void
    {
        $this->rpc($this->keyFor($this->user('admin'), ['leaves.read']), [
            'jsonrpc' => '2.0', 'id' => 1, 'method' => 'tools/list',
        ])->assertStatus(401);
    }

    public function test_it_refuses_a_deactivated_admin(): void
    {
        $admin = $this->user('admin');
        $admin->update(['is_active' => false]);

        $this->rpc($this->keyFor($admin), [
            'jsonrpc' => '2.0', 'id' => 1, 'method' => 'tools/list',
        ])->assertStatus(403);
    }

    public function test_an_admin_sees_the_reporting_tools(): void
    {
        $response = $this->rpc($this->keyFor($this->user('admin')), [
            'jsonrpc' => '2.0', 'id' => 1, 'method' => 'tools/list',
        ])->assertOk();

        $names = array_column($response->json('result.tools'), 'name');

        $this->assertContains('leave_summary_report', $names);
        $this->assertContains('department_summary_report', $names);
        $this->assertContains('list_departments', $names);
    }

    public function test_it_echoes_a_supported_protocol_version_and_falls_back_otherwise(): void
    {
        $key = $this->keyFor($this->user('admin'));

        $this->rpc($key, ['jsonrpc' => '2.0', 'id' => 1, 'method' => 'initialize', 'params' => ['protocolVersion' => '2025-06-18']])
            ->assertOk()
            ->assertJsonPath('result.protocolVersion', '2025-06-18');

        $this->rpc($key, ['jsonrpc' => '2.0', 'id' => 2, 'method' => 'initialize', 'params' => ['protocolVersion' => '1999-01-01']])
            ->assertOk()
            ->assertJsonPath('result.protocolVersion', \App\Mcp\McpProtocol::PREFERRED_VERSION);
    }

    public function test_a_notification_gets_no_response_body(): void
    {
        $this->rpc($this->keyFor($this->user('admin')), [
            'jsonrpc' => '2.0', 'method' => 'notifications/initialized',
        ])->assertStatus(202)->assertNoContent(202);
    }

    public function test_an_unknown_tool_is_a_jsonrpc_error_not_an_http_error(): void
    {
        $this->rpc($this->keyFor($this->user('admin')), [
            'jsonrpc' => '2.0', 'id' => 1, 'method' => 'tools/call',
            'params'  => ['name' => 'does_not_exist', 'arguments' => []],
        ])->assertOk()->assertJsonPath('error.code', -32601);
    }

    public function test_a_batch_answers_requests_and_swallows_notifications(): void
    {
        $response = $this->rpc($this->keyFor($this->user('admin')), [
            ['jsonrpc' => '2.0', 'id' => 1, 'method' => 'ping'],
            ['jsonrpc' => '2.0', 'method' => 'notifications/initialized'],
            ['jsonrpc' => '2.0', 'id' => 2, 'method' => 'ping'],
        ])->assertOk();

        $this->assertCount(2, $response->json());
        $this->assertSame([1, 2], array_column($response->json(), 'id'));
    }

    /**
     * The contract the report envelope makes: rows may be a page, totals never
     * are. A model that trusts the totals must not be reading a partial sum.
     */
    public function test_totals_cover_the_whole_set_even_when_rows_are_truncated(): void
    {
        $admin = $this->user('admin');
        $this->seedLeave(5);

        $response = $this->rpc($this->keyFor($admin), [
            'jsonrpc' => '2.0', 'id' => 1, 'method' => 'tools/call',
            'params'  => ['name' => 'leave_summary_report', 'arguments' => ['limit' => 2]],
        ])->assertOk();

        $data = $response->json('result.structuredContent');

        $this->assertSame(2, $data['returned_rows']);
        $this->assertSame(5, $data['total_rows']);
        $this->assertTrue($data['truncated']);
        $this->assertSame(5, $data['totals_by_status']['approved']['requests']);
    }

    public function test_the_row_limit_cannot_be_argued_past(): void
    {
        $admin = $this->user('admin');
        $this->seedLeave(3);

        $data = $this->rpc($this->keyFor($admin), [
            'jsonrpc' => '2.0', 'id' => 1, 'method' => 'tools/call',
            'params'  => ['name' => 'leave_summary_report', 'arguments' => ['limit' => 999999]],
        ])->assertOk()->json('result.structuredContent');

        $this->assertSame(1000, $data['row_limit']);
    }

    /**
     * Create $count approved single-day leave requests in the current year.
     */
    private function seedLeave(int $count): void
    {
        $department = Department::create(['name' => 'Testing']);
        $type       = LeaveType::create(['name' => 'Annual Leave', 'code' => 'AL' . random_int(100, 999)]);
        $empType    = EmployeeType::create(['name' => 'Full Time']);
        $year       = \App\Models\SystemSetting::getFinancialYear();

        for ($i = 0; $i < $count; $i++) {
            $user = $this->user('employee');

            $employee = Employee::create([
                'user_id'          => $user->id,
                'employee_number'  => 'E' . $user->id,
                'department_id'    => $department->id,
                'employee_type_id' => $empType->id,
                'hire_date'        => now()->subYear(),
            ]);

            LeaveRequest::create([
                'employee_id'    => $employee->id,
                'leave_type_id'  => $type->id,
                'start_date'     => now()->subDays($i + 1),
                'end_date'       => now()->subDays($i + 1),
                'total_days'     => 1,
                'reason'         => 'test',
                'status'         => 'approved',
                'financial_year' => $year,
            ]);
        }
    }
}
