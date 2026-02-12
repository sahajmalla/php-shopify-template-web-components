<?php

namespace App\Http\Middleware;

use App\Exceptions\ShopifyBillingException;
use App\Lib\EnsureBilling;
use App\Lib\ShopifyAppBridge;
use App\Lib\TopLevelRedirection;
use App\Models\Session as SessionModel;
use Closure;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Schema;
use Shopify\App\Types\TokenExchangeAccessToken;
use Shopify\Auth\AccessTokenOnlineUserInfo;
use Shopify\Auth\OAuth;
use Shopify\Auth\Session as AuthSession;
use Shopify\Clients\Graphql;
use Shopify\Context;
use Shopify\Utils;

class EnsureShopifySession
{
    public const ACCESS_MODE_ONLINE = 'online';
    public const ACCESS_MODE_OFFLINE = 'offline';

    public const TEST_GRAPHQL_QUERY = <<<QUERY
    {
        shop {
            name
        }
    }
    QUERY;

    public function __construct(private ShopifyAppBridge $shopifyAppBridge)
    {
    }

    /**
     * Checks if there is currently an active Shopify session.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  string  $accessMode
     * @return mixed
     */
    public function handle(Request $request, Closure $next, string $accessMode = self::ACCESS_MODE_OFFLINE)
    {
        switch ($accessMode) {
            case self::ACCESS_MODE_ONLINE:
                $isOnline = true;
                break;
            case self::ACCESS_MODE_OFFLINE:
                $isOnline = false;
                break;
            default:
                throw new Exception(
                    "Unrecognized access mode '$accessMode', accepted values are 'online' and 'offline'"
                );
        }

        $shop = Utils::sanitizeShopDomain($request->query('shop', ''));
        $session = $this->loadExistingSession($request, $isOnline, $shop);
        $isEmbedded = Context::$IS_EMBEDDED_APP;
        $hasBearerToken = $this->hasBearerToken($request);
        $appHomeVerification = null;

        if ($session && $shop && $session->getShop() !== $shop) {
            // Session belongs to a different shop; ignore and re-auth from token exchange below.
            $session = null;
        }

        if (!$isOnline && $session && !$session->isValid()) {
            $session = $this->refreshTokenExchangedSession($session) ?? $session;
        }

        if ($session) {
            $sessionStatus = $this->validateSession($request, $session);
            if ($sessionStatus === true) {
                $request->attributes->set('shopifySession', $session);
                return $next($request);
            }

            if ($sessionStatus !== false) {
                return $sessionStatus;
            }
        }

        if ($isEmbedded && $hasBearerToken) {
            $appHomeVerification = $this->shopifyAppBridge->app()->verifyAppHomeReq(
                $this->shopifyAppBridge->requestToShopifyReq($request),
                appHomePatchIdTokenPath: '/auth/patch-id-token',
            );

            if (!$appHomeVerification->ok) {
                return $this->shopifyAppBridge->resultToResponse($appHomeVerification);
            }

            $verifiedShop = Utils::sanitizeShopDomain((string) $appHomeVerification->shop);
            if ($verifiedShop) {
                $shop = $verifiedShop;
            }
        }

        if ($appHomeVerification?->idToken) {
            $exchangeResult = $this->shopifyAppBridge->app()->exchangeUsingTokenExchange(
                accessMode: $accessMode,
                idToken: $appHomeVerification->idToken,
                invalidTokenResponse: $appHomeVerification->newIdTokenResponse,
            );

            if (!$exchangeResult->ok || !$exchangeResult->accessToken) {
                return $this->shopifyAppBridge->resultToResponse($exchangeResult);
            }

            $session = $this->storeTokenExchangeSession(
                $exchangeResult->accessToken,
                $isOnline,
                $appHomeVerification->userId,
            );

            if ($session) {
                $sessionStatus = $this->validateSession($request, $session);
                if ($sessionStatus === true) {
                    $request->attributes->set('shopifySession', $session);
                    return $next($request);
                }

                if ($sessionStatus !== false) {
                    return $sessionStatus;
                }
            }
        }

        if (!$shop && $session) {
            $shop = $session->getShop();
        }

        return TopLevelRedirection::redirect($request, "/api/auth?shop=$shop");
    }

    private function validateSession(Request $request, AuthSession $session)
    {
        if (!$session->isValid()) {
            return false;
        }

        if (Config::get('shopify.billing.required')) {
            try {
                list($hasPayment, $confirmationUrl) = EnsureBilling::check($session, Config::get('shopify.billing'));
                if (!$hasPayment) {
                    return TopLevelRedirection::redirect($request, $confirmationUrl);
                }

                return true;
            } catch (ShopifyBillingException $e) {
                Log::warning("Billing check failed for {$session->getShop()}: {$e->getMessage()}");
                return false;
            }
        }

        $client = new Graphql($session->getShop(), $session->getAccessToken());
        $response = $client->query(self::TEST_GRAPHQL_QUERY);

        return $response->getStatusCode() === 200;
    }

    private function loadExistingSession(Request $request, bool $isOnline, ?string $shop): ?AuthSession
    {
        try {
            if (!$isOnline && $shop) {
                return Utils::loadOfflineSession($shop, true);
            }

            return Utils::loadCurrentSession($request->header(), $request->cookie(), $isOnline);
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function storeTokenExchangeSession(
        TokenExchangeAccessToken $accessToken,
        bool $isOnline,
        ?string $userId = null,
    ): ?AuthSession {
        $shop = Utils::sanitizeShopDomain($accessToken->shop);
        if (!$shop) {
            return null;
        }

        $sessionId = OAuth::getOfflineSessionId($shop);
        if ($isOnline && ($userId || isset($accessToken->user['id']))) {
            $sessionId = OAuth::getJwtSessionId($shop, (string) ($userId ?: $accessToken->user['id']));
        }

        $session = new AuthSession($sessionId, $shop, $isOnline, '');
        $session->setAccessToken($accessToken->token);
        $session->setScope($accessToken->scope ?: Context::$SCOPES->toString());

        if ($accessToken->expires) {
            $session->setExpires($accessToken->expires);
        }

        if ($isOnline && is_array($accessToken->user)) {
            $session->setOnlineAccessInfo(
                new AccessTokenOnlineUserInfo(
                    (int) ($accessToken->user['id'] ?? 0),
                    (string) ($accessToken->user['firstName'] ?? ''),
                    (string) ($accessToken->user['lastName'] ?? ''),
                    (string) ($accessToken->user['email'] ?? ''),
                    (bool) ($accessToken->user['emailVerified'] ?? false),
                    (bool) ($accessToken->user['accountOwner'] ?? false),
                    (string) ($accessToken->user['locale'] ?? ''),
                    (bool) ($accessToken->user['collaborator'] ?? false),
                )
            );
        }

        if (!Context::$SESSION_STORAGE->storeSession($session)) {
            return null;
        }

        $this->persistRefreshTokenMetadata($sessionId, $accessToken);

        return $session;
    }

    private function refreshTokenExchangedSession(AuthSession $session): ?AuthSession
    {
        if (!$this->supportsRefreshTokenColumns()) {
            return null;
        }

        $dbSession = SessionModel::where('session_id', $session->getId())
            ->whereNotNull('refresh_token')
            ->first();

        if (!$dbSession) {
            return null;
        }

        $shop = preg_replace('/\.myshopify\.(com|io)$/', '', $session->getShop());
        if (!$shop || $shop === $session->getShop()) {
            return null;
        }

        $refreshResult = $this->shopifyAppBridge->app()->refreshTokenExchangedAccessToken([
            'accessMode' => $session->isOnline() ? self::ACCESS_MODE_ONLINE : self::ACCESS_MODE_OFFLINE,
            'shop' => $shop,
            'token' => (string) $session->getAccessToken(),
            'expires' => $dbSession->expires_at ? (string) $dbSession->expires_at : null,
            'scope' => (string) $session->getScope(),
            'refreshToken' => (string) $dbSession->refresh_token,
            'refreshTokenExpires' => $dbSession->refresh_token_expires_at
                ? (string) $dbSession->refresh_token_expires_at
                : null,
            'user' => null,
        ]);

        if (!$refreshResult->ok || !$refreshResult->accessToken) {
            return null;
        }

        return $this->storeTokenExchangeSession(
            $refreshResult->accessToken,
            $session->isOnline(),
            $refreshResult->accessToken->user['id'] ?? null,
        );
    }

    private function persistRefreshTokenMetadata(string $sessionId, TokenExchangeAccessToken $accessToken): void
    {
        if (!$this->supportsRefreshTokenColumns()) {
            return;
        }

        $dbSession = SessionModel::where('session_id', $sessionId)->first();
        if (!$dbSession) {
            return;
        }

        $dbSession->refresh_token = $accessToken->refreshToken ?: null;
        $dbSession->refresh_token_expires_at = $accessToken->refreshTokenExpires ?: null;
        $dbSession->save();
    }

    private function supportsRefreshTokenColumns(): bool
    {
        static $supports = null;

        if ($supports === null) {
            $supports = Schema::hasColumns('sessions', ['refresh_token', 'refresh_token_expires_at']);
        }

        return $supports;
    }

    private function hasBearerToken(Request $request): bool
    {
        $authorization = (string)$request->header('Authorization', '');
        return preg_match('/^Bearer\s+(.+)$/', $authorization) === 1;
    }
}
