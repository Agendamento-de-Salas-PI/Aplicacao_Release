// src/types/index.ts

// Enums idênticos ao src/prisma/contract.prisma
export type TipoUsuario = "ALUNO" | "PROFESSOR" | "GESTOR";

export type StatusAgendamento =
  | "PENDENTE"
  | "APROVADO"
  | "REJEITADO"
  | "CANCELADO"
  | "EM_NEGOCIACAO";

// Status visual da sala no mapa/grid (calculado a partir dos agendamentos do dia)
export type StatusOcupacaoSala = "Livre" | "Ocupada" | "Em breve";

// Modelos relacionais baseados no Prisma
export interface Curso {
  id: number;
  descritivo: string;
}

export interface Disciplina {
  id: number;
  descritivo: string;
  cursoId: number;
  curso?: Curso;
}

export interface SvgRectElement {
  id: string;
  x?: number;
  y?: number;
  width: number;
  height: number;
  fill?: string;
  rx?: number;
  isBackground?: boolean;
}

export interface Bloco {
  id: number;
  descritivo: string;
  svgUrl?: string;
  svgViewBox?: string;
  svgTemplate?: "rectangles" | "architectural";
  svgRects?: SvgRectElement[];
  wallPaths?: string;
  hallPath?: string;
  hallLabel?: { text: string; x: number; y: number };
  doorPaths?: string;
}

export interface TipoSala {
  id: number;
  descritivo: string;
}

export interface Equipamento {
  id: number;
  descritivo: string;
  descricao?: string | null;
}

export interface SalaEquipamento {
  id: number;
  salaId: number;
  equipamentoId: number;
  quantidade: number;
  equipamento: Equipamento;
}

export interface Software {
  id: number;
  descritivo: string;
  versao?: string | null;
}

export interface SalaSoftware {
  salaId: number;
  softwareId: number;
  software: Software;
}

export interface Aluno {
  id: number;
  usuarioId: number;
  cursoId: number;
  semestre: number;
  curso?: Curso;
  ativo: boolean;
}

export interface Professor {
  id: number;
  usuarioId: number;
  disciplinas?: Disciplina[];
}

export interface Gestor {
  id: number;
  usuarioId: number;
}

// Entidade Usuario (compatível com prisma.usuario.findMany({ include: { aluno: { include: { curso: true } }, professor: ... } }))
export interface Usuario {
  id: number;
  nome: string;
  cpf?: string | null;
  ra: string;
  email: string;
  senha?: string;
  emailValidado: boolean;
  tipoUsuario: TipoUsuario;
  aluno?: Aluno | null;
  professor?: Professor | null;
  gestor?: Gestor | null;
}

// Entidade Sala (compatível com prisma.sala.findMany({ include: { bloco: true, tipoSala: true, equipamentos: { include: { equipamento: true } }, softwares: { include: { software: true } } } }))
export interface Sala {
  id: number;
  descritivo: string;
  codigoSvg: string;
  capacidade: number;
  blocoId: number;
  tipoSalaId: number;
  bloco: Bloco;
  tipoSala: TipoSala;
  equipamentos: SalaEquipamento[];
  softwares: SalaSoftware[];
  // Campo auxiliar para o estado visual do mapa em tempo real
  statusOcupacao?: StatusOcupacaoSala;
}

export interface AlteracaoAgendamento {
  id: number;
  agendamentoId: number;
  autorId: number;
  statusAnterior: StatusAgendamento;
  statusNovo: StatusAgendamento;
  justificativa?: string | null;
  salaPropostaId?: number | null;
  dataInicioProposta?: string | Date | null;
  dataFimProposta?: string | Date | null;
  criadoEm: string | Date;
}

export interface RequisitosFiltroAgendamento {
  minCadeiras: number;
  hasTvOrProjector?: boolean;
  hasAc?: boolean;
  hasComputers?: boolean;
  equipamentos: string[];
  software?: string;
}

// Entidade Agendamento (compatível com prisma.agendamento.findMany({ include: { solicitante: true, sala: { include: { bloco: true } }, curso: true } }))
export interface Agendamento {
  id: number;
  solicitanteId: number;
  salaId: number | null;
  cursoId?: number | null;
  disciplinaId?: number | null;
  dataInicio: string | Date;
  dataFim: string | Date;
  motivo?: string | null;
  status: StatusAgendamento;
  criadoEm: string | Date;
  solicitante: Usuario;
  sala?: Sala | null;
  curso?: Curso | null;
  disciplina?: Disciplina | null;
  historico?: AlteracaoAgendamento[];
  requisitosFiltro?: RequisitosFiltroAgendamento | null;
  salaProposta?: Sala | null;
  dataProposta?: string | null;
  horarioProposto?: string | null;
  foraDosFiltros?: boolean;
  recusadoPeloUsuario?: boolean;
  motivoRecusaUsuario?: string | null;
  semSalaOriginal?: boolean;
}

// Aliases para facilitar a importação nos componentes de UI
export type UserRole = TipoUsuario;
export type BookingStatus = StatusAgendamento;
export type User = Usuario;
export type Room = Sala;
export type BookingRequest = Agendamento;
