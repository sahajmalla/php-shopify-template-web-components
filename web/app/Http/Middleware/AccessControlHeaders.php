<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Shopify\Context;

class AccessControlHeaders
{
    /**
     * Ensures that Access Control Headers are set for embedded apps.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        /** @var Response $response */
        $response = $next($request);

        if (Context::$IS_EMBEDDED_APP) {
            $response->headers->set("Access-Control-Allow-Origin", "*");
            $response->headers->set("Access-Control-Allow-Headers", "Authorization");
            $response->headers->set(
                "Access-Control-Expose-Headers",
                "X-Shopify-Retry-Invalid-Session-Request, " .
                "X-Shopify-API-Request-Failure-Reauthorize, " .
                "X-Shopify-API-Request-Failure-Reauthorize-Url"
            );
        }

        return $response;
    }
}
