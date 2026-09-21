<?php

/**
 * Equivalente a src/middleware/authMiddleware.ts (authenticateToken,
 * authenticateStudent, authenticateTeacher). Cada metodo le o header
 * Authorization, valida o JWT e retorna o payload, ou interrompe a
 * requisicao com 401/403 (mesmos codigos e mensagens do backend Node).
 */
final class Auth
{
    private static function bearerToken(): ?string
    {
        $header = Helpers::header('Authorization') ?? '';
        if (!preg_match('/^Bearer\s+(.+)$/i', trim($header), $m)) {
            return null;
        }
        return $m[1];
    }

    /** Equivalente a authenticateToken: aceita qualquer token valido (professor ou aluno). */
    public static function requireToken(): array
    {
        $token = self::bearerToken();
        if (!$token) {
            Response::error('Token missing', 401);
        }
        $payload = Jwt::verify($token, Config::get('jwt_secret'));
        if (!$payload) {
            Response::error('Invalid token', 403);
        }
        return $payload;
    }

    /** Equivalente a authenticateStudent. */
    public static function requireStudent(): array
    {
        $token = self::bearerToken();
        if (!$token) {
            Response::error('Token de aluno necessário', 401);
        }
        $payload = Jwt::verify($token, Config::get('jwt_secret'));
        if (!$payload || ($payload['type'] ?? null) !== 'student') {
            Response::error('Token de aluno inválido', 403);
        }
        return $payload;
    }

    /** Equivalente a authenticateTeacher. */
    public static function requireTeacher(): array
    {
        $token = self::bearerToken();
        if (!$token) {
            Response::error('Token de professor necessário', 401);
        }
        $payload = Jwt::verify($token, Config::get('jwt_secret'));
        if (!$payload || ($payload['type'] ?? null) !== 'teacher') {
            Response::error('Token de professor inválido', 403);
        }
        return $payload;
    }

    /**
     * Extrai o teacherId de um payload de usuario autenticado, igual ao
     * padrao "user?.teacherId || user?.id" usado nos controllers Node.
     */
    public static function teacherId(array $user): ?string
    {
        return $user['teacherId'] ?? $user['id'] ?? null;
    }
}
