# Auditoria de deploy — Locaweb (PHP + MySQL + Apache, hospedagem compartilhada)

Auditoria do que já existe em `backend-php/` e `pontilo-dashboard/`, sem
alterar regras de negócio. Cobre os 15 pontos pedidos. Onde encontrei um
risco real, corrigi (bug de `.htaccess`/rota placeholder e robustez de
headers) ou documentei como pendência para verificar em produção — nada
disso mexeu em lógica de negócio.

## 1. PHP sem Composer
✅ OK. Nenhum arquivo em `backend-php/` usa `vendor/autoload.php` ou
`composer.json`. Todas as classes são carregadas por `require` explícito em
`index.php`. O cliente Stripe (`src/StripeClient.php`) fala com a API REST
via cURL puro, sem o SDK oficial. Nada a instalar no servidor além do PHP.

## 2. Extensão PDO MySQL
✅ Usada em `src/Database.php` (`new PDO("mysql:...")`). `pdo_mysql` é
praticamente universal em hospedagem compartilhada (inclusive Locaweb).
Adicionei uma checagem em `GET /api/db-test` (`ext_pdo_mysql`) para
confirmar que está habilitada assim que você publicar.

## 3. cURL para Stripe
✅ `src/StripeClient.php` usa `curl_init/curl_exec/curl_setopt_array`.
Extensão `curl` também quase universal; checagem incluída em
`GET /api/db-test` (`ext_curl`).

## 4. JWT
✅ Implementação própria em `src/Jwt.php` (HS256 via `hash_hmac`), sem
dependência externa. Requer apenas `hash_hmac`, `hash_equals`,
`base64_encode/decode` — todas nativas do PHP core, sempre disponíveis.

## 5. `.htaccess`
✅ Dois arquivos, um para cada camada:
- `pontilo-dashboard/public/.htaccess` (vai para a raiz do site): cache de
  assets, página 404 customizada, e as duas reescritas para as rotas
  dinâmicas renderizadas no cliente.
- `backend-php/.htaccess` (vai para `api/`): encaminha tudo para
  `index.php` e bloqueia acesso direto a `config.php`.

**Bug corrigido durante esta auditoria:** as reescritas de
`dashboard/classrooms/:id` e `ranking/professor/ranking/:classroomId`
apontavam para `.../placeholder/index.html`, mas o `next build` gera um
arquivo plano `.../placeholder.html` (sem subpasta). Corrigido para
apontar para o arquivo certo — validei rodando o build e conferindo que
`deploy/dashboard/classrooms/placeholder.html` e
`deploy/ranking/professor/ranking/placeholder.html` realmente existem.

## 6. URLs `/api/*`
✅ Preservadas 1:1 em relação ao backend Node original (mesmos caminhos,
mesmos verbos HTTP) — ver a lista completa registrada em
`backend-php/index.php`. Frontend e API ficam no mesmo domínio em
produção, então nenhuma chamada `fetch("/api/...")` no frontend precisou
mudar.

## 7. CORS
✅ Tratado em `index.php` (`Access-Control-Allow-Origin` calculado a partir
de `cors_origins` no `config.php`, com resposta a `OPTIONS`/preflight).
Como front e API ficam no mesmo domínio em produção, o navegador nem
costuma enviar `Origin` nesse caso — o CORS aqui existe principalmente
para desenvolvimento local (front em `localhost:3001`, API em
`localhost:8000`) ou se um dia a API for consumida de outro domínio.

## 8. Uploads
✅ Não existem. Nem o backend Node original nem o novo PHP recebem
arquivos (sem `multer` no `package.json` original, sem `move_uploaded_file`
no PHP). `pdf-lib`/`qrcode` no frontend são bibliotecas client-side
(geram PDF/QR code no navegador para impressão), não envolvem o backend.

## 9. Leitura/escrita de arquivos no servidor
✅ Nenhuma. O único arquivo que a API lê é `config.php` (configuração, via
`require`); não há logs em arquivo, cache em disco, nem geração de
arquivos. Compatível com hospedagem compartilhada sem permissões especiais.

## 10. Sessões/cookies
✅ Não usa nenhum dos dois. Autenticação é 100% via JWT Bearer token,
armazenado no `localStorage` do navegador (`lib/stores/auth-store.ts`,
zustand + persist) — herdado do comportamento original do Node, preservado
sem alteração. Não há `session_start()` em lugar nenhum do PHP.

## 11. HTTPS
⚠️ Depende da configuração da hospedagem. O código não força HTTP nem
HTTPS. Recomendado, mas não incluído automaticamente (para não mexer em
comportamento sem sua confirmação): um redirecionamento HTTP→HTTPS via
`.htaccess` na raiz, quando o certificado SSL da Locaweb estiver ativo
para `apppontos.com.br`. Posso adicionar se quiser.

## 12. Variáveis de configuração
✅ Centralizadas em `backend-php/config.php` (fora do controle de versão —
ver `.gitignore`), copiado de `config.example.php`. Nenhuma credencial,
segredo ou chave está hardcoded no código-fonte.

## 13. Webhooks Stripe
✅ `POST /api/payment/webhook` lê o corpo bruto via `php://input` e valida
a assinatura manualmente em `StripeClient::verifyWebhookSignature()`
(HMAC-SHA256 do header `Stripe-Signature`, com tolerância de 5 min).
**Robustez adicionada nesta auditoria:** o header `Stripe-Signature` (e o
`Authorization`, usado no JWT) agora são lidos por `Helpers::header()`,
que tenta `$_SERVER`, depois `getallheaders()`, depois
`apache_request_headers()` — proteção extra caso a configuração PHP da
Locaweb (FastCGI/PHP-FPM) não popule `$_SERVER['HTTP_*']` para headers
não padrão, problema comum em hospedagem compartilhada.
**Verificar depois de publicar:** cadastrar a URL
`https://apppontos.com.br/api/payment/webhook` no painel do Stripe e
disparar um evento de teste.

## 14. Compatibilidade do SQL com o MySQL da Locaweb
✅ `database/schema.sql` usa apenas recursos padrão desde MySQL 5.7 /
MariaDB 10.2: `ENGINE=InnoDB` explícito em todas as tabelas (para garantir
suporte a FK independente do engine padrão do servidor), tipo `JSON`
nativo (2 colunas: `student_avatar_configs.config`, `plans.features`),
`DATETIME(3)`, `ENUM`, `DECIMAL(10,2)`. Nenhuma sintaxe exclusiva de MySQL
8 (sem CTE, sem window function, sem `JSON_TABLE`).
**Verificar depois de publicar:** confirmar no painel da Locaweb qual
versão de MySQL/MariaDB está disponível para a hospedagem (para garantir
suporte a `JSON` nativo — praticamente certo em qualquer instalação atual,
mas vale confirmar antes de rodar `schema.sql`) e se o usuário do banco tem
permissão para `CREATE TABLE ... FOREIGN KEY` (padrão em bancos de
hospedagem compartilhada).

## 15. Estrutura final de `public_html`
✅ Gerada e conferida em `deploy/` (ver abaixo).

---

## Pasta `deploy/`

Gerada a partir de `npm run build` (frontend) + `backend-php/` (API),
pronta para ser enviada por FTP/SSH para `public_html/` na Locaweb:

```
deploy/
├── index.html, _next/, dashboard/, ranking/, login.html, ...   ← frontend (out/)
├── .htaccess                                                    ← cache + reescritas
├── 404.html
└── api/                                                         ← backend-php/
    ├── index.php
    ├── .htaccess
    ├── config.example.php   ← copie para config.php NO SERVIDOR e preencha
    └── src/
```

**Importante:** `deploy/api/config.php` não existe (de propósito — nunca
deve ser versionado nem gerado localmente com credenciais reais). No
servidor, depois de subir os arquivos:

```bash
cp api/config.example.php api/config.php
# edite api/config.php com host/usuário/senha do MySQL da Locaweb,
# um JWT_SECRET aleatório e as chaves do Stripe
```

Depois, rode `database/schema.sql` + `database/seed.sql` no MySQL da
Locaweb (phpMyAdmin ou `mysql` via SSH) e confirme com
`GET https://apppontos.com.br/api/db-test`.

**Nota:** `deploy/` é uma pasta de build local (não deveria ser
versionada) — considere adicionar `/deploy/` ao `.gitignore` se for
gerá-la novamente a cada deploy. Regenerar com:

```bash
cd pontilo-dashboard && npm run build && cd ..
rm -rf deploy && mkdir -p deploy/api
cp -r pontilo-dashboard/out/. deploy/
cp -r backend-php/. deploy/api/ && rm -f deploy/api/.gitignore
```
