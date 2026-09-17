<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Version
    |--------------------------------------------------------------------------
    |
    | Stamped into serverInfo and into every .mcpb manifest, where a client
    | treats it as the bundle's identity for upgrade detection.
    |
    | Leave this null and the version is derived from the deployed tool surface
    | (see App\Mcp\McpVersion), which changes exactly when the tools change.
    | Set MCP_VERSION only if you want to control the number yourself, e.g. to
    | line bundles up with a release tag.
    |
    */

    'version' => env('MCP_VERSION'),

];
