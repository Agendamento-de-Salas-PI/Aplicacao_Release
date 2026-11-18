```mermaid
erDiagram
    USUARIO ||--o| ALUNO : "especializa (RF 103)"
    USUARIO ||--o| PROFESSOR : "especializa (RF 104)"
    USUARIO ||--o| GESTOR : "especializa (RF 105)"
    USUARIO ||--o{ AGENDAMENTO : "solicita (RF 204, 402)"
    USUARIO ||--o{ ALTERACAO_AGENDAMENTO : "propõe / julga (RF 407-410)"
    USUARIO ||--o{ NOTIFICACAO : "recebe (RF 501)"

    CURSO ||--o{ ALUNO : "possui matriculados"
    CURSO ||--o{ PROFESSOR_CURSO : "vincula"
    PROFESSOR ||--o{ PROFESSOR_CURSO : "leciona em"
    CURSO ||--o{ AGENDAMENTO : "associado a"

    BLOCO ||--o{ SALA : "contém (RF 205)"
    TIPO_SALA ||--o{ SALA : "classifica"

    SALA ||--o{ SALA_EQUIPAMENTO : "equipada com (RF 202)"
    EQUIPAMENTO ||--o{ SALA_EQUIPAMENTO : "presente em (RF 301)"

    SALA ||--o{ SALA_SOFTWARE : "possui instalado"
    SOFTWARE ||--o{ SALA_SOFTWARE : "disponível em (RF 301)"

    SALA |o--o{ AGENDAMENTO : "reservada em (RF 401)"
    AGENDAMENTO ||--o{ ALTERACAO_AGENDAMENTO : "registra histórico"

    USUARIO {
        int id PK
        string nome
        string cpf UK "Nullable"
        string ra UK
        string email UK "Login institucional (RF 101)"
        string senhaHash "Bcrypt/Argon2 (RNF 302)"
        boolean emailValidado "Confirmação (RF 106)"
        enum tipoUsuario "ALUNO | PROFESSOR | GESTOR"
    }

    ALUNO {
        int id PK
        int usuarioId FK, UK
        int cursoId FK
        int semestre "Exigido no RF 103"
    }

    PROFESSOR {
        int id PK
        int usuarioId FK, UK
    }

    GESTOR {
        int id PK
        int usuarioId FK, UK
    }

    CURSO {
        int id PK
        string descritivo "Ex: DSM, GTI"
    }

    PROFESSOR_CURSO {
        int professorId PK, FK
        int cursoId PK, FK
    }

    BLOCO {
        int id PK
        string descritivo "Ex: Bloco A, Bloco B"
    }

    TIPO_SALA {
        int id PK
        string descritivo "Ex: Sala de Aula, Laboratório, Auditório"
    }

    SALA {
        int id PK
        string descritivo "Ex: Sala B-101, Lab B-104"
        string codigoSvg UK "ID da tag no Mapa SVG"
        int capacidade "Filtro de cadeiras (RF 301)"
        int blocoId FK
        int tipoSalaId FK
    }

    EQUIPAMENTO {
        int id PK
        string descritivo "Ex: Computador, TV, Ar-condicionado"
        string descricao "Nullable"
    }

    SALA_EQUIPAMENTO {
        int id PK
        int salaId FK
        int equipamentoId FK
        int quantidade "Quantidade na sala (RF 202)"
    }

    SOFTWARE {
        int id PK
        string descritivo "Ex: VS Code, Docker, Figma"
        string versao "Nullable"
    }

    SALA_SOFTWARE {
        int salaId PK, FK
        int softwareId PK, FK
    }

    AGENDAMENTO {
        int id PK
        int solicitanteId FK "Autoria e prioridade (RF 204, 403)"
        int salaId FK "Nullable p/ horário sem sala (RF 401)"
        int cursoId FK "Nullable"
        datetime dataInicio
        datetime dataFim
        string motivo "Finalidade da reserva"
        enum status "PENDENTE | APROVADO | REJEITADO | CANCELADO | EM_NEGOCIACAO"
        datetime criadoEm
    }

    ALTERACAO_AGENDAMENTO {
        int id PK
        int agendamentoId FK
        int autorId FK "Gestor (RF 407) ou Aluno (RF 409)"
        enum statusAnterior
        enum statusNovo
        string justificativa "Motivo de recusa/cancelamento (RF 406)"
        int salaPropostaId "Nullable"
        datetime dataInicioProposta "Nullable"
        datetime dataFimProposta "Nullable"
        datetime criadoEm
    }

    NOTIFICACAO {
        int id PK
        int usuarioId FK
        string mensagem
        boolean lida
        datetime criadoEm
    }