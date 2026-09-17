<?php

declare(strict_types=1);

namespace App\Mcp;

use RuntimeException;

/**
 * A failure the caller caused and can act on.
 *
 * Separated from every other Throwable so the dispatcher knows which messages
 * are safe to put on the wire: these are written for the client, while
 * anything else is logged and replaced with a reference.
 */
final class McpToolException extends RuntimeException
{
}
