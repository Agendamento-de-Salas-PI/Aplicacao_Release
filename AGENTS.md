# AGENTS.md — Sistema de Agendamento de Salas (Fatec Jahu)

Este documento define o contexto arquitetural, as regras de negócio, os requisitos funcionais e o plano de ação prioritário para os agentes de IA (Google Antigravity / Code Assist) operando neste repositório no VS Code.

---

## 1. Visão Geral e Stack Tecnológica
- **Projeto:** Plataforma Web de Agendamento de Salas de Aula para a Fatec Jahu (Projeto Integrador - DSM).
- **Framework:** Next.js (App Router) com React e TypeScript (`src/app/`).
- **Estilização:** CSS Global (`src/app/globals.css`) + Tailwind CSS, seguindo o Manual de Identidade Visual do Centro Paula Souza (Vermelho CPS: `#b20d19` / `#B20000`, Cinza: `#666666`, Tipografia limpa).
- **ORM / Banco Futuro:** Prisma 8 (`src/prisma/contract.prisma` com PostgreSQL).
- **Estado Atual (Runtime Prototype):** Toda a persistência durante a execução (runtime) deve ocorrer de forma reativa e mutável dentro do **`src/context/AppContext.tsx`**, inicializada a partir de **`src/data/mockData.tsx`** e respeitando rigorosamente as interfaces de **`src/types/index.ts`**.

---

## 2. Regras de Ouro para o Agente
1. **Proibido "Fake Toasts":** Nenhuma interação principal (criar agendamento, filtrar agendamentos por mês no gestor, limpar filtros, aprovar/rejeitar/reagendar pedido, editar componentes de sala, registrar usuário) pode apenas disparar `notify("...")`. Toda ação DEVE mutar ou filtrar o estado global no `AppContext` primeiro e usar o `notify()` apenas como feedback visual da operação concluída.
2. **Persistência em Runtime:** Se um agendamento for aprovado, rejeitado ou colocado em negociação na rota `/gestor`, ou se uma nova sala/usuário/agendamento for alterado, essa mudança deve permanecer salva no `AppContext` ao navegar entre `/`, `/gestor`, `/perfil`, `/login` e `/registro`.
3. **Fidelidade às Tipagens do Prisma e TypeScript:** Qualquer novo dado inserido no estado mockado deve respeitar as interfaces de `src/types/index.ts` (`Usuario`, `Disciplina`, `Curso`, `Sala`, `Bloco`, `Agendamento`, `SalaEquipamento`, `SalaSoftware`).

---

## 3. Escopo Prioritário de Implementação (Metas Críticas)

### Meta 1: Motor de Mapa SVG Dinâmico, Zoom e Pan Desktop & Mobile (`FloorPlan`)
- **Arquivos SVG Obrigatórios:** O sistema deve utilizar obrigatoriamente os arquivos estáticos `/public/bloco-1.svg` (Bloco 1) e `/public/bloco-2.svg` (Bloco 2) como mapas visíveis no site.
- **Carregamento Dinâmico:** O componente `FloorPlan` deve carregar dinamicamente o arquivo SVG correspondente ao bloco selecionado (`bloco-1.svg` ou `bloco-2.svg`), parsear/renderizar sua estrutura XML/DOM e manter a interatividade nos elementos internos.
- **Mapeamento SVG -> Sala:** Os elementos `<rect>` dentro de `bloco-1.svg` e `bloco-2.svg` que possuem `id` correspondente ao campo `sala.codigoSvg` das salas cadastradas naquele bloco devem receber interatividade de clique/toque (`onClick`), navegação por teclado (`onKeyDown`), rótulos dinâmicos e classes de estado visual (`.room-shape`, `.selected`, `.busy` para Ocupada, `.soon` para Em breve, `.free` para Livre, e `.filtered-out`).
- **Interatividade de Câmera Desktop e Mobile (Touch, Pinch-to-Zoom e Pan):**
  - **Bloqueio de Scroll da Página no Mapa Mobile:** Aplicar `touch-action: none` (e `overscroll-behavior: contain`) no container do mapa (`.floor-wrap`) para impedir que o navegador role a página inteira enquanto o usuário interage com a planta no smartphone ou tablet.
  - **Mobile Pan (Arraste com 1 dedo):** Implementar handlers de toque (`onTouchStart`, `onTouchMove`, `onTouchEnd` ou `PointerEvents`) para que arrastar um dedo sobre o mapa mova suavemente a posição `(x, y)` da câmera, diferenciando toque rápido (`tap` < 5px de deslocamento, que seleciona a sala) de arraste (`pan`).
  - **Mobile Pinch-to-Zoom (Pinça com 2 dedos):** Calcular a distância euclidiana entre dois pontos de toque (`e.touches[0]` e `e.touches[1]`) em `onTouchMove` para aplicar o gesto natural de pinça (afastar dedos = zoom-in, aproximar dedos = zoom-out) respeitando os limites de escala (`0.6x` a `2.5x`).
  - **Desktop Zoom e Pan:** Manter suporte a `onWheel` (roda para cima = zoom-in, para baixo = zoom-out) e arraste com mouse (`onMouseDown`/`onMouseMove`/`onMouseUp`), sincronizados com os botões `+`, `−` e `⌖`.
- **Derivação do Mapa Simplificado e Grid (RF 205):**
  - A partir das salas mapeadas nos `<rect>` do SVG do bloco ativo, permitir alternar para o **Grid de Botões** derivado exatamente das salas pertencentes àquele bloco.

### Meta 2: Seleção de Múltiplos Blocos (Seletor Único à Direita)
- Configurar no `mockData` e no `AppContext` os **2 Blocos oficiais** vinculados aos arquivos `/public/bloco-1.svg` e `/public/bloco-2.svg`, com suas respectivas salas vinculadas por `blocoId` e `codigoSvg`.
- **Ajuste na Toolbar (`src/app/page.tsx`):** Remover qualquer `<select>` de troca de blocos localizado à esquerda ou no centro da barra. Manter **apenas** o seletor localizado à direita (com o rótulo `"Blocos do Campus"` escrito em cima) para alternar entre o Bloco 1 e o Bloco 2, atualizando imediatamente o SVG carregado, o Grid e a sala selecionada.

### Meta 3: Manipulação de Dados dos Blocos e Componentes das Salas pelo Gestor
- O usuário com perfil `GESTOR` deve poder editar os componentes/infraestrutura das salas de qualquer bloco (ex: alterar a capacidade de cadeiras, adicionar/remover ou mudar a quantidade de `SalaEquipamento` como Computadores, TV, Projetor, Ar-condicionado, e `SalaSoftware`).
- Implementar essa edição tanto no painel de detalhes da sala (quando logado como `GESTOR`) quanto em uma aba/modal de **"Gerenciar Blocos e Salas"** dentro de `/gestor`. Toda alteração atualiza o array global `rooms` no `AppContext`.

### Meta 4: Três Contas Padrões, Vínculo Professor -> Disciplina -> Curso e Bloqueio de Inativos
- **Conta Padrão Inicial (Aluno):** Ao entrar na aplicação ou realizar o login padrão sem especificar outra conta, o usuário autenticado por padrão deve ser a conta de **Aluno** (`gabriel.lima@fatec.sp.gov.br`, Role: `ALUNO`), e **não** a de Gestor.
- **Modelo de Domínio com `Disciplina` (`src/types/index.ts`):**
  - A entidade `Disciplina` liga o `Professor` ao `Curso` (`Disciplina` possui `cursoId` / `curso`, e `Professor` possui uma lista de `disciplinas: Disciplina[]` em vez de ligar-se diretamente ao curso).
  - Atualizar todos os mocks de professores em `src/data/mockData.tsx` e os componentes que leem dados docentes (ex.: `/perfil`, `/gestor` na edição/listagem de usuários, e modais de agendamento) para utilizar `disciplinas` vinculadas aos seus respectivos cursos (`DSM`, `GTI`, `LOG`, `GE`).
- **Três Contas Padrões Pré-Configuradas (`mockData` e `/login`):**
  1. **Aluno Padrão (Default):** `gabriel.lima@fatec.sp.gov.br` (Senha: `123456`, Role: `ALUNO`, RA: `1460482213021`, Curso: `DSM`, Semestre: `4`) — Pode solicitar agendamentos de sala (**RF 402**), solicitar horário sem sala específica (**RF 401**) e responder propostas de reagendamento ou alocação alternativa (**RF 408/409**).
  2. **Professor Padrão:** `marina.prado@fatec.sp.gov.br` (Senha: `123456`, Role: `PROFESSOR`, RA: `P-10482`, Disciplinas vinculadas a cursos ex.: *Engenharia de Software II (DSM)*, *Banco de Dados Relacional (DSM)*) — Solicitações recebem flag de **Prioridade Docente (RF 403)**, exigem seleção de uma de suas disciplinas ao agendar, podem visualizar a autoria dos agendamentos nas salas (**RF 204**) e responder propostas de alteração.
  3. **Gestor Padrão:** `bruno.lallo@fatec.sp.gov.br` (Senha: `123456`, Role: `GESTOR`, RA: `G-2026001`) — Acesso total a `/gestor`, aprovação de pedidos, edição de salas/blocos e edição/ativação/inativação de usuários.
- **Remoção de "Trocar conta" na Página de Perfil (`/perfil`):**
  - Remover qualquer botão, card ou seção de **"Trocar conta"** dentro de `src/app/perfil/page.tsx`. Na página de perfil, a troca de usuário deve ocorrer exclusivamente saindo da conta (`Sair da conta` -> redirecionando para `/login`).
- **Bloqueio de Usuários Inativados:**
  - Quando um usuário estiver com status inativo (`emailValidado === false` ou flag `ativo === false`), ele **não pode criar novos pedidos de agendamento** (nem com sala definida, nem sem sala definida).
  - Tanto na interface (`DetailModal` e botão de agendar sem sala) quanto dentro da função `createBookingRequest` no `AppContext`, verificar se a conta está ativa; caso esteja inativada, bloquear a ação e exibir uma mensagem clara informando que contas inativas não podem solicitar agendamentos.

### Meta 5: Separação das Rotas `/login` e `/registro` (RF 101 a RF 105)
- **Separação em Duas Rotas Distintas:**
  - **`/login` (`src/app/login/page.tsx`):** Deve conter exclusivamente o fluxo de autenticação (login por e-mail/senha e botões de acesso rápido das contas demonstrativas) e um link/botão claro para navegar até `/registro` (*"Não tem conta? Cadastre-se"*).
  - **`/registro` (`src/app/registro/page.tsx`):** Nova rota dedicada exclusivamente ao cadastro de novos usuários (**RF 102 a RF 105**), com seleção de perfil (`ALUNO`, `PROFESSOR`, `GESTOR`), campos condicionais de `curso` e `semestre` quando `ALUNO` (**RF 103**), seleção de disciplinas quando `PROFESSOR`, e link para retornar a `/login` (*"Já possui conta? Entrar"*).
  - Atualizar quaisquer links ou referências no `Header` (`src/components/Header.tsx`) e nas páginas para apontarem corretamente para `/login` e `/registro`.
- **Criação Real no Runtime:** Submeter o formulário em `/registro` deve criar um novo objeto `Usuario` real ativo no array `users` do `AppContext` e autenticar automaticamente o usuário recém-criado.

### Meta 6: Criação Real de Agendamentos, Seleção de Disciplina Docente, Conflitos e Solicitação Sem Sala (RF 401 e RF 402)
- **Seleção Obrigatória de Disciplina para Professores (`DetailModal` e Agendamento Sem Sala):**
  - Quando o usuário logado for `PROFESSOR`, o formulário de solicitação de agendamento (tanto no `DetailModal` de uma sala quanto na solicitação de horário sem sala definida) deve exibir um seletor (`<select>`) listando as **disciplinas ministradas por aquele professor** (exibindo o nome da disciplina e o curso associado, ex: `"Engenharia de Software II — DSM"`), salvando `disciplinaId` e `disciplina` no objeto `Agendamento` criado.
  - Quando o solicitante for `ALUNO` ou `GESTOR` (sem vínculo de aula), `disciplinaId` e `disciplina` permanecem `null`.
- **Exibição do Nome da Disciplina nos Horários Agendados:**
  - Na agenda da sala (`DetailModal` / lista de horários do dia), nos cards de solicitações em `/gestor` e em `/perfil`, sempre que um agendamento pertencer a um professor e possuir `disciplina` vinculada, exibir claramente o **nome da disciplina** (ex: badge ou subtítulo com o nome da disciplina e curso) junto ao horário reservado.
- **Bloqueio de Datas e Horários Passados:** Não permitir selecionar nem agendar em datas anteriores à data atual do usuário (`new Date()`), nem em faixas horárias que já tenham passado no dia de hoje.
- **Bloqueio de Conflito de Horários:** Ao selecionar uma sala e uma data para agendar, verificar os agendamentos existentes no `AppContext` com status `APROVADO` ou `PENDENTE` naquele dia/sala e **filtrar ou desabilitar** as faixas horárias já ocupadas.
- **Solicitação de Horário Sem Sala Definida (RF 401) com Metadados Estruturados:**
  - Ler e salvar os filtros ativos no `FilterPanel` (`requisitosFiltro?: { minCadeiras: number; equipamentos: string[]; software: string }`) e, se for professor, a `disciplinaId` selecionada (`salaId: null`, `sala: null`).

### Meta 7: Persistência, Filtro Mensal Real no Gestor, Modal de Alocação e Negociação (RF 405 a RF 410)
- Os agendamentos NÃO podem ficar em um `useState` local dentro de `src/app/gestor/page.tsx`. Eles devem viver no `AppContext` (`requests`, `judgeBookingRequest`, `respondToProposal`, `createBookingRequest`).
- **Filtro Funcional de Mês no Topo Direito do Painel do Gestor (`/gestor`):**
  - Seletor funcional de mês/ano iniciado no mês corrente do usuário, filtrando em tempo real todos os agendamentos exibidos no painel do gestor (`Pendentes`, `Aprovados`, `Rejeitados`, `Em Negociação` e contadores).
- **Aprovação de Solicitações Sem Sala Definida (Compatível vs. Fora dos Filtros):**
  - Quando o Gestor clicar em **"Aprovar"** em uma solicitação sem sala (`salaId === null`), abrir o Modal em Grid exibindo as salas livres naquela data/horário (destacando as compatíveis com `requisitosFiltro` e permitindo selecionar também salas fora dos filtros).
  - Se a sala escolhida for compatível com os filtros, aprova imediatamente (`"APROVADO"`). Se estiver fora dos filtros, envia proposta ao solicitante (`"EM_NEGOCIACAO"`) com opção de **Aceitar** ou **Rejeitar**; se o usuário rejeitar (tanto alocação fora dos filtros quanto reagendamento), o pedido retorna para `"PENDENTE"` no Gestor com aviso visual para refazer o julgamento.

### Meta 8: Filtragem Reativa Instantânea, Bloqueio de Datas/Horários Passados e Busca de Software (RF 301 e RF 302)
- **Limitação à Data e Horário Atual do Usuário:** Data inicial padrão = hoje (`YYYY-MM-DD`), `min={todayStr}` nos inputs de data, e desabilitação/ocultação de faixas horárias já passadas quando `dateFilter === todayStr`.
- **Filtragem Instantânea e Buscador de Software:** Sem botão `"Aplicar filtros"`, filtragem imediata em `onChange` e `<input id="software">` controlado buscando *case-insensitive* nos softwares das salas.

### Meta 9: Padronização de Horários Oficiais e Identidade Visual do Header
- **Intervalos de Tempo Oficiais:** Usar exclusivamente as 6 faixas horárias fixas da Fatec Jahu (`07:45 — 09:25`, `09:30 — 11:10`, `11:20 — 13:00`, `17:20 — 19:00`, `19:00 — 20:40`, `20:50 — 22:30`).
- **Logo Oficial no Header (`Brand` / `Header`):** Utilizar `/public/logo_fatec_pb.png` escalada proporcionalmente (`max-height: 36px; width: auto; object-fit: contain`) sem alterar a altura do header (`72px`).

### Meta 10: Qualidade de Vida, Posicionamento Responsivo do Botão "Ver Sala X" e Scroll Lock Mobile (RNF 102)
- **Posicionamento Relativo/Responsivo do Botão `"Ver Sala X"` (`FloorPlan` / `page.tsx`):**
  - O botão flutuante `"Ver Sala X"` (que fica no canto superior direito da área do mapa) **não pode usar `position: fixed` nem ficar ancorado à janela do navegador**, pois quando um banner/notificação de remarcação ou proposta pendente aparece no topo da página empurrando o conteúdo para baixo, o botão ficava desalinhado ou sobreposto.
  - Ele deve estar posicionado de forma **relativa ao container interno do mapa** (`position: absolute; top: 12px; right: 12px` dentro de um wrapper `.map-stage` / `.floor-wrap` com `position: relative`), garantindo que ele desça e acompanhe perfeitamente o mapa sempre que banners de notificação surgirem ou desaparecerem no topo da tela.
- **Legibilidade e Largura do Painel/Modal de Detalhes no Desktop:** Aumentar largura (`430px`–`460px`) e escala tipográfica dos horários e metadados no desktop (`>= 1024px`).
- **Estado Inicial Fechado e Scroll Lock Mobile:** `showDetails` inicia `false` em desktop e mobile; ao abrir em telas `< 1024px`, travar o scroll do `document.body` (`overflow: hidden`) para evitar rolagem da página de fundo.

### Meta 11: Dados Mockados Dinâmicos Conscientes do Tempo Atual e Base Populada (`src/data/mockData.tsx`)
- **Agendamentos Mockados Relativos ao Relógio Atual do Usuário:**
  - Gerador dinâmico baseado em `new Date()` sem datas fixas no passado: se uma faixa horária de hoje já tiver passado em relação ao relógio do navegador, avançar automaticamente aquele agendamento para amanhã (`+1 dia`).
  - Popular com ~15 usuários (incluindo professores com múltiplas `disciplinas` vinculadas a cursos e alunos inativos) e ~20 agendamentos variados no mês atual e próximo mês (incluindo reservas docentes com `disciplina` preenchida).

---

## 4. Roteiro Passo a Passo Recomendado para o Agente Executar

Ao aplicar incrementos sobre o código já existente, execute apenas as alterações necessárias nos arquivos alvo:

1. **Passo 1 (`src/types/index.ts`, `src/data/mockData.tsx` e `src/context/AppContext.tsx`):**
   - Garantir que `Professor` e `Usuario` utilizem `disciplinas: Disciplina[]` (onde cada `Disciplina` referencia seu `Curso`) e que `Agendamento` suporte `disciplinaId?: number | null` e `disciplina?: Disciplina | null`.
   - Atualizar todos os mocks de professores e agendamentos docentes em `src/data/mockData.tsx` para refletir o vínculo `Professor -> Disciplina -> Curso` e atualizar `createBookingRequest` no `AppContext.tsx` para persistir a disciplina selecionada.
2. **Passo 2 (`src/components/DetailModal.tsx`, `src/app/gestor/page.tsx` e `src/app/perfil/page.tsx`):**
   - No `DetailModal.tsx` (e na solicitação sem sala), exibir o `<select>` de **Disciplina** quando o usuário logado for `PROFESSOR`, e exibir o **nome da disciplina** nos horários já agendados por professores na agenda da sala.
   - Atualizar `/gestor` e `/perfil` para exibir/editar as disciplinas dos professores e mostrar o nome da disciplina nos cards de agendamento docente.
3. **Passo 3 (`src/components/FloorPlan.tsx`, `src/app/page.tsx` e `src/app/globals.css`):**
   - Corrigir o posicionamento do botão `"Ver Sala X"` no canto superior direito do mapa para que ele fique ancorado relativamente ao container do mapa (`position: relative` no wrapper / `position: absolute` no botão), descendo organicamente junto com o mapa sempre que houver uma notificação de remarcação/proposta no topo da página.