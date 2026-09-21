<?php

/**
 * Router minimalista: mapeia METODO + caminho (com parametros ":nome") para
 * um callable. Caminhos sao relativos a raiz da API (sem o prefixo /api).
 */
final class Router
{
    private array $routes = [];

    public function add(string $method, string $pattern, callable $handler): void
    {
        $this->routes[] = [$method, $pattern, $handler];
    }

    public function get(string $pattern, callable $handler): void { $this->add('GET', $pattern, $handler); }
    public function post(string $pattern, callable $handler): void { $this->add('POST', $pattern, $handler); }
    public function put(string $pattern, callable $handler): void { $this->add('PUT', $pattern, $handler); }
    public function delete(string $pattern, callable $handler): void { $this->add('DELETE', $pattern, $handler); }

    public function dispatch(string $method, string $path): void
    {
        $path = '/' . trim($path, '/');

        foreach ($this->routes as [$routeMethod, $pattern, $handler]) {
            if ($routeMethod !== $method) {
                continue;
            }

            $paramNames = [];
            $regex = preg_replace_callback('#:([a-zA-Z_][a-zA-Z0-9_]*)#', function ($m) use (&$paramNames) {
                $paramNames[] = $m[1];
                return '([^/]+)';
            }, $pattern);
            $regex = '#^' . rtrim($regex, '/') . '/?$#';

            if (preg_match($regex, $path, $matches)) {
                array_shift($matches);
                $params = array_combine($paramNames, $matches);
                $handler($params);
                return;
            }
        }

        Response::error('Rota não encontrada', 404);
    }
}
