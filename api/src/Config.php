<?php

final class Config
{
    private static ?array $data = null;

    public static function all(): array
    {
        if (self::$data === null) {
            $path = __DIR__ . '/../config.php';
            if (!file_exists($path)) {
                http_response_code(500);
                header('Content-Type: application/json');
                echo json_encode([
                    'error' => 'config.php não encontrado. Copie config.example.php para config.php e preencha com os dados do ambiente.',
                ]);
                exit;
            }
            self::$data = require $path;
        }
        return self::$data;
    }

    public static function get(string $key, $default = null)
    {
        $data = self::all();
        $parts = explode('.', $key);
        $value = $data;
        foreach ($parts as $part) {
            if (!is_array($value) || !array_key_exists($part, $value)) {
                return $default;
            }
            $value = $value[$part];
        }
        return $value;
    }
}
