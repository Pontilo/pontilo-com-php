<?php

/**
 * Gera identificadores unicos usados como chave primaria (equivalente ao
 * cuid() do Prisma no backend Node original). Nao precisa ser cuid "de
 * verdade" -- so precisa ser unico, url-safe e razoavelmente curto.
 */
final class Id
{
    public static function generate(string $prefix = 'c'): string
    {
        $timePart = base_convert((string) (int) (microtime(true) * 1000), 10, 36);
        $randomPart = bin2hex(random_bytes(6));
        return strtolower($prefix . $timePart . $randomPart);
    }
}
