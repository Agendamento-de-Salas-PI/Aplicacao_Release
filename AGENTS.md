# AGENTS.md — Sistema de Agendamento de Salas (Fatec Jahu)

Este documento define o contexto arquitetural, as regras de negócio, os requisitos funcionais e o plano de ação prioritário para os agentes de IA (Google Antigravity / Code Assist) operando neste repositório no VS Code.

---

## 1. Visão Geral e Stack Tecnológica
- **Projeto:** Plataforma Web de Agendamento de Salas de Aula para a Fatec Jahu (Projeto Integrador - DSM).
- **Framework:** Next.js (App Router) com React e TypeScript (`src/app/`).
- **Estilização:** CSS Global (`src/app/globals.css`) + Tailwind CSS, seguindo o Manual de Identidade Visual do Centro Paula Souza (Vermelho CPS: `#b20d19` / `#B20000`, Cinza: `#666666`, Tipografia limpa).
- **ORM / Banco Futuro:** Prisma 8 (`src/prisma/contract.prisma` com PostgreSQL).
- **Estado Atual (Runtime Prototype):** Toda a persistência durante a execução (runtime) deve ocorrer de forma reativa e mutável dentro do **`src/context/AppContext.tsx`**, inicializada a partir de **`src/data/mockData.tsx`** (ou `mockData.ts`) e respeitando rigorosamente as interfaces de **`src/types/index.ts`**.

---

## 2. Regras de Ouro para o Agente
1. **Proibido "Fake Toasts":** Nenhuma interação principal (criar agendamento, filtrar agendamentos por mês no gestor, limpar filtros, aprovar/rejeitar/reagendar pedido, editar componentes de sala, registrar usuário) pode apenas disparar `notify("...")`. Toda ação DEVE mutar ou filtrar o estado global no `AppContext` primeiro e usar o `notify()` apenas como feedback visual da operação concluída.
2. **Persistência em Runtime:** Se um agendamento for aprovado, rejeitado ou colocado em negociação na rota `/gestor`, ou se uma nova sala/usuário/agendamento for alterado, essa mudança deve permanecer salva no `AppContext` ao navegar entre `/`, `/gestor`, `/perfil`, `/login` e `/registro`.
3. **Fidelidade às Tipagens do Prisma:** Qualquer novo dado inserido no estado mockado deve respeitar as interfaces de `src/types/index.ts` (`Usuario`, `Sala`, `Bloco`, `Agendamento`, `SalaEquipamento`, `SalaSoftware`).

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

### Meta 4: Três Contas Padrões, Conta Inicial de Aluno, Bloqueio de Inativos e Perfil Limpo
- **Conta Padrão Inicial (Aluno):** Ao entrar na aplicação ou realizar o login padrão sem especificar outra conta, o usuário autenticado por padrão deve ser a conta de **Aluno** (`gabriel.lima@fatec.sp.gov.br`, Role: `ALUNO`), e **não** a de Gestor.
- **Três Contas Padrões Pré-Configuradas (`mockData` e `/login`):**
  1. **Aluno Padrão (Default):** `gabriel.lima@fatec.sp.gov.br` (Senha: `123456`, Role: `ALUNO`, RA: `1460482213021`, Curso: `DSM`, Semestre: `4`) — Pode solicitar agendamentos de sala (**RF 402**), solicitar horário sem sala específica (**RF 401**) e responder propostas de reagendamento ou alocação alternativa (**RF 408/409**).
  2. **Professor Padrão:** `marina.prado@fatec.sp.gov.br` (Senha: `123456`, Role: `PROFESSOR`, RA: `P-10482`) — Solicitações recebem flag de **Prioridade Docente (RF 403)**, pode visualizar a autoria dos agendamentos nas salas (**RF 204**) e responder propostas de alteração.
  3. **Gestor Padrão:** `bruno.lallo@fatec.sp.gov.br` (Senha: `123456`, Role: `GESTOR`, RA: `G-2026001`) — Acesso total a `/gestor`, aprovação de pedidos, edição de salas/blocos e edição/ativação/inativação de usuários.
- **Remoção de "Trocar conta" na Página de Perfil (`/perfil`):**
  - Remover qualquer botão, card ou seção de **"Trocar conta"** dentro de `src/app/perfil/page.tsx`. Na página de perfil, a troca de usuário deve ocorrer exclusivamente saindo da conta (`Sair da conta` -> redirecionando para `/login`).
- **Bloqueio de Usuários Inativados:**
  - Quando um usuário estiver com status inativo (`emailValidado === false` ou flag `ativo === false`), ele **não pode criar novos pedidos de agendamento** (nem com sala definida, nem sem sala definida).
  - Tanto na interface (`DetailPanel` e botão de agendar sem sala) quanto dentro da função `createBookingRequest` no `AppContext`, verificar se a conta está ativa; caso esteja inativada, bloquear a ação e exibir uma mensagem clara informando que contas inativas não podem solicitar agendamentos.

### Meta 5: Separação das Rotas `/login` e `/registro` (RF 101 a RF 105)
- **Separação em Duas Rotas Distintas:**
  - **`/login` (`src/app/login/page.tsx`):** Deve conter exclusivamente o fluxo de autenticação (login por e-mail/senha e botões de acesso rápido das contas demonstrativas) e um link/botão claro para navegar até `/registro` (*"Não tem conta? Cadastre-se"*).
  - **`/registro` (`src/app/registro/page.tsx`):** Nova rota dedicada exclusivamente ao cadastro de novos usuários (**RF 102 a RF 105**), com seleção de perfil (`ALUNO`, `PROFESSOR`, `GESTOR`), campos condicionais de `curso` e `semestre` quando `ALUNO` (**RF 103**), e link para retornar a `/login` (*"Já possui conta? Entrar"*).
  - Atualizar quaisquer links ou referências no `Header` (`src/components/Header.tsx`) e nas páginas para apontarem corretamente para `/login` e `/registro`.
- **Criação Real no Runtime:** Submeter o formulário em `/registro` deve criar um novo objeto `Usuario` real ativo no array `users` do `AppContext` e autenticar automaticamente o usuário recém-criado.

### Meta 6: Criação Real de Agendamentos, Conflitos e Solicitação Sem Sala (RF 401 e RF 402)
- **Bloqueio de Datas e Horários Passados:** Não permitir selecionar nem agendar em datas anteriores à data atual do usuário (`new Date()`), nem em faixas horárias que já tenham passado no dia de hoje.
- **Bloqueio de Conflito de Horários:** Um usuário não pode fazer um agendamento em um horário que já foi agendado para a mesma sala e data. Ao selecionar uma sala e uma data para agendar, o sistema deve verificar os agendamentos existentes no `AppContext` com status `APROVADO` ou `PENDENTE` naquele dia/sala e **filtrar ou desabilitar** as faixas horárias já ocupadas, impedindo sua seleção.
- **Solicitação de Horário Sem Sala Definida (RF 401) com Metadados Estruturados:**
  - O botão de solicitar horário sem sala definida deve **ler e salvar os filtros ativos** no `FilterPanel` (data, faixa horária, quantidade mínima de cadeiras, componentes marcados como TV/Projetor, Ar-condicionado, Computadores, e software buscado) em um campo estruturado de requisitos do pedido (`requisitosFiltro?: { minCadeiras: number; equipamentos: string[]; software: string }`), além de descrevê-los no `motivo` (`salaId: null`, `sala: null`).
- **Inserção no Runtime:** Clicar em **"Solicitar agendamento"** no `DetailModal` / `DetailPanel` deve validar se o usuário está ativo e inserir um novo objeto `Agendamento` real no array `requests` do `AppContext`.

### Meta 7: Persistência, Filtro Mensal Real no Gestor, Modal de Alocação e Negociação (RF 405 a RF 410)
- Os agendamentos NÃO podem ficar em um `useState` local dentro de `src/app/gestor/page.tsx`. Eles devem viver no `AppContext` (`requests`, `judgeBookingRequest`, `respondToProposal`, `createBookingRequest`).
- **Filtro Funcional de Mês no Topo Direito do Painel do Gestor (`/gestor`):**
  - Substituir o comportamento atual do seletor/botão de mês no topo direito de `src/app/gestor/page.tsx` (que atualmente apenas dispara um `notify`/Toast sem filtrar nada) por um **seletor funcional de mês/ano** (ex: `<input type="month">` ou `<select>` dinâmico com os meses do ano atual/próximo, iniciado automaticamente no **mês corrente do usuário**).
  - Ao alterar o mês selecionado, a lista de solicitações/agendamentos exibida no painel do gestor (`Pendentes`, `Aprovados`, `Rejeitados`, `Em Negociação` e contadores) deve ser **filtrada em tempo real** para mostrar apenas os agendamentos cuja data pertence ao mês selecionado.
- **Aprovação de Solicitações Sem Sala Definida (Compatível vs. Fora dos Filtros):**
  - Quando o Gestor clicar em **"Aprovar"** em uma solicitação sem sala (`salaId === null`), abrir o Modal em Grid exibindo as salas livres naquela data/horário (destacando as compatíveis com `requisitosFiltro` e permitindo selecionar também salas fora dos filtros).
  - Se a sala escolhida for compatível com os filtros, aprova imediatamente (`"APROVADO"`). Se estiver fora dos filtros, envia proposta ao solicitante (`"EM_NEGOCIACAO"`) com opção de **Aceitar** ou **Rejeitar**; se o usuário rejeitar (tanto alocação fora dos filtros quanto reagendamento), o pedido retorna para `"PENDENTE"` no Gestor com aviso visual para refazer o julgamento.

### Meta 8: Filtragem Reativa Instantânea, Bloqueio de Datas/Horários Passados e Busca de Software (RF 301 e RF 302)
- **Limitação à Data e Horário Atual do Usuário:**
  - A data inicial padrão dos filtros (`dateFilter`) deve ser a **data atual do sistema** (`YYYY-MM-DD` local do usuário).
  - Os campos `<input type="date">` devem definir `min={todayStr}` (data atual do usuário), impedindo a seleção de dias anteriores a hoje.
  - Quando a data selecionada for igual à data de hoje (`dateFilter === todayStr`), as faixas horárias cujo horário já tenha passado em relação à hora atual do usuário devem ser **desabilitadas ou ocultadas**, selecionando automaticamente a próxima faixa horária futura disponível.
- **Filtragem Instantânea e Buscador de Software:** Sem botão `"Aplicar filtros"`, filtragem imediata em `onChange` e `<input id="software">` controlado buscando *case-insensitive* nos softwares das salas.

### Meta 9: Padronização de Horários Oficiais e Identidade Visual do Header
- **Intervalos de Tempo Oficiais:** Usar exclusivamente as 6 faixas horárias fixas da Fatec Jahu (`07:45 — 09:25`, `09:30 — 11:10`, `11:20 — 13:00`, `17:20 — 19:00`, `19:00 — 20:40`, `20:50 — 22:30`).
- **Logo Oficial no Header (`Brand` / `Header`):** Utilizar `/public/logo_fatec_pb.png` escalada proporcionalmente (`max-height: 36px; width: auto; object-fit: contain`) sem alterar a altura do header (`72px`).

### Meta 10: Qualidade de Vida, Legibilidade Desktop e Responsividade Mobile/Tablet (RNF 102)
- **Legibilidade e Largura do Painel/Modal de Detalhes no Desktop:** Aumentar largura (`430px`–`460px`) e escala tipográfica dos horários e metadados no desktop (`>= 1024px`).
- **Estado Inicial Fechado e Scroll Lock Mobile:** `showDetails` inicia `false` em desktop e mobile; ao abrir em telas `< 1024px`, travar o scroll do `document.body` (`overflow: hidden`) para evitar rolagem da página de fundo.

### Meta 11: Dados Mockados Dinâmicos Conscientes do Tempo Atual e Base Populada (`src/data/mockData.tsx`)
- **Agendamentos Mockados Relativos ao Relógio Atual do Usuário (Sem Datas Fixas no Passado):**
  - **Proibido datas estáticas antigas** (como `"2026-05-..."` ou datas fixas no passado) nos agendamentos iniciais do `mockData.tsx`.
  - Criar uma função geradora dinâmica (ex: `buildInitialRequests(now = new Date())`) executada na inicialização do estado que calcula datas relativas a partir do momento em que o usuário abre o sistema:
    - **Regra de Virada Inteligente de Dia (`Hoje` vs. `Amanhã`):** Para agendamentos programados para o dia atual (`offsetDays = 0`), verificar a hora atual do navegador (`now`). Se a faixa horária daquele agendamento mockado **já tiver passado** em relação à hora atual do usuário (ex.: usuário acessou às `17:10` e o mock era para `09:30 — 11:10` ou `11:20 — 13:00`), o gerador deve **avançar automaticamente a data daquele agendamento para o dia seguinte (`+1 dia`)** para que ele nunca nasça expirado/inválido.
    - Distribuir os demais agendamentos mockados nos próximos dias do **mês atual** (`+1`, `+2`, `+3`, `+5`, `+8`, `+12` dias) e também alguns no **próximo mês** (`+1 mês`) para permitir testar imediatamente o filtro mensal do painel do Gestor.
- **Massa de Dados Rica e Populada:**
  - Ampliar significativamente o volume de dados mockados em `src/data/mockData.tsx`:
    - **Usuários:** Pelo menos **12 a 15 usuários** variados entre `ALUNO` (de cursos como `DSM`, `GTI`, `LOG`, `GE`, em diferentes semestres, incluindo 1 ou 2 contas inativas para testar o bloqueio), `PROFESSOR` e `GESTOR`, além das 3 contas padrões de acesso rápido.
    - **Agendamentos:** Pelo menos **18 a 25 agendamentos** cobrindo todos os status (`PENDENTE`, `APROVADO`, `REJEITADO`, `EM_NEGOCIACAO`), incluindo solicitações de professores (com prioridade docente), solicitações sem sala definida (`salaId: null` com `requisitosFiltro` preenchidos), pedidos já aprovados ocupando faixas horárias de hoje/amanhã na agenda das salas e agendamentos nos meses atual e seguinte.

---

## 4. Roteiro Passo a Passo Recomendado para o Agente Executar

Ao aplicar incrementos sobre o código já existente, execute apenas as alterações necessárias nos arquivos alvo:

1. **Passo 1 (`src/data/mockData.tsx` e `src/context/AppContext.tsx`):**
   - Expandir a lista de `systemUsers` com mais alunos, professores e gestores (mantendo as 3 contas padrões e incluindo contas inativas para teste).
   - Substituir os agendamentos estáticos por uma função `generateDynamicMockRequests()` que utiliza `new Date()` para criar ~20 agendamentos variados no mês atual e próximo mês, garantindo que qualquer agendamento previsto para hoje cujo horário já tenha passado seja automaticamente deslocado para amanhã (`+1 dia`).
2. **Passo 2 (`src/app/gestor/page.tsx`):**
   - Conectar o seletor de mês no topo direito a um estado `selectedMonth` (inicializado no mês atual `"YYYY-MM"`) e filtrar efetivamente os agendamentos exibidos nas abas e métricas do painel pelo mês escolhido, removendo o Toast falso.
3. **Passo 3 (`src/app/login/page.tsx`, `src/app/registro/page.tsx` e `src/components/Header.tsx`):**
   - Extrair o formulário de cadastro (`signup`) de `src/app/login/page.tsx` para a nova página dedicada `src/app/registro/page.tsx`, deixando `/login` focado apenas em autenticação e conectando ambas as rotas via links de navegação.