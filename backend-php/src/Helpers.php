<?php

/**
 * Funções utilitárias compartilhadas entre controllers.
 */
final class Helpers
{
    public static function body(): array
    {
        $raw = file_get_contents('php://input');
        if ($raw === '' || $raw === false) {
            return [];
        }
        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }

    /**
     * Igual ao padrao "periodId || semesterId" + busca do Period + { gte, lte }
     * repetido em varios controllers Node. Retorna ['start' => DATETIME, 'end' => DATETIME] ou null.
     */
    public static function periodRange(?string $periodId, ?string $semesterId): ?array
    {
        $filterId = $periodId ?: $semesterId;
        if (!$filterId) {
            return null;
        }

        $stmt = Database::pdo()->prepare('SELECT start_date, end_date FROM periods WHERE id = :id');
        $stmt->execute(['id' => $filterId]);
        $period = $stmt->fetch();

        if (!$period) {
            return null;
        }

        return ['start' => $period['start_date'], 'end' => $period['end_date']];
    }

    public static function dateKey(string $datetime): string
    {
        return substr($datetime, 0, 10);
    }

    public static function nowDateTime(): string
    {
        return (new DateTime())->format('Y-m-d H:i:s.v');
    }

    /**
     * Le um header HTTP de forma tolerante a hospedagens que nao populam
     * $_SERVER['HTTP_*'] para certos headers (comum em setups PHP-FPM/CGI).
     * Tenta, nessa ordem: $_SERVER, getallheaders(), apache_request_headers().
     * Usado para Authorization e Stripe-Signature (ver .htaccess, que ja
     * tenta reencaminhar Authorization via variavel de ambiente tambem).
     */
    public static function header(string $name): ?string
    {
        $serverKey = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
        if (!empty($_SERVER[$serverKey])) {
            return $_SERVER[$serverKey];
        }

        foreach (['getallheaders', 'apache_request_headers'] as $fn) {
            if (function_exists($fn)) {
                foreach ($fn() as $key => $value) {
                    if (strcasecmp($key, $name) === 0) {
                        return $value;
                    }
                }
            }
        }

        return null;
    }
}
