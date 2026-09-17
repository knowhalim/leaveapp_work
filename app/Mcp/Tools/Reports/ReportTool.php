<?php

declare(strict_types=1);

namespace App\Mcp\Tools\Reports;

use App\Mcp\Contracts\McpTool;
use App\Models\SystemSetting;

/**
 * Shared ground for the reporting tools.
 *
 * All of them are admin-only reads over one financial year, and all of them
 * can return more rows than anyone wants in a model's context window, so the
 * year resolution and the row cap live here rather than in six copies.
 */
abstract class ReportTool implements McpTool
{
    /**
     * Rows returned when the caller does not ask for a number.
     *
     * Chosen to be useful rather than complete: a model reading a report wants
     * enough to answer the question, and an organisation-wide dump costs
     * context it then cannot spend on reasoning. Callers who genuinely want
     * everything can raise it to MAX_LIMIT.
     */
    protected const DEFAULT_LIMIT = 100;

    /**
     * Hard ceiling on rows, whatever the caller asks for.
     *
     * A cap that can be argued past is not a cap. Anything larger than this is
     * a CSV export by email, not an MCP call.
     */
    protected const MAX_LIMIT = 1000;

    public function role(): string
    {
        return 'admin';
    }

    public function readOnly(): bool
    {
        return true;
    }

    /**
     * The financial year to report on: the caller's, or the configured current one.
     */
    protected function resolveYear(array $arguments): string
    {
        $year = trim((string) ($arguments['year'] ?? ''));

        return $year !== '' ? $year : SystemSetting::getFinancialYear();
    }

    /**
     * The row cap in force for this call, clamped into range.
     */
    protected function resolveLimit(array $arguments): int
    {
        $limit = (int) ($arguments['limit'] ?? self::DEFAULT_LIMIT);

        return max(1, min($limit, self::MAX_LIMIT));
    }

    /**
     * Wrap rows with the context a model needs to read them honestly.
     *
     * `truncated` is the important one: without it a model that receives 100
     * of 400 rows will happily report totals as though it had all 400. The
     * totals we send alongside are computed over the full set, not the page.
     */
    protected function envelope(string $year, array $rows, int $total, int $limit, array $extra = []): array
    {
        return array_merge([
            'financial_year' => $year,
            'returned_rows'  => count($rows),
            'total_rows'     => $total,
            'truncated'      => $total > count($rows),
            'row_limit'      => $limit,
            'rows'           => $rows,
        ], $extra);
    }

    /**
     * Schema fragment shared by every report: which year, how many rows.
     */
    protected function commonProperties(): array
    {
        return [
            'year' => [
                'type'        => 'string',
                'description' => 'Financial year to report on, e.g. "2026". Defaults to the system\'s current financial year.',
            ],
            'limit' => [
                'type'        => 'integer',
                'minimum'     => 1,
                'maximum'     => self::MAX_LIMIT,
                'description' => 'Maximum rows to return (default ' . self::DEFAULT_LIMIT . ', hard maximum ' . self::MAX_LIMIT . '). Totals are always computed over the full result set, not just the returned rows.',
            ],
        ];
    }
}
