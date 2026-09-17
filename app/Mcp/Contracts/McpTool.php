<?php

declare(strict_types=1);

namespace App\Mcp\Contracts;

use App\Models\User;

/**
 * One tool as an MCP client sees it.
 *
 * Tools are the single source of truth for the whole subsystem: the JSON-RPC
 * `tools/list` response, the tool table baked into a .mcpb bundle, and the
 * documentation are all generated from the registered set. Add a class, list it
 * in the registry, and it appears everywhere at once — nothing to keep in sync
 * by hand.
 *
 * Reporting is what shipped first. Leave checking and leave submission are the
 * reason the boundary is drawn here rather than inside a reports controller:
 * a write tool differs only in what handle() does and what role() demands.
 */
interface McpTool
{
    /**
     * Machine name, snake_case, unique across the registry.
     *
     * This is what the model actually calls, so it should read as an action
     * ("leave_summary_report"), not as an object.
     */
    public function name(): string;

    /**
     * What the tool does, addressed to the model choosing between tools.
     *
     * Say what it returns and when to reach for it over its neighbours; a
     * description that only restates the name wastes the one chance to stop
     * the model guessing.
     */
    public function description(): string;

    /**
     * JSON Schema for the arguments, as a plain array.
     *
     * Always an object schema with a `properties` map, even when empty — some
     * clients refuse a tool whose schema is not of type object.
     */
    public function inputSchema(): array;

    /**
     * Lowest role that may call this tool: 'admin' covers super_admin too.
     *
     * Enforced by the transport before handle() runs, so an implementation
     * never has to repeat the check.
     */
    public function role(): string;

    /**
     * Does calling this change data?
     *
     * Read-only tools are advertised as such so clients can auto-approve them.
     * Every reporting tool is read-only; the future leave-submission tools are
     * not, and must say so.
     */
    public function readOnly(): bool;

    /**
     * Run the tool for $user with validated $arguments, returning JSON-ready data.
     *
     * $user is the key's owner, never a caller-supplied address.
     */
    public function handle(array $arguments, User $user): array;
}
