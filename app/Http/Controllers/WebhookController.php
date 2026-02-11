<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Webhook;
use App\Services\WebhookService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WebhookController extends Controller
{
    public function __construct(protected WebhookService $webhookService) {}

    public function index()
    {
        $webhooks = Webhook::withCount('logs')
            ->latest()
            ->paginate(15);

        return Inertia::render('Admin/Webhooks/Index', [
            'webhooks' => $webhooks,
            'availableEvents' => $this->getAvailableEvents(),
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Webhooks/Create', [
            'availableEvents' => $this->getAvailableEvents(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'url' => ['required', 'url'],
            'secret' => ['nullable', 'string', 'max:255'],
            'events' => ['required', 'array', 'min:1'],
            'events.*' => ['string'],
            'is_active' => ['boolean'],
        ]);

        $webhook = Webhook::create($validated);

        ActivityLog::log('webhook.created', $webhook);

        return redirect()->route('webhooks.index')
            ->with('success', 'Webhook created successfully.');
    }

    public function show(Webhook $webhook)
    {
        $webhook->load(['logs' => function ($query) {
            $query->latest()->limit(50);
        }]);

        return Inertia::render('Admin/Webhooks/Show', [
            'webhook' => $webhook,
        ]);
    }

    public function edit(Webhook $webhook)
    {
        return Inertia::render('Admin/Webhooks/Edit', [
            'webhook' => $webhook,
            'availableEvents' => $this->getAvailableEvents(),
        ]);
    }

    public function update(Request $request, Webhook $webhook)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'url' => ['required', 'url'],
            'secret' => ['nullable', 'string', 'max:255'],
            'events' => ['required', 'array', 'min:1'],
            'events.*' => ['string'],
            'is_active' => ['boolean'],
        ]);

        $webhook->update($validated);

        ActivityLog::log('webhook.updated', $webhook);

        return redirect()->route('webhooks.index')
            ->with('success', 'Webhook updated successfully.');
    }

    public function destroy(Webhook $webhook)
    {
        ActivityLog::log('webhook.deleted', $webhook, [
            'webhook_name' => $webhook->name,
        ]);

        $webhook->delete();

        return redirect()->route('webhooks.index')
            ->with('success', 'Webhook deleted successfully.');
    }

    public function test(Webhook $webhook)
    {
        $result = $this->webhookService->sendTestWebhook($webhook);

        if ($result['success']) {
            return back()->with('success', 'Test webhook sent successfully.');
        }

        return back()->with('error', 'Failed to send test webhook: ' . $result['message']);
    }

    public function toggleStatus(Webhook $webhook)
    {
        $webhook->update(['is_active' => !$webhook->is_active]);

        ActivityLog::log($webhook->is_active ? 'webhook.activated' : 'webhook.deactivated', $webhook);

        return back()->with('success', 'Webhook status updated.');
    }

    protected function getAvailableEvents(): array
    {
        return [
            'leave.requested' => 'Leave Request Submitted',
            'leave.approved' => 'Leave Request Approved',
            'leave.rejected' => 'Leave Request Rejected',
            'leave.cancelled' => 'Leave Request Cancelled',
            'user.created' => 'User Created',
            'user.updated' => 'User Updated',
            'user.deleted' => 'User Deleted',
        ];
    }
}
