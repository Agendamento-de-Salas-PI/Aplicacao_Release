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
  if (u.tipoUsuario === "PROFESSOR" && u.professor?.cursos?.length) {
    return u.professor.cursos.map((c) => c.curso.descritivo).join(", ");
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
    nome: "João Pedro da Silva",
    ra: "G-2026001",
    email: "joao.silva@fatec.sp.gov.br",
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
      cursos: [
        {
          professorId: 1,
          cursoId: 1,
          curso: { id: 1, descritivo: "DSM" },
        },
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
      cursos: [
        {
          professorId: 2,
          cursoId: 2,
          curso: { id: 2, descritivo: "GTI" },
        },
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
];

// ==========================================
// SOLICITAÇÕES DE AGENDAMENTO INICIAIS
// ==========================================

export const initialRequests: Agendamento[] = [
  {
    id: 1,
    solicitanteId: 2,
    salaId: 1,
    cursoId: 1,
    dataInicio: "2026-05-22T07:45:00.000Z",
    dataFim: "2026-05-22T09:25:00.000Z",
    motivo: "Aula prática de laboratório",
    status: "PENDENTE",
    criadoEm: "2026-05-18T10:00:00.000Z",
    solicitante: defaultAccounts.professor,
    sala: rooms[0], // Lab. A-01 (DevOps)
    curso: { id: 1, descritivo: "DSM" },
  },
  {
    id: 2,
    solicitanteId: 1,
    salaId: 6,
    cursoId: 1,
    dataInicio: "2026-05-22T09:30:00.000Z",
    dataFim: "2026-05-22T11:10:00.000Z",
    motivo: "Reunião do Projeto Integrador",
    status: "PENDENTE",
    criadoEm: "2026-05-18T11:20:00.000Z",
    solicitante: defaultAccounts.aluno,
    sala: rooms[5], // Sala A-101
    curso: { id: 1, descritivo: "DSM" },
  },
  {
    id: 3,
    solicitanteId: 4,
    salaId: 12,
    cursoId: 2,
    dataInicio: "2026-05-23T19:00:00.000Z",
    dataFim: "2026-05-23T20:40:00.000Z",
    motivo: "Palestra de Gestão de TI",
    status: "PENDENTE",
    criadoEm: "2026-05-18T14:00:00.000Z",
    solicitante: systemUsers[4], // Carla Santos (PROFESSOR)
    sala: rooms[11], // Auditório B-01
    curso: { id: 2, descritivo: "GTI" },
  },
  {
    id: 4,
    solicitanteId: 3,
    salaId: 17,
    cursoId: 2,
    dataInicio: "2026-05-25T17:20:00.000Z",
    dataFim: "2026-05-25T19:00:00.000Z",
    motivo: "Estudo em grupo",
    status: "PENDENTE",
    criadoEm: "2026-05-19T09:15:00.000Z",
    solicitante: systemUsers[3], // Rafael Ferreira (ALUNO)
    sala: rooms[16], // Sala B-101
    curso: { id: 2, descritivo: "GTI" },
  },
  {
    id: 5,
    solicitanteId: 2,
    salaId: 9,
    cursoId: 1,
    dataInicio: "2026-05-22T07:45:00.000Z",
    dataFim: "2026-05-22T09:25:00.000Z",
    motivo: "Algoritmos e Lógica de Programação",
    status: "APROVADO",
    criadoEm: "2026-05-15T08:00:00.000Z",
    solicitante: defaultAccounts.professor,
    sala: rooms[8], // Sala A-104
    curso: { id: 1, descritivo: "DSM" },
  },
  {
    id: 6,
    solicitanteId: 4,
    salaId: 13,
    cursoId: 2,
    dataInicio: "2026-05-22T07:45:00.000Z",
    dataFim: "2026-05-22T09:25:00.000Z",
    motivo: "Programação para Dispositivos Móveis",
    status: "APROVADO",
    criadoEm: "2026-05-16T09:00:00.000Z",
    solicitante: systemUsers[4],
    sala: rooms[12], // Lab. B-01 (Mobile)
    curso: { id: 2, descritivo: "GTI" },
  },
];
