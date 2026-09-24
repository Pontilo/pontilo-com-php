# Rollout de produção — do zero (banco → API → dashboard → APK)

Checklist único, direto, cobrindo os 3 repositórios:
- `pontilo-com-php` (este repo): API PHP + dashboard Next.js
- `Pontilo-App` (repo separado): app mobile Flutter

Ver também `DEPLOY.md` (deploy web isolado) e `DEPLOY_AUDIT.md` (auditoria de
compatibilidade com a Locaweb).

---

## 0. Pré-requisitos

- Acesso ao painel Locaweb + SSH liberado
- PHP 8.1+ selecionado no painel (não o padrão antigo, se houver)
- Domínio `apppontos.com.br` apontando para a hospedagem, com SSL ativo
- Node 18+ e `npm` local (build do frontend)
- Flutter SDK local (build do APK) — `flutter doctor` sem erros de Android toolchain

---

## 1. Banco de dados (MySQL, uma vez)

No painel Locaweb: criar banco MySQL + usuário, anotar host/nome/usuário/senha.

```bash
mysql -u SEU_USUARIO -p SEU_BANCO < database/schema.sql
mysql -u SEU_USUARIO -p SEU_BANCO < database/seed.sql
```

Sem `mysql` via SSH: importar os dois arquivos pelo phpMyAdmin do painel.

---

## 2. API + Dashboard (deploy via Git)

Local:

```bash
cd pontilo-dashboard && npm run build && cd ..

rm -rf deploy && mkdir -p deploy/api
cp -r pontilo-dashboard/out/. deploy/
cp -r backend-php/. deploy/api/ && rm -f deploy/api/.gitignore

cd deploy
git init -q
git add -A
git commit -q -m "deploy $(date +%Y-%m-%d_%H-%M)"
git remote add origin https://github.com/Pontilo/pontilo-com-php.git 2>/dev/null || true
git push -f origin HEAD:deploy
cd ..
```

Servidor (primeira vez):

```bash
ssh usuario@apppontos.com.br
cd public_html
rm -rf * .[!.]*

git init
git remote add origin https://github.com/Pontilo/pontilo-com-php.git
git fetch origin deploy
git checkout -f deploy

cp api/config.example.php api/config.php
nano api/config.php   # DB_HOST/DB_NAME/DB_USER/DB_PASSWORD, jwt_secret, stripe
```

Testar:

```bash
curl -s https://apppontos.com.br/api/health
curl -s https://apppontos.com.br/api/db-test
```

Atualizações seguintes (servidor):

```bash
cd public_html && git fetch origin deploy && git reset --hard origin/deploy
```

---

## 3. Stripe (se o plano premium estiver ativo)

Painel Stripe → Webhooks → endpoint `https://apppontos.com.br/api/payment/webhook`
→ copiar o "signing secret" para `stripe.webhook_secret` em `api/config.php`.

**Teste obrigatório**: disparar um evento de teste no painel Stripe e conferir
o log/resposta. Hospedagem compartilhada às vezes bloqueia conexão de saída
do PHP para APIs externas — se `create-checkout-session` falhar com erro de
conexão (não erro do Stripe), abrir chamado na Locaweb pedindo liberação de
saída HTTPS (porta 443) para `api.stripe.com`.

---

## 4. App mobile (Flutter) — gerar o APK assinado

Repo: `https://github.com/Pontilo/Pontilo-App.git`

Correções já aplicadas no código (não repetir):
- `lib/config/api_config.dart` → `baseUrl` agora aponta para
  `https://apppontos.com.br/api` (antes: domínio antigo `pontilo.com.br`)
- `AndroidManifest.xml` (main) → faltava a permissão `INTERNET`; sem ela o
  **release** funcionava em debug mas não conseguia fazer nenhuma chamada de
  rede instalado de verdade (a permissão só existia no manifest de debug)
- `applicationId`/`namespace` → trocado de `com.example.pontilo` (placeholder
  do `flutter create`, rejeitado pela Play Store) para `br.com.apppontos.pontilo`
- Assinatura de release configurada via `android/key.properties` (não versionado)
- Gradle/AGP modernizados (8.3/AGP 7.3-8.1 → Gradle 8.14/AGP 8.11.1, migrado
  para `build.gradle.kts`/`settings.gradle.kts`) — o projeto estava desatualizado
  em relação à versão do Flutter instalada e `flutter build apk` simplesmente
  não compilava antes desta correção. Testado: AGP/Gradle 9.x (o "mais novo"
  que o Flutter 3.47 oferece por padrão) quebra com plugins do próprio
  ecossistema Flutter (`path_provider_android`) que ainda não migraram —
  ficamos na versão mínima suportada (8.14/8.11.1) por ser mais compatível
  hoje. O build mostra um aviso dizendo que essa versão "será descontinuada
  em breve" — ignorar por enquanto, é só um aviso.
- `google_fonts` desatualizado (`^6.2.1` → `^8.2.1`) — a versão antiga não
  compilava mais com o Dart/Flutter atual (erro de constant evaluation)
- `Clipboard.setData` real no botão "copiar link" da tela de login (antes só
  mostrava a mensagem de sucesso sem copiar nada)
- Timeout de 15s + mensagens de erro de rede mais claras em `ApiConfig`

**Validado nesta auditoria**: `flutter build apk --release` compilando com
sucesso (64.4MB), com `br.com.apppontos.pontilo` e a permissão `INTERNET`
confirmados no APK final (`aapt dump badging`).

Se o build falhar com erro de arquivo travado/"Unable to delete directory"
no Windows (processo Gradle anterior ainda rodando): `cd android && ./gradlew
--stop`, apagar a pasta `build/` e rodar de novo.

### 4.1 Gerar o keystore (uma vez, guardar para sempre)

```bash
cd Pontilo-App
keytool -genkey -v -keystore android/app/apppontos-release.jks \
  -keyalg RSA -keysize 2048 -validity 10000 -alias apppontos
```

Preencher as perguntas (nome, organização etc.) e **duas senhas** (keystore
e chave — anotar em local seguro, ex. cofre de senhas; perder o keystore
significa não poder mais atualizar o app publicado com o mesmo `applicationId`).

### 4.2 Configurar `android/key.properties`

```bash
cp android/key.properties.example android/key.properties
nano android/key.properties
```

```
storePassword=<senha do keystore>
keyPassword=<senha da chave>
keyAlias=apppontos
storeFile=apppontos-release.jks
```

### 4.3 Build

```bash
flutter pub get
flutter build apk --release
```

APK gerado em: `build/app/outputs/flutter-apk/app-release.apk`

Para publicar na Play Store (opcional, formato exigido pela loja):

```bash
flutter build appbundle --release
# build/app/outputs/bundle/release/app-release.aab
```

### 4.4 Instalar/testar

```bash
adb install build/app/outputs/flutter-apk/app-release.apk
```

Ou enviar o `.apk` diretamente (WhatsApp, Drive, etc.) para instalação manual
no Android (o usuário precisa permitir "instalar de fontes desconhecidas").

**Teste mínimo**: login de professor, atribuir ponto por código, escanear QR,
pesquisar pontos por turma — todos batem contra `apppontos.com.br/api` agora.

---

## 5. Checklist de "firewall" / rede (depois de publicar)

| Sintoma | Causa provável | Ação |
|---|---|---|
| App não conecta em nada (release) | `INTERNET` faltando no manifest | Já corrigido nesta rodada |
| App funciona no emulador/debug mas não no APK instalado | mesmo motivo acima | Reinstalar com o APK gerado após a correção |
| `create-checkout-session` falha só em produção | Locaweb bloqueando saída HTTPS do PHP | Abrir chamado pedindo liberação para `api.stripe.com:443` |
| API responde 403/406 só quando chamada pelo app (não pelo navegador) | WAF/mod_security da Locaweb filtrando por User-Agent/padrão de corpo | Verificar log do ModSecurity no painel; pedir exceção para `/api/*` |
| Certificado inválido no app | SSL não propagado/expirado no domínio | `curl -v https://apppontos.com.br/api/health` de fora da rede da Locaweb |
| CORS no navegador (dashboard) | Domínio do frontend fora de `cors_origins` | Ajustar `api/config.php` → `cors_origins` |

CORS não afeta o app mobile (só navegadores enviam `Origin`/preflight).
