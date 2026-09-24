# Notas de migração — Node/Prisma/PostgreSQL → PHP/MySQL

Este documento registra as decisões e inconsistências encontradas durante a
migração do backend (`Pontilo-Backend`, Node/Express/Prisma) para
`backend-php` (PHP/PDO/MySQL), conforme pedido em `plano.md`. Nenhuma delas
foi corrigida silenciosamente — o comportamento observável foi preservado;
aqui vai o porquê e o que considerar.

## 1. Frontend real é Next.js, não Vite

`plano.md` descreve o frontend como "React + Vite + TypeScript", mas o
projeto real (`pontilo-dashboard/pontilo-dashboard`) é Next.js 15 (App
Router). Decisão tomada com o usuário: manter Next.js, configurado para
**export estático** (`output: 'export'` em `next.config.mjs`). O build
(`npm run build`) continua gerando arquivos estáticos (agora em `out/` em
vez de `dist/`), publicáveis em `public_html/` — mesmo espírito do pedido
original, sem reescrever telas/componentes.

## 2. `app/api/*` (Next.js) era um BFF fino — removido

As rotas `app/api/**/route.ts` do Next.js só repassavam a chamada para o
backend Express (`fetch(apiUrl(...))`), sem lógica própria — exceto o item
3 abaixo. Como o export estático não suporta Route Handlers dinâmicos, essa
camada foi removida (junto com `middleware.ts`, que só fazia checagem de
método/tamanho de payload, sem relevância para hospedagem estática). Como
a API PHP responde nos mesmos caminhos (`/api/...`) e no mesmo domínio, os
pontos de chamada no frontend (`fetch("/api/...")`, `apiUrl(...)`) **não
precisaram ser alterados**.

## 3. `/api/ranking/getStudentFromClassroom`: mock quebrava a tela (CORRIGIDO)

- O backend Express tem uma rota real `POST /ranking/getStudentFromClassroom`
  (autenticada como aluno) que busca um aluno pelo nome dentro de uma turma.
- O proxy Next.js no **mesmo caminho** (`app/api/ranking/getStudentFromClassroom/route.ts`)
  nunca chamava esse endpoint: ele gerava pontos **100% aleatórios/mockados**
  a partir de `studentCode`, `quarter` e `discipline`, usados por
  `app/ranking/pontos/page.tsx`. Esse mock foi inicialmente preservado em
  `RankingController::getStudentFromClassroomMock()` para manter o
  comportamento observável em produção.
- **Problema real encontrado após o deploy**: o mock nunca devolvia
  `student.name`, `student.classroom` nem `classroom.teacher`, campos que
  `app/ranking/pontos/page.tsx` lê diretamente (sem optional chaining) —
  todo aluno que tentava ver seus pontos na tela "Visualizar Pontos do
  Aluno" recebia `TypeError: Cannot read properties of undefined (reading
  'name')` e a tela quebrava. Além disso, mostrar pontos **aleatórios**
  sob o nome real do aluno nunca foi um comportamento desejável — era uma
  falha do app original, não uma feature.
- **Correção**: `RankingController::getStudentFromClassroom()` agora
  autentica o aluno via JWT (`Auth::requireStudent()`, igual às outras
  rotas de aluno) e devolve dados reais: aluno, turma e professor do banco,
  e os pontos reais (`points`) do aluno filtrados por uma janela de meses
  do ano corrente (não existe uma coluna "trimestre" no schema, então
  `quarter` 1–4 mapeia para Jan–Mar/Abr–Jun/Jul–Set/Out–Dez). O parâmetro
  `discipline` continua sendo aceito pelo formulário (não há coluna de
  disciplina em `points`, então ele não filtra nada — é apenas validado
  como presente por compatibilidade com a tela).

## 4. `GET /api/ranking` (Next.js) — rota morta, não portada

`app/api/ranking/route.ts` chamava `GET /api/students` do backend **sem
enviar o header `Authorization`**, embora esse endpoint exija token
(`authenticateToken`). Ou seja, a chamada sempre falhava com 401 em
produção. Nenhuma página do frontend chama essa rota. Não foi portada para
o PHP (comportamento observável preservado: a rota simplesmente não existe).

## 5. `deleteStudent` e as tabelas de avatar — FK ajustada para CASCADE

O controller Node `deleteStudent` apaga os `Point`s do aluno manualmente,
mas nunca limpa `StudentAvatarItem`/`StudentAvatarConfig` antes de excluir o
`Student`. Como **todo** aluno criado via `createStudent` sempre ganha uma
config de avatar e 11 itens desbloqueados por padrão, uma FK
`ON DELETE RESTRICT` nessas tabelas quebraria a exclusão de qualquer aluno.
**Decisão**: no `database/schema.sql`, essas duas FKs usam
`ON DELETE CASCADE` (e o `StudentController::delete` do PHP também limpa
essas tabelas explicitamente, por segurança/clareza).

## 6. Senha do aluno: texto puro, sem hash

Diferente do professor (bcrypt), a senha do aluno é armazenada em texto
puro no banco (`password` VARCHAR, default `'123'`) e comparada com `===`
(`studentLogin`, `updateOwnPassword`). Isso foi preservado exatamente assim
no PHP. É uma característica do sistema original (provavelmente para
simplificar a recuperação de senha de crianças), não um bug de tradução —
mas vale uma revisão de segurança futura se o usuário achar necessário.

## 7. `POST /students/:studentId/avatar/add-points` é público (sem autenticação)

No Express, essa rota não tem `authenticateToken`/`authenticateStudent` —
qualquer requisição pode somar ou subtrair pontos de avatar de qualquer
aluno, bastando saber o ID. Preservado assim no PHP
(`AvatarController::addPoints`). **Recomenda-se revisão de segurança** antes
de divulgar a API publicamente, mas a mudança de comportamento não foi feita
unilateralmente aqui.

## 8. `GET /api/classrooms/:id`: checagem de dono só vale para token de professor

Em `ClassroomController::getById` (Node e PHP), o bloqueio de acesso só é
aplicado quando `user.type === 'teacher'` e a turma não é dele. Um token de
**aluno** autenticado (qualquer aluno, de qualquer turma) consegue chamar
essa rota para qualquer `classroomId` sem bloqueio. Preservado fielmente;
mesma recomendação de revisão de segurança do item 7.

## 9. `getClassroomsByTeacher`: "totalPoints" reflete só o último ponto — CORRIGIDO

Em `GET /api/teachers/:teacherId/classrooms`, a consulta original (Node)
buscava apenas o **último** ponto de cada aluno dentro do filtro de período
(`take: 1`) e usava esse único valor como `totalPoints` — não era a soma
real dos pontos do período. Isso foi inicialmente preservado fielmente no
PHP, mas o app mobile (`Pontilo-App`) usa exatamente esse campo para
ordenar o ranking de alunos em "Pesquisar Pontos" — um bug real de
implementação (não uma regra de negócio), que produzia um ranking incorreto
também no app. A pedido explícito do usuário, `ClassroomController::getByTeacher`
foi corrigido para somar todos os pontos do período em `totalPoints`,
mantendo `lastPoint` como campo separado. `pointsCount` passou a refletir
a contagem dentro do período filtrado (antes era sempre "desde sempre",
inconsistente com os outros campos do mesmo endpoint).

## 10. IDs (`cuid()` → string gerada pela aplicação)

O Prisma usa `cuid()` como padrão de chave primária. O MySQL não tem um tipo
equivalente nativo — `database/schema.sql` usa `VARCHAR(30)`, e
`backend-php/src/Id.php` gera identificadores únicos (timestamp em base36 +
bytes aleatórios) no mesmo formato de string. **Ao migrar dados existentes,
mantenha os IDs originais** (são apenas strings opacas, a aplicação não
depende do formato interno do cuid).

## 11. Preço/valores monetários: `Float` (Prisma) → `DECIMAL(10,2)` (MySQL)

Adaptação recomendada para evitar erros de arredondamento; não altera
nenhuma regra de negócio (os valores continuam sendo os mesmos números).

## 12. Versão da API do Stripe

O backend Node fixava `apiVersion: '2025-08-27.basil'` no SDK oficial. O
cliente PHP (`backend-php/src/StripeClient.php`) fala diretamente com a API
REST do Stripe sem fixar uma versão (usa a versão configurada na conta
Stripe). Os fluxos usados (checkout, portal do cliente, webhooks) são
estáveis entre versões recentes da API — isso evita depender do SDK oficial
via Composer, mais simples para hospedagem compartilhada.

## 13. Rotas `app/api/students/[studentId]/avatar/**` do Next — já eram inalcançáveis

O frontend tinha rotas de proxy parametrizadas por `studentId`
(`app/api/students/[studentId]/avatar/config|unlock|unlocked/route.ts`) que
chamavam `students/${studentId}/avatar/...` no backend Express. **Esse
caminho nunca existiu no Express** (que só registra
`/students/avatar/config` etc., sem `:studentId`, pegando o aluno pelo
token) — ou seja, essas rotas do Next sempre retornavam 404 em produção.
Não foram portadas (nenhum comportamento observável foi perdido).

## 14. `/dashboard/classrooms/[id]`: `params` como prop não funciona no export estático — CORRIGIDO

Achado em produção (não em build): a página usava `params: Promise<{id}>`
recebido como prop (padrão Next.js normal), mas em export estático essa
prop fica **travada no valor gerado em build time** (`"placeholder"`) para
qualquer visita real ao HTML reaproveitado via `.htaccess` — diferente de
`useParams()` (hook), que lê o segmento da URL do navegador de verdade após
a hidratação. Sintoma real: `GET /api/classrooms/placeholder` (404) e,
consequentemente, criar aluno enviando `classroomId: "placeholder"` (403,
turma inexistente). A outra rota dinâmica
(`/ranking/professor/ranking/[classroomId]`) já usava `useParams()` desde
o início e nunca teve esse problema. Corrigido trocando `classroom-page-client.tsx`
para `useParams()` também — mesma abordagem nas duas rotas dinâmicas agora.
