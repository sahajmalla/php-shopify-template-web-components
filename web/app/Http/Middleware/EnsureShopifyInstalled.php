<?php

namespace App\Http\Middleware;

use App\Lib\AuthRedirection;
use App\Models\Session;
use Closure;
use Illuminate\Http\Request;
use Shopify\Context;
use Shopify\Utils;

class EnsureShopifyInstalled
{
    /**
     * Checks if the shop in the query arguments is currently installed.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $shop = $request->query('shop') ? Utils::sanitizeShopDomain($request->query('shop')) : null;
        $isExitingIframe = preg_match("/^ExitIframe/i", $request->path());
        if ($isExitingIframe) {
            return $next($request);
        }

        if (Context::$IS_EMBEDDED_APP && $request->query("embedded", false) === "1") {
            // With managed install, storefront load should not depend on an existing DB session.
            return $next($request);
        }

        $appInstalled = $shop && Session::where('shop', $shop)->where('access_token', '<>', null)->exists();

        return $appInstalled ? $next($request) : AuthRedirection::redirect($request);
    }
}
