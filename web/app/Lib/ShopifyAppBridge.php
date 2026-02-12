<?php

declare(strict_types=1);

namespace App\Lib;

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;
use Shopify\App\ShopifyApp;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class ShopifyAppBridge
{
    private ShopifyApp $shopifyApp;

    public function __construct()
    {
        $this->shopifyApp = new ShopifyApp(
            clientId: (string) env('SHOPIFY_API_KEY', ''),
            clientSecret: (string) env('SHOPIFY_API_SECRET', ''),
            oldClientSecret: env('SHOPIFY_OLD_API_SECRET') ?: null,
        );
    }

    public function app(): ShopifyApp
    {
        return $this->shopifyApp;
    }

    public function requestToShopifyReq(Request $request): array
    {
        $headers = [];
        foreach ($request->headers->all() as $name => $values) {
            $headers[$name] = $this->headerValueToString($values);
        }

        return [
            'method' => $request->method(),
            'headers' => $headers,
            'url' => $request->fullUrl(),
            'body' => $request->getContent(),
        ];
    }

    public function resultToResponse(object $result): Response
    {
        if (isset($result->log->code, $result->log->detail)) {
            Log::info("{$result->log->code} - {$result->log->detail}");
        }

        $response = response(
            $result->response->body ?? '',
            $result->response->status ?? 500
        );

        $this->applyHeaders($response, $result->response->headers ?? []);

        return $response;
    }

    public function applyResultHeaders(SymfonyResponse $response, object $result): void
    {
        if (!isset($result->response->headers)) {
            return;
        }

        $this->applyHeaders($response, $result->response->headers);
    }

    private function applyHeaders(SymfonyResponse $response, object|array $headers): void
    {
        foreach ($this->normalizeHeaders($headers) as $name => $value) {
            $response->headers->set($name, $value);
        }
    }

    private function normalizeHeaders(object|array $headers): array
    {
        if (is_object($headers)) {
            $headers = get_object_vars($headers);
        }

        $normalized = [];
        foreach ($headers as $name => $value) {
            $normalized[(string) $name] = $this->headerValueToString($value);
        }

        return $normalized;
    }

    private function headerValueToString(mixed $value): string
    {
        if (is_array($value)) {
            return implode(', ', array_map(fn ($item): string => (string) $item, $value));
        }

        if (is_bool($value)) {
            return $value ? 'true' : 'false';
        }

        if ($value === null) {
            return '';
        }

        return (string) $value;
    }
}
