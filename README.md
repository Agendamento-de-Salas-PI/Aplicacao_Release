# 🏫 Sistema de Agendamento de Salas — FATEC Jahu

Plataforma web desenvolvida como Projeto Integrador (PI) do curso de **Tecnologia em Desenvolvimento de Software Multiplataforma (DSM)** da **Faculdade de Tecnologia de Jahu (Centro Paula Souza)**. O sistema agiliza a consulta de infraestrutura, a visualização de disponibilidade em planta baixa interativa e o fluxo de aprovação de reservas de salas de aula, laboratórios e auditórios por alunos, professores e gestores[cite: 74].

---

## ✨ Funcionalidades Principais

### 🗺️ Mapa Vetorial Interativo (SVG) e Grid Acessível
* **Plantas Dinâmicas por Bloco:** Carregamento dinâmico dos mapas vetoriais dos blocos do campus (`/public/bloco-1.svg` e `/public/bloco-2.svg`), vinculando cada forma `<rect>` diretamente aos registros de salas.
* **Navegação de Câmera Desktop e Mobile:** Suporte a *Zoom-in/Zoom-out* via roda do mouse (`onWheel`) e gesto de pinça (*pinch-to-zoom* com 2 dedos), além de movimentação livre (*Pan* por arraste de mouse ou toque).
* **Modo Grid e Atalhos:** Alternância instantânea entre o mapa SVG e uma grade de botões responsivos por bloco, além de atalhos de teclado (ex.: `Shift + F` para abrir os filtros e `Esc` para fechar painéis).

### 🔍 Busca e Filtragem Reativa em Tempo Real
* **Filtragem Instantânea:** Resultados atualizados em tempo real conforme a seleção de **data** (bloqueando dias anteriores ao atual), **faixas horárias oficiais da instituição**, **capacidade mínima de cadeiras**, **equipamentos** (TV/Projetor, Ar-condicionado, Computadores) e **softwares instalados** (ex.: VS Code, Docker, Figma)[cite: 69, 76].
* **Prevenção de Conflitos:** Faixas horárias já ocupadas ou com solicitações ativas na data selecionada são bloqueadas automaticamente[cite: 69].

### 📅 Fluxo Completo de Agendamento e Negociação
* **Horários Oficiais Padronizados:** Operação baseada nos 6 intervalos acadêmicos da FATEC Jahu (`07:45—09:25`, `09:30—11:10`, `11:20—13:00`, `17:20—19:00`, `19:00—20:40` e `20:50—22:30`)[cite: 69].
* **Solicitação Com ou Sem Sala Definida:** Usuários podem reservar uma sala específica ou solicitar apenas uma faixa horária informando os requisitos desejados (capacidade, equipamentos e softwares) para alocação posterior pelo gestor[cite: 69, 76].
* **Prioridade Docente:** Solicitações realizadas por professores recebem sinalização de prioridade na fila de análise[cite: 69, 76].
* **Painel do Gestor e Contrapropostas:**
  * Aprovação, rejeição com justificativa ou envio de proposta de reagendamento[cite: 69, 76].
  * **Alocação Inteligente:** Ao aprovar pedidos sem sala definida, o gestor visualiza em grid as salas disponíveis que atendem aos filtros do solicitante. Caso opte por alocar uma sala fora dos critérios originais, o sistema notifica o solicitante para aceitar ou recusar a alteração (retornando o pedido ao gestor em caso de recusa)[cite: 69].
  * Gestão de usuários (busca, edição cadastral e bloqueio de solicitações para contas inativadas) e edição de infraestrutura das salas[cite: 69, 75].

---

## 🛠️ Stack Tecnológica

* **Frontend & Routing:** [Next.js](https://nextjs.org/) (App Router) + [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)[cite: 69]
* **Estilização:** [Tailwind CSS](https://tailwindcss.com/) + CSS Global seguindo a identidade visual do Centro Paula Souza[cite: 69]
* **Gerenciamento de Estado (Protótipo):** React Context API (`AppContext`) com persistência reativa em *runtime*[cite: 69]
* **Modelagem de Banco de Dados:** [Prisma ORM](https://www.prisma.io/) (`src/prisma/contract.prisma`) estruturado para PostgreSQL[cite: 69]

---

## 📂 Estrutura do Projeto

```text
├── public/
│   ├── bloco-1.svg            # Planta vetorial do Bloco 1
│   ├── bloco-2.svg            # Planta vetorial do Bloco 2
│   └── logo_fatec_pb.png      # Identidade visual institucional
├── src/
│   ├── app/
│   │   ├── globals.css        # Estilos globais, responsividade e variáveis visuais
│   │   ├── layout.tsx         # Layout raiz com AppProvider e AppHeader
│   │   ├── page.tsx           # Tela principal (Filtros, Mapa SVG, Grid e Detalhes)
│   │   ├── gestor/page.tsx    # Painel administrativo (Aprovações, Salas e Usuários)
│   │   ├── perfil/page.tsx    # Perfil institucional e notificações
│   │   └── login/page.tsx     # Autenticação, contas demo e cadastro
│   ├── components/            # AppHeader, Brand e ícones reutilizáveis
│   ├── context/
│   │   └── AppContext.tsx     # Estado global mutável, regras de negócio e notificações
│   ├── data/
│   │   └── mockData.ts        # Dados iniciais de blocos, salas, horários e usuários
│   ├── prisma/
│   │   └── contract.prisma    # Schema relacional do banco de dados
│   └── types/
│       └── index.ts           # Tipagens TypeScript alinhadas ao schema Prisma
└── AGENTS.md                  # Diretrizes arquiteturais e regras de negócio do projeto
```
## 🚀 Como Executar Localmente

### Pré-requisitos
* Node.js (v20 ou superior)
* Gerenciador de pacotes npm

### Instação e Execução

1. Clone o repositório:
```bash
git clone [https://github.com/BrunoLallo/agendamento-salas.git](https://github.com/BrunoLallo/agendamento-salas.git)
cd agendamento-salas
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```
