<?php

/**
 * Implementacao minima de JWT (HS256), sem dependencias externas.
 * Equivalente ao uso de jsonwebtoken (jwt.sign / jwt.verify) no backend Node.
 */
final class Jwt
{
    public static function sign(array $payload, string $secret, string $expiresIn = '7d'): string
    {
        $header = ['alg' => 'HS256', 'typ' => 'JWT'];
        $payload['iat'] = time();
        $payload['exp'] = time() + self::parseExpiry($expiresIn);

        $segments = [
            self::base64UrlEncode(json_encode($header)),
            self::base64UrlEncode(json_encode($payload)),
        ];

        $signature = hash_hmac('sha256', implode('.', $segments), $secret, true);
        $segments[] = self::base64UrlEncode($signature);

        return implode('.', $segments);
    }

    /**
     * Retorna o payload decodificado (array) ou null se o token for invalido,
     * malformado ou expirado.
     */
    public static function verify(string $token, string $secret): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        [$headerB64, $payloadB64, $signatureB64] = $parts;

        $expectedSignature = hash_hmac('sha256', "$headerB64.$payloadB64", $secret, true);
        $actualSignature = self::base64UrlDecode($signatureB64);

        if ($actualSignature === false || !hash_equals($expectedSignature, $actualSignature)) {
            return null;
        }

        $payloadJson = self::base64UrlDecode($payloadB64);
        if ($payloadJson === false) {
            return null;
        }

        $payload = json_decode($payloadJson, true);
        if (!is_array($payload)) {
            return null;
        }

        if (isset($payload['exp']) && time() >= $payload['exp']) {
            return null;
        }

        return $payload;
    }

    private static function parseExpiry(string $expiresIn): int
    {
        if (preg_match('/^(\d+)([smhd])$/', $expiresIn, $m)) {
            $value = (int) $m[1];
            return match ($m[2]) {
                's' => $value,
                'm' => $value * 60,
                'h' => $value * 3600,
                'd' => $value * 86400,
                default => $value,
            };
        }
        return (int) $expiresIn;
    }

    private static function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $data)
    {
        $padded = str_pad(strtr($data, '-_', '+/'), strlen($data) % 4 === 0 ? strlen($data) : strlen($data) + (4 - strlen($data) % 4), '=');
        return base64_decode($padded, true);
    }
}
