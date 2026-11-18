# AGENTS.md — Sistema de Agendamento de Salas (Fatec Jahu)

Este documento define o contexto arquitetural, as regras de negócio, os requisitos funcionais e o plano de ação prioritário para os agentes de IA (Google Antigravity / Code Assist) operando neste repositório no VS Code.

---

## 1. Visão Geral e Stack Tecnológica
- **Projeto:** Plataforma Web de Agendamento de Salas de Aula para a Fatec Jahu (Projeto Integrador - DSM).
- **Framework:** Next.js (App Router) com React e TypeScript (`src/app/`).
- **Estilização:** CSS Global (`src/app/globals.css`) + Tailwind CSS, seguindo o Manual de Identidade Visual do Centro Paula Souza (Vermelho CPS: `#b20d19` / `#B20000`, Cinza: `#666666`, Tipografia limpa).
- **ORM / Banco Futuro:** Prisma 8 (`src/prisma/contract.prisma` com PostgreSQL).
- **Estado Atual (Runtime Prototype):** Toda a persistência durante a execução (runtime) deve ocorrer de forma reativa e mutável dentro do **`src/context/AppContext.tsx`**, inicializada a partir de **`src/data/mockData.ts`** e respeitando rigorosamente as interfaces de **`src/types/index.ts`**.

---

## 2. Regras de Ouro para o Agente
1. **Proibido "Fake Toasts":** Nenhuma interação principal (criar agendamento, limpar filtros, aprovar/rejeitar/reagendar pedido, editar componentes de sala, registrar usuário) pode apenas disparar `notify("...")`. Toda ação DEVE mutar o estado global no `AppContext` primeiro e usar o `notify()` apenas como feedback visual da operação concluída.
2. **Persistência em Runtime:** Se um agendamento for aprovado, rejeitado ou colocado em negociação na rota `/gestor`, ou se uma nova sala/usuário/agendamento for alterado, essa mudança deve permanecer salva no `AppContext` ao navegar entre `/`, `/gestor`, `/perfil` e `/login`.
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
- Configurar no `mockData.ts` e no `AppContext` os **2 Blocos oficiais** vinculados aos arquivos `/public/bloco-1.svg` e `/public/bloco-2.svg`, com suas respectivas salas vinculadas por `blocoId` e `codigoSvg`.
- **Ajuste na Toolbar (`src/app/page.tsx`):** Remover qualquer `<select>` de troca de blocos localizado à esquerda ou no centro da barra. Manter **apenas** o seletor localizado à direita (com o rótulo `"Blocos do Campus"` escrito em cima) para alternar entre o Bloco 1 e o Bloco 2, atualizando imediatamente o SVG carregado, o Grid e a sala selecionada.

### Meta 3: Manipulação de Dados dos Blocos e Componentes das Salas pelo Gestor
- O usuário com perfil `GESTOR` deve poder editar os componentes/infraestrutura das salas de qualquer bloco (ex: alterar a capacidade de cadeiras, adicionar/remover ou mudar a quantidade de `SalaEquipamento` como Computadores, TV, Projetor, Ar-condicionado, e `SalaSoftware`).
- Implementar essa edição tanto no painel de detalhes da sala (quando logado como `GESTOR`) quanto em uma aba/modal de **"Gerenciar Blocos e Salas"** dentro de `/gestor`. Toda alteração atualiza o array global `rooms` no `AppContext`.

### Meta 4: Três Contas Padrões, Conta Inicial de Aluno, Bloqueio de Inativos e Perfil Limpo
- **Conta Padrão Inicial (Aluno):** Ao entrar na aplicação ou realizar o login padrão sem especificar outra conta, o usuário autenticado por padrão deve ser a conta de **Aluno** (`gabriel.lima@fatec.sp.gov.br`, Role: `ALUNO`), e **não** a de Gestor.
- **Três Contas Padrões Pré-Configuradas (`mockData.ts` e `/login`):**
  1. **Aluno Padrão (Default):** `gabriel.lima@fatec.sp.gov.br` (Senha: `123456`, Role: `ALUNO`, RA: `1460482213021`, Curso: `DSM`, Semestre: `4`) — Pode solicitar agendamentos de sala (**RF 402**), solicitar horário sem sala específica (**RF 401**) e responder propostas de reagendamento ou alocação alternativa (**RF 408/409**).
  2. **Professor Padrão:** `marina.prado@fatec.sp.gov.br` (Senha: `123456`, Role: `PROFESSOR`, RA: `P-10482`) — Solicitações recebem flag de **Prioridade Docente (RF 403)**, pode visualizar a autoria dos agendamentos nas salas (**RF 204**) e responder propostas de alteração.
  3. **Gestor Padrão:** `bruno.lallo@fatec.sp.gov.br` (Senha: `123456`, Role: `GESTOR`, RA: `G-2026001`) — Acesso total a `/gestor`, aprovação de pedidos, edição de salas/blocos e edição/ativação/inativação de usuários.
- **Remoção de "Trocar conta" na Página de Perfil (`/perfil`):**
  - Remover qualquer botão, card ou seção de **"Trocar conta"** (atalho de troca rápida de perfil) dentro de `src/app/perfil/page.tsx`. Na página de perfil, a troca de usuário deve ocorrer exclusivamente saindo da conta (`Sair da conta` -> redirecionando para `/login`).
- **Bloqueio de Usuários Inativados:**
  - Quando um usuário estiver com status inativo (`emailValidado === false` ou flag `ativo === false`), ele **não pode criar novos pedidos de agendamento** (nem com sala definida, nem sem sala definida).
  - Tanto na interface (`DetailPanel` e botão de agendar sem sala) quanto dentro da função `createBookingRequest` no `AppContext`, verificar se a conta está ativa; caso esteja inativada, bloquear a ação e exibir uma mensagem clara informando que contas inativas não podem solicitar agendamentos.

### Meta 5: Registro Funcional de Novos Usuários (RF 102 a RF 105)
- Na tela `/login` (modo `"signup"`), preencher o formulário e submeter deve **criar um novo objeto `Usuario` real** ativo no array `users` do `AppContext`.
- Se o perfil selecionado for `ALUNO`, exigir e salvar também `curso` e `semestre` (**RF 103**).
- Após o registro, autenticar automaticamente o novo usuário recém-criado no `AppContext`, permitindo que ele navegue pela plataforma com as permissões exatas do seu cargo (`ALUNO`, `PROFESSOR` ou `GESTOR`) e apareça na busca de usuários do Gestor.

### Meta 6: Criação Real de Agendamentos, Conflitos e Solicitação Sem Sala (RF 401 e RF 402)
- **Bloqueio de Datas e Horários Passados:** Não permitir selecionar nem agendar em datas anteriores à data atual do usuário (`new Date()`), nem em faixas horárias que já tenham passado no dia de hoje.
- **Bloqueio de Conflito de Horários:** Um usuário não pode fazer um agendamento em um horário que já foi agendado para a mesma sala e data. Ao selecionar uma sala e uma data para agendar, o sistema deve verificar os agendamentos existentes no `AppContext` com status `APROVADO` ou `PENDENTE` naquele dia/sala e **filtrar ou desabilitar** as faixas horárias já ocupadas, impedindo sua seleção.
- **Solicitação de Horário Sem Sala Definida (RF 401) com Metadados Estruturados:**
  - O botão de solicitar horário sem sala definida deve **ler e salvar os filtros ativos** no `FilterPanel` (data, faixa horária, quantidade mínima de cadeiras, componentes marcados como TV/Projetor, Ar-condicionado, Computadores, e software buscado) em um campo estruturado de requisitos do pedido (`requisitosFiltro?: { minCadeiras: number; equipamentos: string[]; software: string }`), além de descrevê-los no `motivo` (`salaId: null`, `sala: null`).
- **Inserção no Runtime:** Clicar em **"Solicitar agendamento"** no `DetailPanel` (`src/app/page.tsx`) deve validar se o usuário está ativo e inserir um novo objeto `Agendamento` real no array `requests` do `AppContext`.
- A agenda lateral da sala ("Agenda de hoje") deve refletir dinamicamente os agendamentos existentes para aquela sala e data no estado global.

### Meta 7: Persistência, Modal de Alocação e Fluxo de Negociação/Recusa (RF 405 a RF 410)
- Os agendamentos NÃO podem ficar em um `useState` local dentro de `src/app/gestor/page.tsx`. Eles devem viver no `AppContext` (`requests`, `judgeBookingRequest`, `respondToProposal`, `createBookingRequest`).
- **Aprovação de Solicitações Sem Sala Definida (Compatível vs. Fora dos Filtros):**
  - Quando o Gestor clicar em **"Aprovar"** em uma solicitação que **não possui sala definida** (`salaId === null` / `"Sem sala"`), deve abrir um **Modal exibindo no formato visual de Grid (`.room-grid`)** as salas livres naquela data e faixa horária, destacando quais atendem integralmente aos filtros do solicitante (`capacidade >= minCadeiras`, `equipamentos` e `software`) e permitindo também visualizar/selecionar salas fora dos filtros.
  - **Regra 1 — Sala COMPATÍVEL com os filtros:** Se a sala escolhida pelo Gestor atende a todos os filtros definidos pelo solicitante, o agendamento é confirmado imediatamente (`status: "APROVADO"`, `salaId` e `sala` vinculados).
  - **Regra 2 — Sala FORA dos filtros do pedinte:** Se o Gestor escolher uma sala que **não atende** a algum dos filtros solicitados (ex: capacidade menor ou falta de algum equipamento/software pedido), **NÃO confirmar automaticamente**:
    - Alterar o status do pedido para `"EM_NEGOCIACAO"` (ou `"AGUARDANDO_USUARIO"`), registrar a sala proposta (`salaPropostaId` / `salaProposta`) e gerar uma **notificação interativa** para o usuário solicitante informando a mudança de sala fora dos critérios originais.
    - O solicitante (Aluno ou Professor) deve visualizar essa notificação (no sino do Header / painel de notificações ou na área "Minhas Solicitações") com botões claros de **"Aceitar proposta"** e **"Rejeitar proposta"**.
    - Se o solicitante **aceitar**, o pedido muda para `"APROVADO"` com a sala proposta vinculada.
    - Se o solicitante **rejeitar**, o agendamento retorna para a fila de pendentes do Gestor (`status: "PENDENTE"`, `salaId: null`) acompanhado de um aviso/badge destacado: **"Negado pelo usuário — refazer julgamento"**.
- **Regra 3 — Recusa de Reagendamento pelo Usuário (RF 409/410):**
  - Sempre que o Gestor propuser um reagendamento (novo horário/data ou nova sala) e o usuário solicitante **negar/rejeitar** a proposta, a solicitação **não deve ser descartada**; ela deve **retornar automaticamente para a aba "Pendentes" do Gestor** (`status: "PENDENTE"`) com a sinalização de que a proposta anterior foi recusada pelo usuário, permitindo que o Gestor refaça o julgamento (aprovar em outra sala/horário, propor novamente ou rejeitar).

### Meta 8: Filtragem Reativa Instantânea, Bloqueio de Datas/Horários Passados e Busca de Software (RF 301 e RF 302)
- **Limitação à Data e Horário Atual do Usuário:**
  - A data inicial padrão dos filtros (`dateFilter`) deve ser a **data atual do sistema** (`YYYY-MM-DD` local do usuário), nunca uma data fixa no passado.
  - O `<input id="date" type="date">` dos filtros e dos modais de agendamento/reagendamento deve definir `min={todayStr}` (data atual do usuário), impedindo a seleção de dias anteriores a hoje.
  - Quando a data selecionada for igual à data de hoje (`dateFilter === todayStr`), as faixas horárias no `<select id="time">` (e nas opções de agendamento) cujo horário de início (ou término) já tenha passado em relação à hora atual do usuário devem ser **desabilitadas ou ocultadas**, selecionando automaticamente a próxima faixa horária futura disponível.
- **Remoção do Botão "Aplicar filtros":** Remover completamente o botão `"Aplicar filtros"` do `FilterPanel`. Toda alteração em qualquer controle de filtro (data, horário, slider de cadeiras, checkboxes de componentes ou input de software) deve filtrar as salas **instantaneamente em tempo real (`onChange`)**.
- **Buscador de Software:** Garantir que `<input id="software">` seja controlado (`value` e `onChange`) e filtre *case-insensitive* nos softwares instalados nos computadores (`sala.softwares`).
- **Feedback Visual:** No **Grid**, exibir apenas as salas que cumprem os filtros ativos. No **Mapa SVG**, destacar visualmente as salas que cumprem os filtros e esmaecer (`opacity-30` / `.filtered-out`) as que não atendem. O botão `"Limpar todos os filtros"` deve resetar todos os estados de filtro instantaneamente (retornando a data para hoje).

### Meta 9: Padronização de Horários Oficiais e Identidade Visual do Header
- **Intervalos de Tempo Oficiais:** Usar exclusivamente as 6 faixas horárias fixas da Fatec Jahu (`07:45 — 09:25`, `09:30 — 11:10`, `11:20 — 13:00`, `17:20 — 19:00`, `19:00 — 20:40`, `20:50 — 22:30`).
- **Logo Oficial no Header (`Brand` / `AppHeader`):** Utilizar `/public/logo_fatec_pb.png` escalada proporcionalmente (`max-height: 36px; width: auto; object-fit: contain`) sem alterar a altura do header (`72px`).

### Meta 10: Qualidade de Vida, Legibilidade Desktop e Responsividade Mobile/Tablet (RNF 102)
- **Legibilidade e Largura do Painel/Modal de Detalhes no Desktop (`DetailPanel`):**
  - Em telas desktop (`>= 1024px`), aumentar a largura do painel lateral de detalhes `.details` (ex: de ~`340px` para `420px`–`460px` no grid `.booking-layout` ou modal) e ampliar a escala tipográfica interna — especialmente nos horários da agenda (`time`, `.schedule`), badges de disponibilidade, etiquetas de infraestrutura (`14px`–`16px`) e botões de seleção de horário — garantindo leitura confortável sem texto espremido ou truncado.
- **Painel de Detalhes Fechado ao Carregar a Página Principal (`showDetails = false`):**
  - Ao carregar a página inicial (`/`), o painel/modal de detalhes da sala (`DetailPanel`) deve iniciar **fechado (`false`) tanto no Desktop quanto no Mobile**, evitando cobrir a interface no celular antes que o usuário toque em uma sala. Ele só deve abrir quando o usuário clicar/tocar explicitamente em uma sala no Mapa SVG ou no Grid (ou no botão "Ver detalhes").
- **Trava de Scroll da Página Fundo quando o Modal/Bottom-Sheet estiver Aberto no Mobile:**
  - Sempre que o `DetailPanel` (ou qualquer modal/drawer) estiver aberto em dispositivos móveis (`< 1024px`), **travar o scroll do `<body>` / `<html>`** (`overflow: hidden`, `position: fixed` ou `overscroll-behavior: none`), permitindo que apenas o conteúdo interno do próprio modal/bottom-sheet role (`overflow-y: auto; overscroll-behavior: contain`), impedindo que o usuário acabe rolando a página de fundo por acidente.
- **Painel de Filtros Recolhível (Drawer/Accordion) em Mobile:** Em telas menores (`< 1024px`), manter o `FilterPanel` recolhido por padrão atrás de um botão compacto `"Filtros (X ativos)"` para não empurrar o mapa para baixo.
- **Prevenção de Zoom Automático no iOS/Android e Touch Targets:** Garantir `font-size: 16px` nos `<input>` e `<select>` no mobile e área mínima de toque de `44px × 44px` nos botões interativos.

---

## 4. Roteiro Passo a Passo Recomendado para o Agente Executar

Ao aplicar incrementos sobre o código já existente, execute apenas as alterações necessárias nos arquivos alvo:

1. **Passo 1 (`src/app/perfil/page.tsx`):**
   - Localizar e remover completamente a opção/botão de `"Trocar conta"` na página de perfil, mantendo apenas a navegação de informações pessoais, notificações e `"Sair da conta"`.
2. **Passo 2 (`src/app/page.tsx` e `src/app/globals.css`):**
   - **Data e Horários Mínimos Atuais:** Calcular a data local atual do usuário (`todayStr = new Date().toLocaleDateString('en-CA')`), inicializar o filtro de data com `todayStr`, aplicar `min={todayStr}` nos inputs de data e desabilitar/filtrar nos selects as faixas horárias cujo horário já tenha passado quando a data selecionada for hoje.
   - **Legibilidade Desktop do Painel de Detalhes:** Aumentar a largura da coluna `.details` no layout desktop (`>= 1024px`, para `430px`–`460px`) e aumentar o tamanho das fontes internas (especialmente os horários em `.schedule`, metadados e rótulos) para melhorar a leitura no computador.
3. **Passo 3 (`src/app/gestor/page.tsx` e `src/context/AppContext.tsx`):**
   - Garantir que os inputs de data nos modais de proposta de reagendamento do Gestor também respeitem `min={todayStr}` e validem horários futuros.