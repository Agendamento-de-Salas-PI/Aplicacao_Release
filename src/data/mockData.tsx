// src/data/mockData.tsx
import {
  type Usuario,
  type Sala,
  type Bloco,
  type Agendamento,
  type TipoUsuario,
  type StatusAgendamento,
  type SalaEquipamento,
  type Curso,
  type Disciplina,
} from "@/types";

export type {
  Usuario as User,
  Sala as Room,
  Bloco as Block,
  Agendamento as BookingRequest,
  TipoUsuario as UserRole,
  StatusAgendamento as BookingStatus,
};

// ==========================================
// HELPERS DE FORMATAÇÃO PARA A INTERFACE
// ==========================================

export function getInitials(nome: string): string {
  const parts = nome.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatTipoUsuario(tipo: TipoUsuario): string {
  const map: Record<TipoUsuario, string> = {
    ALUNO: "Aluno",
    PROFESSOR: "Professor",
    GESTOR: "Gestor",
  };
  return map[tipo];
}

export function formatUsuarioDetalhe(u: Usuario): string {
  if (u.tipoUsuario === "ALUNO" && u.aluno) {
    return `${u.aluno.curso?.descritivo ?? "Curso"} · ${u.aluno.semestre}º semestre`;
  }
  if (u.tipoUsuario === "PROFESSOR" && u.professor?.disciplinas?.length) {
    return u.professor.disciplinas
      .map((d) =>
        d.curso?.descritivo
          ? `${d.descritivo} (${d.curso.descritivo})`
          : d.descritivo
      )
      .join(", ");
  }
  return "Administração · FATEC Jahu";
}

export function formatEquipamentoItem(item: SalaEquipamento): string {
  if (item.quantidade > 1) {
    return `${item.quantidade} ${item.equipamento.descritivo.toLowerCase()}`;
  }
  return item.equipamento.descritivo;
}

export function formatDataCurta(isoOrDate: string | Date): string {
  const d = new Date(isoOrDate);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatIntervaloHorario(
  inicio: string | Date,
  fim: string | Date
): string {
  const dInicio = new Date(inicio);
  const dFim = new Date(fim);
  const fmt = (d: Date) =>
    d.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    });
  return `${fmt(dInicio)} — ${fmt(dFim)}`;
}

// ==========================================
// 6 FAIXAS HORÁRIAS OFICIAIS DA FATEC JAHU
// ==========================================

export const OFFICIAL_TIME_SLOTS = [
  "07:45 — 09:25",
  "09:30 — 11:10",
  "11:20 — 13:00",
  "17:20 — 19:00",
  "19:00 — 20:40",
  "20:50 — 22:30",
] as const;

export const OFFICIAL_TIME_SLOT_OBJECTS = [
  { start: "07:45", end: "09:25", label: "07:45 — 09:25" },
  { start: "09:30", end: "11:10", label: "09:30 — 11:10" },
  { start: "11:20", end: "13:00", label: "11:20 — 13:00" },
  { start: "17:20", end: "19:00", label: "17:20 — 19:00" },
  { start: "19:00", end: "20:40", label: "19:00 — 20:40" },
  { start: "20:50", end: "22:30", label: "20:50 — 22:30" },
] as const;

export function getTodayLocalStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isTimeSlotPast(dateStr: string, slotLabel: string): boolean {
  const todayStr = getTodayLocalStr();
  if (dateStr < todayStr) return true;
  if (dateStr > todayStr) return false;

  const parts = slotLabel.split("—").map((s) => s.trim());
  const startPart = parts[0] || "07:45";
  const [hourStr, minStr] = startPart.split(":");
  const slotMinutes = Number(hourStr) * 60 + Number(minStr);

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return currentMinutes >= slotMinutes;
}

export function getFirstAvailableFutureSlot(dateStr: string): string {
  const futureSlots = OFFICIAL_TIME_SLOTS.filter(
    (slot) => !isTimeSlotPast(dateStr, slot)
  );
  return futureSlots[0] ?? OFFICIAL_TIME_SLOTS[0];
}

// ==========================================
// CURSOS DISPONÍVEIS
// ==========================================

export const systemCourses: Curso[] = [
  { id: 1, descritivo: "DSM" },
  { id: 2, descritivo: "GTI" },
  { id: 3, descritivo: "GPI" },
  { id: 4, descritivo: "Logística" },
  { id: 5, descritivo: "Meio Ambiente" },
  { id: 6, descritivo: "Construção Naval" },
];

export const systemDisciplinas: Disciplina[] = [
  {
    id: 1,
    descritivo: "Engenharia de Software II",
    cursoId: 1,
    curso: { id: 1, descritivo: "DSM" },
  },
  {
    id: 2,
    descritivo: "Banco de Dados Relacional",
    cursoId: 1,
    curso: { id: 1, descritivo: "DSM" },
  },
  {
    id: 3,
    descritivo: "Algoritmos e Lógica de Programação",
    cursoId: 1,
    curso: { id: 1, descritivo: "DSM" },
  },
  {
    id: 4,
    descritivo: "DevOps e Integração Contínua",
    cursoId: 1,
    curso: { id: 1, descritivo: "DSM" },
  },
  {
    id: 5,
    descritivo: "Programação para Dispositivos Móveis",
    cursoId: 2,
    curso: { id: 2, descritivo: "GTI" },
  },
  {
    id: 6,
    descritivo: "Governança e Gestão de TI",
    cursoId: 2,
    curso: { id: 2, descritivo: "GTI" },
  },
  {
    id: 7,
    descritivo: "Desenvolvimento Web Full Stack",
    cursoId: 1,
    curso: { id: 1, descritivo: "DSM" },
  },
  {
    id: 8,
    descritivo: "Segurança da Informação",
    cursoId: 2,
    curso: { id: 2, descritivo: "GTI" },
  },
  {
    id: 9,
    descritivo: "Logística Portuária e Modais",
    cursoId: 4,
    curso: { id: 4, descritivo: "Logística" },
  },
  {
    id: 10,
    descritivo: "Gestão da Cadeia de Suprimentos",
    cursoId: 4,
    curso: { id: 4, descritivo: "Logística" },
  },
];

// ==========================================
// BLOCOS E SEUS ARQUIVOS SVG (/public/bloco-1.svg e /public/bloco-2.svg)
// ==========================================

export const blocks: Bloco[] = [
  {
    id: 1,
    descritivo: "Bloco 1 · Térreo",
    svgUrl: "/bloco-1.svg",
    svgViewBox: "0 0 507 980",
  },
  {
    id: 2,
    descritivo: "Bloco 2 · Térreo",
    svgUrl: "/bloco-2.svg",
    svgViewBox: "0 0 507 980",
  },
];

// ==========================================
// SALAS VINCULADAS AOS BLOCOS E ELEMENTOS SVG
// ==========================================

export const rooms: Sala[] = [
  // ================= BLOCO 1 (blocoId: 1 · /bloco-1.svg) =================
  {
    id: 1,
    codigoSvg: "A-LAB-01",
    descritivo: "Lab. 01",
    capacidade: 32,
    blocoId: 1,
    tipoSalaId: 2,
    bloco: blocks[0],
    tipoSala: { id: 2, descritivo: "Laboratório de Informática" },
    statusOcupacao: "Livre",
    equipamentos: [
      {
        id: 101,
        salaId: 1,
        equipamentoId: 4,
        quantidade: 32,
        equipamento: { id: 4, descritivo: "Computadores" },
      },
      {
        id: 102,
        salaId: 1,
        equipamentoId: 5,
        quantidade: 1,
        equipamento: { id: 5, descritivo: "Projetor" },
      },
      {
        id: 103,
        salaId: 1,
        equipamentoId: 2,
        quantidade: 1,
        equipamento: { id: 2, descritivo: "Ar-condicionado" },
      },
    ],
    softwares: [
      {
        salaId: 1,
        softwareId: 1,
        software: { id: 1, descritivo: "VS Code", versao: "1.95" },
      },
      {
        salaId: 1,
        softwareId: 3,
        software: { id: 3, descritivo: "Docker", versao: "27.0" },
      },
    ],
  },
  {
    id: 2,
    codigoSvg: "A-LAB-02",
    descritivo: "Lab. 02",
    capacidade: 30,
    blocoId: 1,
    tipoSalaId: 2,
    bloco: blocks[0],
    tipoSala: { id: 2, descritivo: "Laboratório de Informática" },
    statusOcupacao: "Livre",
    equipamentos: [
      {
        id: 104,
        salaId: 2,
        equipamentoId: 4,
        quantidade: 30,
        equipamento: { id: 4, descritivo: "Computadores" },
      },
      {
        id: 105,
        salaId: 2,
        equipamentoId: 1,
        quantidade: 1,
        equipamento: { id: 1, descritivo: 'TV 55"' },
      },
      {
        id: 106,
        salaId: 2,
        equipamentoId: 2,
        quantidade: 1,
        equipamento: { id: 2, descritivo: "Ar-condicionado" },
      },
    ],
    softwares: [
      {
        salaId: 2,
        softwareId: 1,
        software: { id: 1, descritivo: "VS Code", versao: "1.95" },
      },
      {
        salaId: 2,
        softwareId: 2,
        software: { id: 2, descritivo: "Node.js", versao: "22 LTS" },
      },
    ],
  },
  {
    id: 3,
    codigoSvg: "A-LAB-03",
    descritivo: "Lab. 03",
    capacidade: 28,
    blocoId: 1,
    tipoSalaId: 2,
    bloco: blocks[0],
    tipoSala: { id: 2, descritivo: "Laboratório Multimídia" },
    statusOcupacao: "Livre",
    equipamentos: [
      {
        id: 107,
        salaId: 3,
        equipamentoId: 4,
        quantidade: 28,
        equipamento: { id: 4, descritivo: "Computadores" },
      },
      {
        id: 108,
        salaId: 3,
        equipamentoId: 5,
        quantidade: 1,
        equipamento: { id: 5, descritivo: "Projetor" },
      },
      {
        id: 109,
        salaId: 3,
        equipamentoId: 2,
        quantidade: 1,
        equipamento: { id: 2, descritivo: "Ar-condicionado" },
      },
    ],
    softwares: [
      {
        salaId: 3,
        softwareId: 4,
        software: { id: 4, descritivo: "Figma", versao: "Web/Desktop" },
      },
    ],
  },
  {
    id: 4,
    codigoSvg: "A-LAB-04",
    descritivo: "Lab. 04",
    capacidade: 35,
    blocoId: 1,
    tipoSalaId: 2,
    bloco: blocks[0],
    tipoSala: { id: 2, descritivo: "Laboratório de Redes" },
    statusOcupacao: "Livre",
    equipamentos: [
      {
        id: 110,
        salaId: 4,
        equipamentoId: 4,
        quantidade: 35,
        equipamento: { id: 4, descritivo: "Computadores" },
      },
      {
        id: 111,
        salaId: 4,
        equipamentoId: 5,
        quantidade: 1,
        equipamento: { id: 5, descritivo: "Projetor" },
      },
      {
        id: 112,
        salaId: 4,
        equipamentoId: 2,
        quantidade: 1,
        equipamento: { id: 2, descritivo: "Ar-condicionado" },
      },
    ],
    softwares: [
      {
        salaId: 4,
        softwareId: 5,
        software: { id: 5, descritivo: "Packet Tracer", versao: "8.2" },
      },
      {
        salaId: 4,
        softwareId: 3,
        software: { id: 3, descritivo: "Docker", versao: "27.0" },
      },
    ],
  },
  {
    id: 5,
    codigoSvg: "A-AUD-01",
    descritivo: "Auditório 01",
    capacidade: 80,
    blocoId: 1,
    tipoSalaId: 3,
    bloco: blocks[0],
    tipoSala: { id: 3, descritivo: "Auditório" },
    statusOcupacao: "Livre",
    equipamentos: [
      {
        id: 113,
        salaId: 5,
        equipamentoId: 5,
        quantidade: 1,
        equipamento: { id: 5, descritivo: "Projetor" },
      },
      {
        id: 114,
        salaId: 5,
        equipamentoId: 2,
        quantidade: 1,
        equipamento: { id: 2, descritivo: "Ar-condicionado" },
      },
      {
        id: 115,
        salaId: 5,
        equipamentoId: 3,
        quantidade: 80,
        equipamento: { id: 3, descritivo: "Cadeiras" },
      },
    ],
    softwares: [],
  },
  {
    id: 6,
    codigoSvg: "A-101",
    descritivo: "Sala 101",
    capacidade: 40,
    blocoId: 1,
    tipoSalaId: 1,
    bloco: blocks[0],
    tipoSala: { id: 1, descritivo: "Sala de Aula" },
    statusOcupacao: "Livre",
    equipamentos: [
      {
        id: 116,
        salaId: 6,
        equipamentoId: 1,
        quantidade: 1,
        equipamento: { id: 1, descritivo: 'TV 55"' },
      },
      {
        id: 117,
        salaId: 6,
        equipamentoId: 2,
        quantidade: 1,
        equipamento: { id: 2, descritivo: "Ar-condicionado" },
      },
      {
        id: 118,
        salaId: 6,
        equipamentoId: 3,
        quantidade: 40,
        equipamento: { id: 3, descritivo: "Cadeiras" },
      },
    ],
    softwares: [],
  },
  {
    id: 7,
    codigoSvg: "A-102",
    descritivo: "Sala 102",
    capacidade: 38,
    blocoId: 1,
    tipoSalaId: 1,
    bloco: blocks[0],
    tipoSala: { id: 1, descritivo: "Sala de Aula" },
    statusOcupacao: "Livre",
    equipamentos: [
      {
        id: 119,
        salaId: 7,
        equipamentoId: 5,
        quantidade: 1,
        equipamento: { id: 5, descritivo: "Projetor" },
      },
      {
        id: 120,
        salaId: 7,
        equipamentoId: 3,
        quantidade: 38,
        equipamento: { id: 3, descritivo: "Cadeiras" },
      },
    ],
    softwares: [],
  },
  {
    id: 8,
    codigoSvg: "A-103",
    descritivo: "Sala 103",
    capacidade: 44,
    blocoId: 1,
    tipoSalaId: 1,
    bloco: blocks[0],
    tipoSala: { id: 1, descritivo: "Sala de Aula" },
    statusOcupacao: "Livre",
    equipamentos: [
      {
        id: 121,
        salaId: 8,
        equipamentoId: 1,
        quantidade: 1,
        equipamento: { id: 1, descritivo: 'TV 55"' },
      },
      {
        id: 122,
        salaId: 8,
        equipamentoId: 2,
        quantidade: 1,
        equipamento: { id: 2, descritivo: "Ar-condicionado" },
      },
      {
        id: 123,
        salaId: 8,
        equipamentoId: 3,
        quantidade: 44,
        equipamento: { id: 3, descritivo: "Cadeiras" },
      },
    ],
    softwares: [],
  },
  {
    id: 9,
    codigoSvg: "A-104",
    descritivo: "Sala 104",
    capacidade: 40,
    blocoId: 1,
    tipoSalaId: 1,
    bloco: blocks[0],
    tipoSala: { id: 1, descritivo: "Sala de Aula" },
    statusOcupacao: "Ocupada",
    equipamentos: [
      {
        id: 124,
        salaId: 9,
        equipamentoId: 1,
        quantidade: 1,
        equipamento: { id: 1, descritivo: 'TV 55"' },
      },
      {
        id: 125,
        salaId: 9,
        equipamentoId: 2,
        quantidade: 1,
        equipamento: { id: 2, descritivo: "Ar-condicionado" },
      },
      {
        id: 126,
        salaId: 9,
        equipamentoId: 3,
        quantidade: 40,
        equipamento: { id: 3, descritivo: "Cadeiras" },
      },
    ],
    softwares: [],
  },
  {
    id: 10,
    codigoSvg: "A-105",
    descritivo: "Sala 105",
    capacidade: 36,
    blocoId: 1,
    tipoSalaId: 1,
    bloco: blocks[0],
    tipoSala: { id: 1, descritivo: "Sala de Aula" },
    statusOcupacao: "Livre",
    equipamentos: [
      {
        id: 127,
        salaId: 10,
        equipamentoId: 5,
        quantidade: 1,
        equipamento: { id: 5, descritivo: "Projetor" },
      },
      {
        id: 128,
        salaId: 10,
        equipamentoId: 2,
        quantidade: 1,
        equipamento: { id: 2, descritivo: "Ar-condicionado" },
      },
      {
        id: 129,
        salaId: 10,
        equipamentoId: 3,
        quantidade: 36,
        equipamento: { id: 3, descritivo: "Cadeiras" },
      },
    ],
    softwares: [],
  },
  {
    id: 11,
    codigoSvg: "A-106",
    descritivo: "Sala 106",
    capacidade: 45,
    blocoId: 1,
    tipoSalaId: 1,
    bloco: blocks[0],
    tipoSala: { id: 1, descritivo: "Sala de Aula" },
    statusOcupacao: "Livre",
    equipamentos: [
      {
        id: 130,
        salaId: 11,
        equipamentoId: 1,
        quantidade: 1,
        equipamento: { id: 1, descritivo: 'TV 55"' },
      },
      {
        id: 131,
        salaId: 11,
        equipamentoId: 3,
        quantidade: 45,
        equipamento: { id: 3, descritivo: "Cadeiras" },
      },
    ],
    softwares: [],
  },

  // ================= BLOCO 2 (blocoId: 2 · /bloco-2.svg) =================
  {
    id: 12,
    codigoSvg: "B-AUD-01",
    descritivo: "Auditório 01",
    capacidade: 80,
    blocoId: 2,
    tipoSalaId: 3,
    bloco: blocks[1],
    tipoSala: { id: 3, descritivo: "Auditório" },
    statusOcupacao: "Livre",
    equipamentos: [
      {
        id: 201,
        salaId: 12,
        equipamentoId: 5,
        quantidade: 1,
        equipamento: { id: 5, descritivo: "Projetor" },
      },
      {
        id: 202,
        salaId: 12,
        equipamentoId: 2,
        quantidade: 1,
        equipamento: { id: 2, descritivo: "Ar-condicionado" },
      },
      {
        id: 203,
        salaId: 12,
        equipamentoId: 3,
        quantidade: 80,
        equipamento: { id: 3, descritivo: "Cadeiras" },
      },
    ],
    softwares: [],
  },
  {
    id: 13,
    codigoSvg: "B-LAB-01",
    descritivo: "Lab. 05",
    capacidade: 28,
    blocoId: 2,
    tipoSalaId: 2,
    bloco: blocks[1],
    tipoSala: { id: 2, descritivo: "Laboratório de Informática" },
    statusOcupacao: "Ocupada",
    equipamentos: [
      {
        id: 204,
        salaId: 13,
        equipamentoId: 4,
        quantidade: 28,
        equipamento: { id: 4, descritivo: "Computadores" },
      },
      {
        id: 205,
        salaId: 13,
        equipamentoId: 5,
        quantidade: 1,
        equipamento: { id: 5, descritivo: "Projetor" },
      },
      {
        id: 206,
        salaId: 13,
        equipamentoId: 2,
        quantidade: 1,
        equipamento: { id: 2, descritivo: "Ar-condicionado" },
      },
    ],
    softwares: [
      {
        salaId: 13,
        softwareId: 1,
        software: { id: 1, descritivo: "VS Code", versao: "1.95" },
      },
      {
        salaId: 13,
        softwareId: 7,
        software: { id: 7, descritivo: "Android Studio", versao: "Ladybug" },
      },
    ],
  },
  {
    id: 14,
    codigoSvg: "B-LAB-02",
    descritivo: "Lab. 06",
    capacidade: 32,
    blocoId: 2,
    tipoSalaId: 2,
    bloco: blocks[1],
    tipoSala: { id: 2, descritivo: "Laboratório de Informática" },
    statusOcupacao: "Livre",
    equipamentos: [
      {
        id: 207,
        salaId: 14,
        equipamentoId: 4,
        quantidade: 32,
        equipamento: { id: 4, descritivo: "Computadores" },
      },
      {
        id: 208,
        salaId: 14,
        equipamentoId: 5,
        quantidade: 1,
        equipamento: { id: 5, descritivo: "Projetor" },
      },
      {
        id: 209,
        salaId: 14,
        equipamentoId: 2,
        quantidade: 1,
        equipamento: { id: 2, descritivo: "Ar-condicionado" },
      },
    ],
    softwares: [
      {
        salaId: 14,
        softwareId: 1,
        software: { id: 1, descritivo: "VS Code", versao: "1.95" },
      },
      {
        salaId: 14,
        softwareId: 3,
        software: { id: 3, descritivo: "Docker", versao: "27.0" },
      },
      {
        salaId: 14,
        softwareId: 4,
        software: { id: 4, descritivo: "Figma", versao: "Web/Desktop" },
      },
    ],
  },
  {
    id: 15,
    codigoSvg: "B-LAB-03",
    descritivo: "Lab. 07",
    capacidade: 30,
    blocoId: 2,
    tipoSalaId: 2,
    bloco: blocks[1],
    tipoSala: { id: 2, descritivo: "Laboratório de Informática" },
    statusOcupacao: "Livre",
    equipamentos: [
      {
        id: 210,
        salaId: 15,
        equipamentoId: 4,
        quantidade: 30,
        equipamento: { id: 4, descritivo: "Computadores" },
      },
      {
        id: 211,
        salaId: 15,
        equipamentoId: 1,
        quantidade: 1,
        equipamento: { id: 1, descritivo: 'TV 55"' },
      },
      {
        id: 212,
        salaId: 15,
        equipamentoId: 2,
        quantidade: 1,
        equipamento: { id: 2, descritivo: "Ar-condicionado" },
      },
    ],
    softwares: [
      {
        salaId: 15,
        softwareId: 1,
        software: { id: 1, descritivo: "VS Code", versao: "1.95" },
      },
      {
        salaId: 15,
        softwareId: 2,
        software: { id: 2, descritivo: "Node.js", versao: "22 LTS" },
      },
    ],
  },
  {
    id: 16,
    codigoSvg: "B-LAB-04",
    descritivo: "Lab. 08",
    capacidade: 26,
    blocoId: 2,
    tipoSalaId: 2,
    bloco: blocks[1],
    tipoSala: { id: 2, descritivo: "Laboratório de Informática" },
    statusOcupacao: "Livre",
    equipamentos: [
      {
        id: 213,
        salaId: 16,
        equipamentoId: 4,
        quantidade: 26,
        equipamento: { id: 4, descritivo: "Computadores" },
      },
      {
        id: 214,
        salaId: 16,
        equipamentoId: 5,
        quantidade: 1,
        equipamento: { id: 5, descritivo: "Projetor" },
      },
      {
        id: 215,
        salaId: 16,
        equipamentoId: 2,
        quantidade: 1,
        equipamento: { id: 2, descritivo: "Ar-condicionado" },
      },
    ],
    softwares: [
      {
        salaId: 16,
        softwareId: 3,
        software: { id: 3, descritivo: "Docker", versao: "27.0" },
      },
    ],
  },
  {
    id: 17,
    codigoSvg: "B-101",
    descritivo: "Sala 107",
    capacidade: 36,
    blocoId: 2,
    tipoSalaId: 1,
    bloco: blocks[1],
    tipoSala: { id: 1, descritivo: "Sala de Aula" },
    statusOcupacao: "Livre",
    equipamentos: [
      {
        id: 216,
        salaId: 17,
        equipamentoId: 1,
        quantidade: 1,
        equipamento: { id: 1, descritivo: 'TV 55"' },
      },
      {
        id: 217,
        salaId: 17,
        equipamentoId: 2,
        quantidade: 1,
        equipamento: { id: 2, descritivo: "Ar-condicionado" },
      },
      {
        id: 218,
        salaId: 17,
        equipamentoId: 3,
        quantidade: 36,
        equipamento: { id: 3, descritivo: "Cadeiras" },
      },
    ],
    softwares: [],
  },
  {
    id: 18,
    codigoSvg: "B-102",
    descritivo: "Sala 108",
    capacidade: 40,
    blocoId: 2,
    tipoSalaId: 1,
    bloco: blocks[1],
    tipoSala: { id: 1, descritivo: "Sala de Aula" },
    statusOcupacao: "Livre",
    equipamentos: [
      {
        id: 219,
        salaId: 18,
        equipamentoId: 5,
        quantidade: 1,
        equipamento: { id: 5, descritivo: "Projetor" },
      },
      {
        id: 220,
        salaId: 18,
        equipamentoId: 2,
        quantidade: 1,
        equipamento: { id: 2, descritivo: "Ar-condicionado" },
      },
      {
        id: 221,
        salaId: 18,
        equipamentoId: 3,
        quantidade: 40,
        equipamento: { id: 3, descritivo: "Cadeiras" },
      },
    ],
    softwares: [],
  },
  {
    id: 19,
    codigoSvg: "B-103",
    descritivo: "Sala 109",
    capacidade: 42,
    blocoId: 2,
    tipoSalaId: 1,
    bloco: blocks[1],
    tipoSala: { id: 1, descritivo: "Sala de Aula" },
    statusOcupacao: "Livre",
    equipamentos: [
      {
        id: 222,
        salaId: 19,
        equipamentoId: 1,
        quantidade: 1,
        equipamento: { id: 1, descritivo: 'TV 55"' },
      },
      {
        id: 223,
        salaId: 19,
        equipamentoId: 3,
        quantidade: 42,
        equipamento: { id: 3, descritivo: "Cadeiras" },
      },
    ],
    softwares: [],
  },
  {
    id: 20,
    codigoSvg: "B-104",
    descritivo: "Sala 110",
    capacidade: 38,
    blocoId: 2,
    tipoSalaId: 1,
    bloco: blocks[1],
    tipoSala: { id: 1, descritivo: "Sala de Aula" },
    statusOcupacao: "Livre",
    equipamentos: [
      {
        id: 224,
        salaId: 20,
        equipamentoId: 1,
        quantidade: 1,
        equipamento: { id: 1, descritivo: 'TV 55"' },
      },
      {
        id: 225,
        salaId: 20,
        equipamentoId: 2,
        quantidade: 1,
        equipamento: { id: 2, descritivo: "Ar-condicionado" },
      },
      {
        id: 226,
        salaId: 20,
        equipamentoId: 3,
        quantidade: 38,
        equipamento: { id: 3, descritivo: "Cadeiras" },
      },
    ],
    softwares: [],
  },
  {
    id: 21,
    codigoSvg: "B-105",
    descritivo: "Sala 111",
    capacidade: 40,
    blocoId: 2,
    tipoSalaId: 1,
    bloco: blocks[1],
    tipoSala: { id: 1, descritivo: "Sala de Aula" },
    statusOcupacao: "Livre",
    equipamentos: [
      {
        id: 227,
        salaId: 21,
        equipamentoId: 5,
        quantidade: 1,
        equipamento: { id: 5, descritivo: "Projetor" },
      },
      {
        id: 228,
        salaId: 21,
        equipamentoId: 2,
        quantidade: 1,
        equipamento: { id: 2, descritivo: "Ar-condicionado" },
      },
      {
        id: 229,
        salaId: 21,
        equipamentoId: 3,
        quantidade: 40,
        equipamento: { id: 3, descritivo: "Cadeiras" },
      },
    ],
    softwares: [],
  },
  {
    id: 22,
    codigoSvg: "B-106",
    descritivo: "Sala 112",
    capacidade: 45,
    blocoId: 2,
    tipoSalaId: 1,
    bloco: blocks[1],
    tipoSala: { id: 1, descritivo: "Sala de Aula" },
    statusOcupacao: "Livre",
    equipamentos: [
      {
        id: 230,
        salaId: 22,
        equipamentoId: 1,
        quantidade: 1,
        equipamento: { id: 1, descritivo: 'TV 55"' },
      },
      {
        id: 231,
        salaId: 22,
        equipamentoId: 2,
        quantidade: 1,
        equipamento: { id: 2, descritivo: "Ar-condicionado" },
      },
      {
        id: 232,
        salaId: 22,
        equipamentoId: 3,
        quantidade: 45,
        equipamento: { id: 3, descritivo: "Cadeiras" },
      },
    ],
    softwares: [],
  },
];

// ==========================================
// 3 CONTAS PADRÕES PRÉ-CONFIGURADAS (META 4)
// ==========================================

export const defaultAccounts: {
  gestor: Usuario;
  professor: Usuario;
  aluno: Usuario;
} = {
  gestor: {
    id: 99,
    nome: "Bruno Lallo",
    ra: "G-2026001",
    email: "bruno.lallo@fatec.sp.gov.br",
    senha: "123456",
    emailValidado: true,
    tipoUsuario: "GESTOR",
    gestor: { id: 1, usuarioId: 99 },
  },
  professor: {
    id: 2,
    nome: "Marina Prado",
    ra: "P-10482",
    email: "marina.prado@fatec.sp.gov.br",
    senha: "123456",
    emailValidado: true,
    tipoUsuario: "PROFESSOR",
    professor: {
      id: 1,
      usuarioId: 2,
      disciplinas: [
        systemDisciplinas[0], // Engenharia de Software II (DSM)
        systemDisciplinas[1], // Banco de Dados Relacional (DSM)
        systemDisciplinas[2], // Algoritmos e Lógica de Programação (DSM)
        systemDisciplinas[3], // DevOps e Integração Contínua (DSM)
      ],
    },
  },
  aluno: {
    id: 1,
    nome: "Gabriel Lima",
    ra: "1460482213021",
    email: "gabriel.lima@fatec.sp.gov.br",
    senha: "123456",
    emailValidado: true,
    tipoUsuario: "ALUNO",
    aluno: {
      id: 1,
      usuarioId: 1,
      cursoId: 1,
      semestre: 4,
      curso: { id: 1, descritivo: "DSM" },
      ativo: true,
    },
  },
};

export const systemUsers: Usuario[] = [
  defaultAccounts.aluno,
  defaultAccounts.professor,
  defaultAccounts.gestor,
  {
    id: 3,
    nome: "Rafael Ferreira",
    ra: "1460482213044",
    email: "rafael.ferreira@fatec.sp.gov.br",
    senha: "123456",
    emailValidado: true,
    tipoUsuario: "ALUNO",
    aluno: {
      id: 2,
      usuarioId: 3,
      cursoId: 2,
      semestre: 5,
      curso: { id: 2, descritivo: "GTI" },
      ativo: true,
    },
  },
  {
    id: 4,
    nome: "Carla Santos",
    ra: "P-10229",
    email: "carla.santos@fatec.sp.gov.br",
    senha: "123456",
    emailValidado: true,
    tipoUsuario: "PROFESSOR",
    professor: {
      id: 2,
      usuarioId: 4,
      disciplinas: [
        systemDisciplinas[4], // Programação para Dispositivos Móveis (GTI)
        systemDisciplinas[5], // Governança e Gestão de TI (GTI)
      ],
    },
  },
  {
    id: 5,
    nome: "Ana Martins",
    ra: "1460482213098",
    email: "ana.martins@fatec.sp.gov.br",
    senha: "123456",
    emailValidado: false,
    tipoUsuario: "ALUNO",
    aluno: {
      id: 3,
      usuarioId: 5,
      cursoId: 1,
      semestre: 2,
      curso: { id: 1, descritivo: "DSM" },
      ativo: false,
    },
  },
  {
    id: 6,
    nome: "Lucas Oliveira",
    ra: "1460482113012",
    email: "lucas.oliveira@fatec.sp.gov.br",
    senha: "123456",
    emailValidado: true,
    tipoUsuario: "ALUNO",
    aluno: {
      id: 4,
      usuarioId: 6,
      cursoId: 1,
      semestre: 6,
      curso: { id: 1, descritivo: "DSM" },
      ativo: true,
    },
  },
  {
    id: 7,
    nome: "Beatriz Costa",
    ra: "1460482313055",
    email: "beatriz.costa@fatec.sp.gov.br",
    senha: "123456",
    emailValidado: true,
    tipoUsuario: "ALUNO",
    aluno: {
      id: 5,
      usuarioId: 7,
      cursoId: 4,
      semestre: 3,
      curso: { id: 4, descritivo: "Logística" },
      ativo: true,
    },
  },
  {
    id: 8,
    nome: "Eduardo Almeida",
    ra: "P-10510",
    email: "eduardo.almeida@fatec.sp.gov.br",
    senha: "123456",
    emailValidado: true,
    tipoUsuario: "PROFESSOR",
    professor: {
      id: 3,
      usuarioId: 8,
      disciplinas: [
        systemDisciplinas[6], // Desenvolvimento Web Full Stack (DSM)
        systemDisciplinas[7], // Segurança da Informação (GTI)
      ],
    },
  },
  {
    id: 9,
    nome: "Fernanda Souza",
    ra: "1460482223019",
    email: "fernanda.souza@fatec.sp.gov.br",
    senha: "123456",
    emailValidado: true,
    tipoUsuario: "ALUNO",
    aluno: {
      id: 6,
      usuarioId: 9,
      cursoId: 3,
      semestre: 4,
      curso: { id: 3, descritivo: "GPI" },
      ativo: true,
    },
  },
  {
    id: 10,
    nome: "Matheus Rodrigues",
    ra: "1460482413007",
    email: "matheus.rodrigues@fatec.sp.gov.br",
    senha: "123456",
    emailValidado: true,
    tipoUsuario: "ALUNO",
    aluno: {
      id: 7,
      usuarioId: 10,
      cursoId: 2,
      semestre: 1,
      curso: { id: 2, descritivo: "GTI" },
      ativo: true,
    },
  },
  {
    id: 11,
    nome: "Ricardo Mendes",
    ra: "P-10388",
    email: "ricardo.mendes@fatec.sp.gov.br",
    senha: "123456",
    emailValidado: true,
    tipoUsuario: "PROFESSOR",
    professor: {
      id: 4,
      usuarioId: 11,
      disciplinas: [
        systemDisciplinas[8], // Logística Portuária e Modais (Logística)
        systemDisciplinas[9], // Gestão da Cadeia de Suprimentos (Logística)
      ],
    },
  },
  {
    id: 12,
    nome: "Juliana Pereira",
    ra: "1460482123033",
    email: "juliana.pereira@fatec.sp.gov.br",
    senha: "123456",
    emailValidado: true,
    tipoUsuario: "ALUNO",
    aluno: {
      id: 8,
      usuarioId: 12,
      cursoId: 5,
      semestre: 5,
      curso: { id: 5, descritivo: "Meio Ambiente" },
      ativo: true,
    },
  },
  {
    id: 13,
    nome: "Thiago Nascimento",
    ra: "1460482313081",
    email: "thiago.nascimento@fatec.sp.gov.br",
    senha: "123456",
    emailValidado: false,
    tipoUsuario: "ALUNO",
    aluno: {
      id: 9,
      usuarioId: 13,
      cursoId: 6,
      semestre: 3,
      curso: { id: 6, descritivo: "Construção Naval" },
      ativo: false,
    },
  },
  {
    id: 14,
    nome: "Patrícia Gomes",
    ra: "G-2026002",
    email: "patricia.gomes@fatec.sp.gov.br",
    senha: "123456",
    emailValidado: true,
    tipoUsuario: "GESTOR",
    gestor: { id: 2, usuarioId: 14 },
  },
  {
    id: 15,
    nome: "Camila Ribeiro",
    ra: "1460482313014",
    email: "camila.ribeiro@fatec.sp.gov.br",
    senha: "123456",
    emailValidado: true,
    tipoUsuario: "ALUNO",
    aluno: {
      id: 10,
      usuarioId: 15,
      cursoId: 1,
      semestre: 3,
      curso: { id: 1, descritivo: "DSM" },
      ativo: true,
    },
  },
];

// ==========================================
// SOLICITAÇÕES DE AGENDAMENTO DINÂMICAS (META 11)
// ==========================================

function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildDynamicSlotIso(
  now: Date,
  offsetDays: number,
  slotLabel: string,
  offsetMonths = 0
): { dateStr: string; inicio: string; fim: string } {
  const parts = slotLabel.split("—").map((s) => s.trim());
  const startPart = parts[0] || "07:45";
  const endPart = parts[1] || "09:25";
  const [startH, startM] = startPart.split(":").map(Number);
  const slotStartMinutes = startH * 60 + startM;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Regra de Virada Inteligente de Dia (Hoje vs. Amanhã):
  // Se o agendamento era para hoje (offsetDays === 0 e offsetMonths === 0),
  // mas a faixa horária já passou no relógio do usuário, avança para amanhã (+1 dia).
  let effectiveOffsetDays = offsetDays;
  if (offsetMonths === 0 && offsetDays === 0 && currentMinutes >= slotStartMinutes) {
    effectiveOffsetDays = 1;
  }

  const target =
    offsetMonths === 0
      ? new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + effectiveOffsetDays
        )
      : new Date(
          now.getFullYear(),
          now.getMonth() + offsetMonths,
          Math.min(26, Math.max(2, effectiveOffsetDays))
        );

  const dateStr = formatLocalDate(target);
  return {
    dateStr,
    inicio: `${dateStr}T${startPart}:00.000Z`,
    fim: `${dateStr}T${endPart}:00.000Z`,
  };
}

export function generateDynamicMockRequests(now: Date = new Date()): Agendamento[] {
  const findUser = (id: number) =>
    systemUsers.find((u) => u.id === id) ?? defaultAccounts.aluno;
  const createdIso = new Date(now.getTime() - 2 * 3600 * 1000).toISOString();

  const s1 = buildDynamicSlotIso(now, 0, "07:45 — 09:25");
  const s2 = buildDynamicSlotIso(now, 0, "09:30 — 11:10");
  const s3 = buildDynamicSlotIso(now, 0, "19:00 — 20:40");
  const s4 = buildDynamicSlotIso(now, 0, "20:50 — 22:30");
  const s5 = buildDynamicSlotIso(now, 0, "17:20 — 19:00");
  const s6 = buildDynamicSlotIso(now, 1, "07:45 — 09:25");
  const s7 = buildDynamicSlotIso(now, 1, "11:20 — 13:00");
  const s8 = buildDynamicSlotIso(now, 1, "19:00 — 20:40");
  const s9 = buildDynamicSlotIso(now, 2, "09:30 — 11:10");
  const s10 = buildDynamicSlotIso(now, 2, "17:20 — 19:00");
  const s11 = buildDynamicSlotIso(now, 3, "19:00 — 20:40");
  const s12 = buildDynamicSlotIso(now, 3, "20:50 — 22:30");
  const s13 = buildDynamicSlotIso(now, 4, "07:45 — 09:25");
  const s14 = buildDynamicSlotIso(now, 4, "09:30 — 11:10");
  const s15 = buildDynamicSlotIso(now, 5, "19:00 — 20:40");
  const s16 = buildDynamicSlotIso(now, 6, "11:20 — 13:00");

  // Agendamentos do próximo mês (+1 mês) para testar o filtro mensal do Gestor
  const m1 = buildDynamicSlotIso(now, 4, "07:45 — 09:25", 1);
  const m2 = buildDynamicSlotIso(now, 8, "19:00 — 20:40", 1);
  const m3 = buildDynamicSlotIso(now, 12, "09:30 — 11:10", 1);
  const m4 = buildDynamicSlotIso(now, 15, "20:50 — 22:30", 1);
  const m5 = buildDynamicSlotIso(now, 19, "17:20 — 19:00", 1);

  return [
    {
      id: 1,
      solicitanteId: 2,
      salaId: 1,
      cursoId: 1,
      disciplinaId: 4,
      dataInicio: s1.inicio,
      dataFim: s1.fim,
      motivo: "Aula prática de Containerização e DevOps",
      status: "PENDENTE",
      criadoEm: createdIso,
      solicitante: findUser(2), // Marina Prado (PROFESSOR)
      sala: rooms[0], // Lab. 01
      curso: { id: 1, descritivo: "DSM" },
      disciplina: systemDisciplinas[3], // DevOps e Integração Contínua
    },
    {
      id: 2,
      solicitanteId: 1,
      salaId: 6,
      cursoId: 1,
      dataInicio: s2.inicio,
      dataFim: s2.fim,
      motivo: "Reunião de Sprint do Projeto Integrador DSM",
      status: "PENDENTE",
      criadoEm: createdIso,
      solicitante: findUser(1), // Gabriel Lima (ALUNO)
      sala: rooms[5], // Sala 101
      curso: { id: 1, descritivo: "DSM" },
    },
    {
      id: 3,
      solicitanteId: 2,
      salaId: 9,
      cursoId: 1,
      disciplinaId: 3,
      dataInicio: s3.inicio,
      dataFim: s3.fim,
      motivo: "Algoritmos e Lógica de Programação",
      status: "APROVADO",
      criadoEm: createdIso,
      solicitante: findUser(2),
      sala: rooms[8], // Sala 104
      curso: { id: 1, descritivo: "DSM" },
      disciplina: systemDisciplinas[2], // Algoritmos e Lógica de Programação
    },
    {
      id: 4,
      solicitanteId: 4,
      salaId: 13,
      cursoId: 2,
      disciplinaId: 5,
      dataInicio: s3.inicio,
      dataFim: s3.fim,
      motivo: "Programação para Dispositivos Móveis",
      status: "APROVADO",
      criadoEm: createdIso,
      solicitante: findUser(4), // Carla Santos (PROFESSOR)
      sala: rooms[12], // Lab. 05
      curso: { id: 2, descritivo: "GTI" },
      disciplina: systemDisciplinas[4], // Programação para Dispositivos Móveis
    },
    {
      id: 5,
      solicitanteId: 6,
      salaId: null,
      cursoId: 1,
      dataInicio: s4.inicio,
      dataFim: s4.fim,
      motivo:
        "Solicitação sem sala definida (RF 401) · Requisitos: mín. 25 cadeiras, TV/Projetor, Ar-condicionado, Computadores, Software: Docker",
      status: "PENDENTE",
      criadoEm: createdIso,
      solicitante: findUser(6), // Lucas Oliveira (ALUNO)
      sala: null,
      curso: { id: 1, descritivo: "DSM" },
      semSalaOriginal: true,
      requisitosFiltro: {
        minCadeiras: 25,
        equipamentos: ["TV/Projetor", "Ar-condicionado", "Computadores"],
        hasTvOrProjector: true,
        hasAc: true,
        hasComputers: true,
        software: "Docker",
      },
    },
    {
      id: 6,
      solicitanteId: 8,
      salaId: null,
      cursoId: 1,
      disciplinaId: 7,
      dataInicio: s5.inicio,
      dataFim: s5.fim,
      motivo:
        "Solicitação docente sem sala definida (RF 401) · Requisitos: mín. 28 cadeiras, TV/Projetor, Computadores, Software: VS Code",
      status: "PENDENTE",
      criadoEm: createdIso,
      solicitante: findUser(8), // Eduardo Almeida (PROFESSOR)
      sala: null,
      curso: { id: 1, descritivo: "DSM" },
      disciplina: systemDisciplinas[6], // Desenvolvimento Web Full Stack
      semSalaOriginal: true,
      requisitosFiltro: {
        minCadeiras: 28,
        equipamentos: ["TV/Projetor", "Computadores"],
        hasTvOrProjector: true,
        hasAc: false,
        hasComputers: true,
        software: "VS Code",
      },
    },
    {
      id: 7,
      solicitanteId: 4,
      salaId: 12,
      cursoId: 2,
      disciplinaId: 6,
      dataInicio: s6.inicio,
      dataFim: s6.fim,
      motivo: "Palestra de Governança e Gestão de TI",
      status: "PENDENTE",
      criadoEm: createdIso,
      solicitante: findUser(4), // Carla Santos (PROFESSOR)
      sala: rooms[11], // Auditório 01 (Bloco 2)
      curso: { id: 2, descritivo: "GTI" },
      disciplina: systemDisciplinas[5], // Governança e Gestão de TI
    },
    {
      id: 8,
      solicitanteId: 3,
      salaId: 17,
      cursoId: 2,
      dataInicio: s7.inicio,
      dataFim: s7.fim,
      motivo: "Estudo em grupo de Banco de Dados",
      status: "PENDENTE",
      criadoEm: createdIso,
      solicitante: findUser(3), // Rafael Ferreira (ALUNO)
      sala: rooms[16], // Sala 107
      curso: { id: 2, descritivo: "GTI" },
    },
    {
      id: 9,
      solicitanteId: 1,
      salaId: 2,
      cursoId: 1,
      dataInicio: s8.inicio,
      dataFim: s8.fim,
      motivo: "Laboratório livre para testes de API Node.js",
      status: "EM_NEGOCIACAO",
      criadoEm: createdIso,
      solicitante: findUser(1), // Gabriel Lima (ALUNO)
      sala: rooms[1], // Lab. 02
      salaProposta: rooms[14], // Lab. 07
      dataProposta: s8.dateStr,
      horarioProposto: "19:00 — 20:40",
      foraDosFiltros: false,
      curso: { id: 1, descritivo: "DSM" },
      historico: [
        {
          id: 1,
          agendamentoId: 9,
          autorId: 99,
          statusAnterior: "PENDENTE",
          statusNovo: "EM_NEGOCIACAO",
          justificativa: "Lab. 02 em manutenção preventiva; sugerido Lab. 07 no Bloco 2.",
          salaPropostaId: 15,
          dataInicioProposta: s8.inicio,
          dataFimProposta: s8.fim,
          criadoEm: createdIso,
        },
      ],
    },
    {
      id: 10,
      solicitanteId: 7,
      salaId: 8,
      cursoId: 4,
      dataInicio: s9.inicio,
      dataFim: s9.fim,
      motivo: "Simulação de Cadeia de Suprimentos",
      status: "APROVADO",
      criadoEm: createdIso,
      solicitante: findUser(7), // Beatriz Costa (ALUNO - Logística)
      sala: rooms[7], // Sala 103
      curso: { id: 4, descritivo: "Logística" },
    },
    {
      id: 11,
      solicitanteId: 11,
      salaId: 5,
      cursoId: 4,
      disciplinaId: 9,
      dataInicio: s10.inicio,
      dataFim: s10.fim,
      motivo: "Workshop de Logística Portuária e Modais",
      status: "APROVADO",
      criadoEm: createdIso,
      solicitante: findUser(11), // Ricardo Mendes (PROFESSOR)
      sala: rooms[4], // Auditório 01 (Bloco 1)
      curso: { id: 4, descritivo: "Logística" },
      disciplina: systemDisciplinas[8], // Logística Portuária e Modais
    },
    {
      id: 12,
      solicitanteId: 9,
      salaId: 10,
      cursoId: 3,
      dataInicio: s11.inicio,
      dataFim: s11.fim,
      motivo: "Revisão de Planejamento e Controle da Produção",
      status: "REJEITADO",
      criadoEm: createdIso,
      solicitante: findUser(9), // Fernanda Souza (ALUNO - GPI)
      sala: rooms[9], // Sala 105
      curso: { id: 3, descritivo: "GPI" },
      historico: [
        {
          id: 1,
          agendamentoId: 12,
          autorId: 99,
          statusAnterior: "PENDENTE",
          statusNovo: "REJEITADO",
          justificativa: "Sala reservada para aplicação de exame institucional.",
          criadoEm: createdIso,
        },
      ],
    },
    {
      id: 13,
      solicitanteId: 10,
      salaId: 4,
      cursoId: 2,
      dataInicio: s12.inicio,
      dataFim: s12.fim,
      motivo: "Prática de Configuração de Roteadores no Packet Tracer",
      status: "PENDENTE",
      criadoEm: createdIso,
      solicitante: findUser(10), // Matheus Rodrigues (ALUNO - GTI)
      sala: rooms[3], // Lab. 04
      curso: { id: 2, descritivo: "GTI" },
    },
    {
      id: 14,
      solicitanteId: 15,
      salaId: 3,
      cursoId: 1,
      dataInicio: s13.inicio,
      dataFim: s13.fim,
      motivo: "Prototipação de Interfaces no Figma (UX/UI)",
      status: "APROVADO",
      criadoEm: createdIso,
      solicitante: findUser(15), // Camila Ribeiro (ALUNO - DSM)
      sala: rooms[2], // Lab. 03
      curso: { id: 1, descritivo: "DSM" },
    },
    {
      id: 15,
      solicitanteId: 12,
      salaId: 18,
      cursoId: 5,
      dataInicio: s14.inicio,
      dataFim: s14.fim,
      motivo: "Apresentação de Seminário de Gestão Ambiental",
      status: "REJEITADO",
      criadoEm: createdIso,
      solicitante: findUser(12), // Juliana Pereira (ALUNO - Meio Ambiente)
      sala: rooms[17], // Sala 108
      curso: { id: 5, descritivo: "Meio Ambiente" },
      historico: [
        {
          id: 1,
          agendamentoId: 15,
          autorId: 99,
          statusAnterior: "PENDENTE",
          statusNovo: "REJEITADO",
          justificativa: "Conflito com manutenção elétrica programada no Bloco 2.",
          criadoEm: createdIso,
        },
      ],
    },
    {
      id: 16,
      solicitanteId: 8,
      salaId: 14,
      cursoId: 1,
      disciplinaId: 7,
      dataInicio: s15.inicio,
      dataFim: s15.fim,
      motivo: "Mentoria de Arquitetura de Microsserviços",
      status: "APROVADO",
      criadoEm: createdIso,
      solicitante: findUser(8), // Eduardo Almeida (PROFESSOR)
      sala: rooms[13], // Lab. 06
      curso: { id: 1, descritivo: "DSM" },
      disciplina: systemDisciplinas[6], // Desenvolvimento Web Full Stack
    },
    {
      id: 17,
      solicitanteId: 3,
      salaId: null,
      cursoId: 2,
      dataInicio: s16.inicio,
      dataFim: s16.fim,
      motivo:
        "Solicitação sem sala definida (RF 401) · Requisitos: mín. 35 cadeiras, TV/Projetor, Ar-condicionado",
      status: "EM_NEGOCIACAO",
      criadoEm: createdIso,
      solicitante: findUser(3), // Rafael Ferreira (ALUNO)
      sala: null,
      salaProposta: rooms[6], // Sala 102 (sem AC - fora dos filtros)
      dataProposta: s16.dateStr,
      horarioProposto: "11:20 — 13:00",
      foraDosFiltros: true,
      semSalaOriginal: true,
      requisitosFiltro: {
        minCadeiras: 35,
        equipamentos: ["TV/Projetor", "Ar-condicionado"],
        hasTvOrProjector: true,
        hasAc: true,
        hasComputers: false,
        software: "",
      },
      curso: { id: 2, descritivo: "GTI" },
      historico: [
        {
          id: 1,
          agendamentoId: 17,
          autorId: 99,
          statusAnterior: "PENDENTE",
          statusNovo: "EM_NEGOCIACAO",
          justificativa:
            "Alocação sugerida em Sala 102 (fora dos filtros originais: Sem Ar-condicionado). Aguardando confirmação do solicitante.",
          salaPropostaId: 7,
          dataInicioProposta: s16.inicio,
          dataFimProposta: s16.fim,
          criadoEm: createdIso,
        },
      ],
    },
    // ================= PRÓXIMO MÊS (+1 MÊS) =================
    {
      id: 18,
      solicitanteId: 2,
      salaId: 1,
      cursoId: 1,
      disciplinaId: 1,
      dataInicio: m1.inicio,
      dataFim: m1.fim,
      motivo: "Banca de Pré-Apresentação do Projeto Integrador",
      status: "PENDENTE",
      criadoEm: createdIso,
      solicitante: findUser(2), // Marina Prado (PROFESSOR)
      sala: rooms[0], // Lab. 01
      curso: { id: 1, descritivo: "DSM" },
      disciplina: systemDisciplinas[0], // Engenharia de Software II
    },
    {
      id: 19,
      solicitanteId: 1,
      salaId: 14,
      cursoId: 1,
      dataInicio: m2.inicio,
      dataFim: m2.fim,
      motivo: "Ensaio Geral de Demonstração de Software DSM",
      status: "PENDENTE",
      criadoEm: createdIso,
      solicitante: findUser(1), // Gabriel Lima (ALUNO)
      sala: rooms[13], // Lab. 06
      curso: { id: 1, descritivo: "DSM" },
    },
    {
      id: 20,
      solicitanteId: 4,
      salaId: 5,
      cursoId: 2,
      disciplinaId: 6,
      dataInicio: m3.inicio,
      dataFim: m3.fim,
      motivo: "Simpósio Mensal de Tecnologia da Informação",
      status: "APROVADO",
      criadoEm: createdIso,
      solicitante: findUser(4), // Carla Santos (PROFESSOR)
      sala: rooms[4], // Auditório 01
      curso: { id: 2, descritivo: "GTI" },
      disciplina: systemDisciplinas[5], // Governança e Gestão de TI
    },
    {
      id: 21,
      solicitanteId: 11,
      salaId: 12,
      cursoId: 4,
      disciplinaId: 10,
      dataInicio: m4.inicio,
      dataFim: m4.fim,
      motivo: "Encontro Regional de Logística e Operações",
      status: "APROVADO",
      criadoEm: createdIso,
      solicitante: findUser(11), // Ricardo Mendes (PROFESSOR)
      sala: rooms[11], // Auditório 01 (Bloco 2)
      curso: { id: 4, descritivo: "Logística" },
      disciplina: systemDisciplinas[9], // Gestão da Cadeia de Suprimentos
    },
    {
      id: 22,
      solicitanteId: 6,
      salaId: null,
      cursoId: 1,
      dataInicio: m5.inicio,
      dataFim: m5.fim,
      motivo:
        "Solicitação sem sala definida (RF 401) · Requisitos: mín. 30 cadeiras, Computadores, Software: Node.js",
      status: "PENDENTE",
      criadoEm: createdIso,
      solicitante: findUser(6), // Lucas Oliveira (ALUNO)
      sala: null,
      curso: { id: 1, descritivo: "DSM" },
      semSalaOriginal: true,
      requisitosFiltro: {
        minCadeiras: 30,
        equipamentos: ["Computadores"],
        hasTvOrProjector: false,
        hasAc: false,
        hasComputers: true,
        software: "Node.js",
      },
    },
  ];
}

export const buildInitialRequests = generateDynamicMockRequests;
export const initialRequests: Agendamento[] = generateDynamicMockRequests();
