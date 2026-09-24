# Prompt para gerar a logo do App Pontos (ChatGPT / DALL·E)

Cole o texto abaixo diretamente no ChatGPT (com geração de imagem ativada).

---

Crie um logo moderno, minimalista e vetorial para um aplicativo chamado **"App Pontos"**, um sistema de gamificação educacional usado por professores para dar pontos e recompensas a alunos (tipo "pontos de atitude/participação" representados por corações, estrelas e troféus), com ranking de turma e avatares personalizáveis para os alunos.

**Conceito**: um selo/emblema (badge) circular ou de cantos arredondados, transmitindo "conquista" e "progresso" — combine de forma simples e geométrica um elemento de **check/estrela** com um indicativo de **crescimento** (ex.: barras ascendentes ou uma seta sutil para cima). Não inclua um troféu completo nem um coração literal — algo mais abstrato e atemporal que sirva tanto para o ícone do app quanto para o cabeçalho do site.

**Paleta de cores** (usar exatamente estas cores):
- Cor primária: verde-azulado (teal) `#0D968B`
- Cor de destaque/secundária: âmbar/dourado `#F59E0B`
- Fundo: branco `#FFFFFF` ou transparente

**Estilo**:
- Flat design / vetorial, sem gradientes complexos, sem sombras realistas, sem efeitos 3D
- Formas geométricas simples, cantos arredondados, traços limpos
- Deve funcionar bem em tamanho pequeno (ícone de app de 48×48px) — nada de detalhes finos, texto ou elementos que se percam em escala reduzida
- Visual amigável e confiável, adequado para um público de professores e crianças/adolescentes em ambiente escolar — não infantil demais, não corporativo demais

**O que NÃO incluir**:
- Sem texto, letras ou tipografia dentro do ícone
- Sem fotos ou ilustrações realistas
- Sem múltiplos elementos concorrendo por atenção — um único símbolo central, forte e reconhecível
- Sem clichês genéricos de "app de gestão" (sem pastas, sem gráficos de pizza, sem apertos de mão)

**Formato de entrega**: gere a imagem em fundo branco liso, quadrada (proporção 1:1), centralizada, com margem de respiro ao redor do símbolo (para funcionar como ícone de app depois de cortado/exportado em diferentes tamanhos).

Gere 3 a 4 variações do conceito para eu escolher a melhor.

---

## Depois de gerar

Quando escolher a versão final, os arquivos que precisam ser substituídos são:

**Frontend web** (`pontilo-dashboard/public/`):
- `icon.png` (usado no header/logo do site)
- `favicon.ico`
- `apple-icon.png` (180×180)

**App mobile Flutter** (`Pontilo-App/`):
- `assets/images/icon.png` (usado na tela de login)
- Ícones de launcher do Android/iOS — precisam ser regenerados a partir da nova arte com uma ferramenta como o pacote `flutter_launcher_icons` (não é só substituir um arquivo; os ícones de launcher existem em vários tamanhos por densidade de tela)
