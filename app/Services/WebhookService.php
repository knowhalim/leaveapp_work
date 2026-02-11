<?php

namespace App\Services;

use App\Models\LeaveRequest;
use App\Models\Webhook;
use App\Models\WebhookLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WebhookService
{
    public function trigger(string $event, $model): void
    {
        $webhooks = Webhook::active()->forEvent($event)->get();

        foreach ($webhooks as $webhook) {
            $this->dispatch($webhook, $event, $model);
        }
    }

    public function dispatch(Webhook $webhook, string $event, $model): void
    {
        $payload = $this->buildPayload($event, $model);

        $log = WebhookLog::create([
            'webhook_id' => $webhook->id,
            'event' => $event,
            'payload' => $payload,
            'status' => 'pending',
        ]);

        try {
            $headers = [
                'Content-Type' => 'application/json',
                'X-Webhook-Event' => $event,
                'X-Webhook-Timestamp' => now()->timestamp,
            ];

            if ($webhook->secret) {
                $signature = hash_hmac('sha256', json_encode($payload), $webhook->secret);
                $headers['X-Webhook-Signature'] = $signature;
            }

            $response = Http::withHeaders($headers)
                ->timeout(30)
                ->post($webhook->url, $payload);

            $log->update([
                'response_code' => $response->status(),
                'response_body' => substr($response->body(), 0, 5000),
                'status' => $response->successful() ? 'success' : 'failed',
                'attempts' => $log->attempts + 1,
                'sent_at' => now(),
            ]);

            $webhook->update(['last_triggered_at' => now()]);

        } catch (\Exception $e) {
            Log::error("Webhook dispatch failed: {$e->getMessage()}", [
                'webhook_id' => $webhook->id,
                'event' => $event,
            ]);

            $log->update([
                'status' => 'failed',
                'response_body' => $e->getMessage(),
                'attempts' => $log->attempts + 1,
            ]);
        }
    }

    public function sendTestWebhook(Webhook $webhook): array
    {
        $payload = [
            'event' => 'test',
            'timestamp' => now()->toIso8601String(),
            'data' => [
                'message' => 'This is a test webhook from HR Leave System',
                'webhook_name' => $webhook->name,
            ],
        ];

        try {
            $headers = [
                'Content-Type' => 'application/json',
                'X-Webhook-Event' => 'test',
                'X-Webhook-Timestamp' => now()->timestamp,
            ];

            if ($webhook->secret) {
                $signature = hash_hmac('sha256', json_encode($payload), $webhook->secret);
                $headers['X-Webhook-Signature'] = $signature;
            }

            $response = Http::withHeaders($headers)
                ->timeout(30)
                ->post($webhook->url, $payload);

            return [
                'success' => $response->successful(),
                'status_code' => $response->status(),
                'message' => $response->successful() ? 'Test webhook sent successfully' : 'Webhook returned error status',
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'status_code' => null,
                'message' => $e->getMessage(),
            ];
        }
    }

    protected function buildPayload(string $event, $model): array
    {
        $payload = [
            'event' => $event,
            'timestamp' => now()->toIso8601String(),
            'data' => [],
        ];

        if ($model instanceof LeaveRequest) {
            $model->load(['employee.user', 'leaveType', 'approver']);

            $payload['data'] = [
                'leave_request' => [
                    'id' => $model->id,
                    'employee' => [
                        'id' => $model->employee->id,
                        'name' => $model->employee->user->name,
                        'email' => $model->employee->user->email,
                        'employee_number' => $model->employee->employee_number,
                    ],
                    'leave_type' => [
                        'id' => $model->leaveType->id,
                        'name' => $model->leaveType->name,
                        'code' => $model->leaveType->code,
                    ],
                    'start_date' => $model->start_date->format('Y-m-d'),
                    'end_date' => $model->end_date->format('Y-m-d'),
                    'total_days' => $model->total_days,
                    'status' => $model->status,
                    'reason' => $model->reason,
                    'approved_by' => $model->approver?->name,
                    'approved_at' => $model->approved_at?->toIso8601String(),
                ],
            ];
        } else {
            $payload['data'] = $model->toArray();
        }

        return $payload;
    }
}
