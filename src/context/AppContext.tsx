"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import {
  type Usuario,
  type TipoUsuario,
  type Sala,
  type Bloco,
  type Agendamento,
  type StatusAgendamento,
  type SalaEquipamento,
  type SalaSoftware,
  type RequisitosFiltroAgendamento,
  type Disciplina,
} from "@/types";
import {
  rooms as initialRooms,
  blocks as initialBlocks,
  generateDynamicMockRequests,
  systemUsers as initialUsers,
  defaultAccounts,
  systemCourses,
  systemDisciplinas,
  OFFICIAL_TIME_SLOTS,
  formatIntervaloHorario,
  getTodayLocalStr,
  isTimeSlotPast,
} from "@/data/mockData";
import { Icon } from "@/components/Icon";

export interface RegisterUserData {
  nome: string;
  ra: string;
  email: string;
  senha?: string;
  tipoUsuario: TipoUsuario;
  cursoDesc?: string;
  semestre?: number;
  disciplinaIds?: number[];
}

export interface CreateBookingData {
  salaId: number | null;
  date: string; // Ex.: "2026-05-22"
  timeSlot: string; // Ex.: "07:45 — 09:25"
  motivo: string;
  cursoDesc?: string;
  disciplinaId?: number | null;
  requisitosFiltro?: RequisitosFiltroAgendamento | null;
}

type AppContextType = {
  user: Usuario;
  setUser: React.Dispatch<React.SetStateAction<Usuario>>;
  rooms: Sala[];
  blocks: Bloco[];
  requests: Agendamento[];
  users: Usuario[];
  loginAs: (role?: TipoUsuario) => void;
  loginWithCredentials: (email: string, password?: string) => Usuario | null;
  registerUser: (data: RegisterUserData) => Usuario;
  getAvailableSlotsForRoom: (roomId: number | null, date: string) => string[];
  createBookingRequest: (data: CreateBookingData) => Agendamento | null;
  judgeBookingRequest: (
    id: number,
    newStatus: StatusAgendamento,
    justification?: string,
    proposedDate?: string,
    proposedTime?: string,
    proposedRoomId?: number | null
  ) => void;
  respondToProposal: (requestId: number, accept: boolean) => void;
  updateRoomComponents: (
    roomId: number,
    updatedCapacity: number,
    updatedEquipments: SalaEquipamento[],
    updatedSoftwares: SalaSoftware[],
    updatedDescritivo?: string
  ) => void;
  updateUserData: (
    userId: number,
    updatedFields: Partial<Usuario> & {
      cursoDesc?: string;
      semestre?: number;
      disciplinaIds?: number[];
    }
  ) => void;
  notify: (text: string) => void;
};

function parseSlotToIso(dateStr: string, timeSlot: string): { inicio: string; fim: string } {
  const parts = timeSlot.split("—").map((s) => s.trim());
  const startTime = parts[0] || "07:45";
  const endTime = parts[1] || "09:25";
  return {
    inicio: `${dateStr}T${startTime}:00.000Z`,
    fim: `${dateStr}T${endTime}:00.000Z`,
  };
}

export function checkRoomMatchesRequirements(
  room: Sala,
  reqCriteria?: RequisitosFiltroAgendamento | null
): { matches: boolean; missingReasons: string[] } {
  if (!reqCriteria) return { matches: true, missingReasons: [] };

  const missing: string[] = [];
  if (room.capacidade < reqCriteria.minCadeiras) {
    missing.push(`Capacidade (${room.capacidade} < ${reqCriteria.minCadeiras} lug.)`);
  }

  const eqDescs = room.equipamentos.map((e) =>
    e.equipamento.descritivo.toLowerCase()
  );

  if (reqCriteria.hasTvOrProjector) {
    if (!eqDescs.some((d) => d.includes("tv") || d.includes("projetor"))) {
      missing.push("Sem TV/Projetor");
    }
  }
  if (reqCriteria.hasAc) {
    if (!eqDescs.some((d) => d.includes("ar-condicionado"))) {
      missing.push("Sem Ar-condicionado");
    }
  }
  if (reqCriteria.hasComputers) {
    if (!eqDescs.some((d) => d.includes("computador"))) {
      missing.push("Sem Computadores");
    }
  }
  if (reqCriteria.software && reqCriteria.software.trim() !== "") {
    const swQuery = reqCriteria.software.trim().toLowerCase();
    const hasSw = room.softwares.some((s) =>
      s.software.descritivo.toLowerCase().includes(swQuery)
    );
    if (!hasSw) {
      missing.push(`Sem software ${reqCriteria.software}`);
    }
  }

  return { matches: missing.length === 0, missingReasons: missing };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario>(defaultAccounts.aluno);
  const [rooms, setRooms] = useState<Sala[]>(initialRooms);
  const [blocks] = useState<Bloco[]>(initialBlocks);
  const [requests, setRequests] = useState<Agendamento[]>(() =>
    generateDynamicMockRequests()
  );
  const [users, setUsers] = useState<Usuario[]>(initialUsers);
  const [toast, setToast] = useState("");

  const notify = (text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(""), 3400);
  };

  const loginAs = (tipoUsuario?: TipoUsuario) => {
    if (tipoUsuario === "GESTOR") {
      setUser(defaultAccounts.gestor);
    } else if (tipoUsuario === "PROFESSOR") {
      setUser(defaultAccounts.professor);
    } else {
      setUser(defaultAccounts.aluno);
    }
  };

  const loginWithCredentials = (email: string, password?: string): Usuario | null => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setUser(defaultAccounts.aluno);
      return defaultAccounts.aluno;
    }

    const found = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!found) {
      return null;
    }

    if (password && found.senha && found.senha !== password) {
      return null;
    }

    setUser(found);
    return found;
  };

  const registerUser = (data: RegisterUserData): Usuario => {
    const nextId = Math.max(0, ...users.map((u) => u.id)) + 1;
    const matchedCourse =
      systemCourses.find(
        (c) => c.descritivo.toLowerCase() === (data.cursoDesc ?? "DSM").toLowerCase()
      ) ?? systemCourses[0];

    const newUser: Usuario = {
      id: nextId,
      nome: data.nome.trim(),
      ra: data.ra.trim(),
      email: data.email.trim().toLowerCase(),
      senha: data.senha || "123456",
      emailValidado: true,
      tipoUsuario: data.tipoUsuario,
      aluno:
        data.tipoUsuario === "ALUNO"
          ? {
              id: nextId,
              usuarioId: nextId,
              cursoId: matchedCourse.id,
              semestre: data.semestre || 1,
              curso: matchedCourse,
              ativo: true,
            }
          : null,
      professor:
        data.tipoUsuario === "PROFESSOR"
          ? {
              id: nextId,
              usuarioId: nextId,
              disciplinas:
                data.disciplinaIds && data.disciplinaIds.length > 0
                  ? systemDisciplinas.filter((d) =>
                      data.disciplinaIds!.includes(d.id)
                    )
                  : [systemDisciplinas[0], systemDisciplinas[1]],
            }
          : null,
      gestor:
        data.tipoUsuario === "GESTOR"
          ? {
              id: nextId,
              usuarioId: nextId,
            }
          : null,
    };

    setUsers((prev) => [newUser, ...prev]);
    setUser(newUser);
    return newUser;
  };

  const getAvailableSlotsForRoom = (roomId: number | null, date: string): string[] => {
    const todayStr = getTodayLocalStr();
    if (date < todayStr) return [];

    if (roomId === null) {
      return OFFICIAL_TIME_SLOTS.filter((slot) => !isTimeSlotPast(date, slot));
    }

    const occupiedSlots = new Set(
      requests
        .filter(
          (req) =>
            req.salaId === roomId &&
            (req.status === "APROVADO" || req.status === "PENDENTE") &&
            String(req.dataInicio).slice(0, 10) === date
        )
        .map((req) => formatIntervaloHorario(req.dataInicio, req.dataFim))
    );

    return OFFICIAL_TIME_SLOTS.filter(
      (slot) => !occupiedSlots.has(slot) && !isTimeSlotPast(date, slot)
    );
  };

  const createBookingRequest = (data: CreateBookingData): Agendamento | null => {
    // Bloqueio de usuários inativos (Meta 4)
    if (!user.emailValidado || user.aluno?.ativo === false) {
      notify(
        "Sua conta está inativa. Contas inativadas não podem criar pedidos de agendamento."
      );
      return null;
    }

    // Bloqueio de datas e horários passados (Meta 6 e Meta 8)
    const todayStr = getTodayLocalStr();
    if (data.date < todayStr || isTimeSlotPast(data.date, data.timeSlot)) {
      notify(
        "Não é possível agendar em datas ou faixas horárias que já passaram."
      );
      return null;
    }

    // Validação de conflito de horário (APROVADO ou PENDENTE na mesma sala e data)
    if (data.salaId !== null) {
      const available = getAvailableSlotsForRoom(data.salaId, data.date);
      if (!available.includes(data.timeSlot)) {
        return null;
      }
    }

    const nextId = Math.max(0, ...requests.map((r) => r.id)) + 1;
    const { inicio, fim } = parseSlotToIso(data.date, data.timeSlot);
    const targetRoom =
      data.salaId !== null ? rooms.find((r) => r.id === data.salaId) ?? null : null;

    // RF 404: Agendamento direto pela secretaria/gestor já entra APROVADO
    const initialStatus: StatusAgendamento =
      user.tipoUsuario === "GESTOR" ? "APROVADO" : "PENDENTE";

    const matchedDisciplina: Disciplina | null =
      user.tipoUsuario === "PROFESSOR"
        ? (data.disciplinaId
            ? (user.professor?.disciplinas?.find(
                (d) => d.id === data.disciplinaId
              ) ??
              systemDisciplinas.find((d) => d.id === data.disciplinaId) ??
              null)
            : (user.professor?.disciplinas?.[0] ?? systemDisciplinas[0]))
        : null;

    const userCourse =
      matchedDisciplina?.curso ??
      user.aluno?.curso ??
      user.professor?.disciplinas?.[0]?.curso ??
      (data.cursoDesc
        ? systemCourses.find((c) => c.descritivo === data.cursoDesc) ?? {
            id: 1,
            descritivo: data.cursoDesc,
          }
        : { id: 1, descritivo: "DSM" });

    const newBooking: Agendamento = {
      id: nextId,
      solicitanteId: user.id,
      salaId: targetRoom ? targetRoom.id : null,
      cursoId: userCourse?.id ?? 1,
      disciplinaId: matchedDisciplina ? matchedDisciplina.id : null,
      dataInicio: inicio,
      dataFim: fim,
      motivo: data.motivo.trim() || "Atividade acadêmica",
      status: initialStatus,
      criadoEm: new Date().toISOString(),
      solicitante: user,
      sala: targetRoom,
      curso: userCourse,
      disciplina: matchedDisciplina,
      historico: [],
      requisitosFiltro: data.requisitosFiltro ?? null,
      semSalaOriginal: data.salaId === null,
    };

    setRequests((prev) => [newBooking, ...prev]);

    // Se já foi aprovado diretamente e possui sala, atualiza statusOcupacao
    if (initialStatus === "APROVADO" && targetRoom) {
      setRooms((prev) =>
        prev.map((r) =>
          r.id === targetRoom.id ? { ...r, statusOcupacao: "Ocupada" } : r
        )
      );
    }

    return newBooking;
  };

  const judgeBookingRequest = (
    id: number,
    newStatus: StatusAgendamento,
    justification?: string,
    proposedDate?: string,
    proposedTime?: string,
    proposedRoomId?: number | null
  ) => {
    let affectedRoomId: number | null = null;
    let effectiveFinalStatus: StatusAgendamento = newStatus;

    setRequests((prev) =>
      prev.map((req) => {
        if (req.id !== id) return req;

        const targetRoom =
          proposedRoomId !== undefined && proposedRoomId !== null
            ? rooms.find((r) => r.id === proposedRoomId) ?? req.sala
            : req.sala;

        // Meta 7 (Regra 2): Se era pedido sem sala e o Gestor escolheu uma sala FORA dos filtros do solicitante,
        // não aprovar direto -> colocar em EM_NEGOCIACAO para aceite/recusa do solicitante
        let isOutOfFilters = false;
        let finalStatus = newStatus;
        let finalJustification = justification ?? null;

        if (
          newStatus === "APROVADO" &&
          (req.salaId === null || req.semSalaOriginal) &&
          targetRoom &&
          req.requisitosFiltro
        ) {
          const check = checkRoomMatchesRequirements(
            targetRoom,
            req.requisitosFiltro
          );
          if (!check.matches) {
            isOutOfFilters = true;
            finalStatus = "EM_NEGOCIACAO";
            finalJustification = `Alocação sugerida em ${targetRoom.descritivo} (fora dos filtros originais: ${check.missingReasons.join(", ")}). Aguardando confirmação do solicitante.`;
          }
        }

        effectiveFinalStatus = finalStatus;
        affectedRoomId =
          finalStatus === "APROVADO"
            ? targetRoom?.id ?? req.salaId
            : null;

        const proposedIso =
          proposedDate && proposedTime
            ? parseSlotToIso(proposedDate, proposedTime)
            : null;

        const alteracao = {
          id: (req.historico?.length ?? 0) + 1,
          agendamentoId: req.id,
          autorId: user.id,
          statusAnterior: req.status,
          statusNovo: finalStatus,
          justificativa: finalJustification,
          salaPropostaId: targetRoom ? targetRoom.id : req.salaId,
          dataInicioProposta: proposedIso ? proposedIso.inicio : req.dataInicio,
          dataFimProposta: proposedIso ? proposedIso.fim : req.dataFim,
          criadoEm: new Date().toISOString(),
        };

        if (finalStatus === "EM_NEGOCIACAO") {
          return {
            ...req,
            status: "EM_NEGOCIACAO",
            salaProposta: targetRoom ?? req.sala,
            dataProposta: proposedDate ?? String(req.dataInicio).slice(0, 10),
            horarioProposto:
              proposedTime ?? formatIntervaloHorario(req.dataInicio, req.dataFim),
            foraDosFiltros: isOutOfFilters,
            recusadoPeloUsuario: false,
            motivoRecusaUsuario: null,
            historico: [...(req.historico ?? []), alteracao],
          };
        }

        return {
          ...req,
          status: finalStatus,
          salaId: targetRoom ? targetRoom.id : req.salaId,
          sala: targetRoom,
          salaProposta: null,
          dataProposta: null,
          horarioProposto: null,
          foraDosFiltros: false,
          recusadoPeloUsuario: false,
          motivoRecusaUsuario: null,
          historico: [...(req.historico ?? []), alteracao],
        };
      })
    );

    if (effectiveFinalStatus === "APROVADO" && affectedRoomId) {
      setRooms((prev) =>
        prev.map((r) =>
          r.id === affectedRoomId ? { ...r, statusOcupacao: "Ocupada" } : r
        )
      );
    }
  };

  const respondToProposal = (requestId: number, accept: boolean) => {
    let approvedRoomId: number | null = null;

    setRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;

        if (accept) {
          const finalRoom = req.salaProposta ?? req.sala ?? null;
          approvedRoomId = finalRoom ? finalRoom.id : req.salaId;
          const nextIso =
            req.dataProposta && req.horarioProposto
              ? parseSlotToIso(req.dataProposta, req.horarioProposto)
              : null;

          const alteracao = {
            id: (req.historico?.length ?? 0) + 1,
            agendamentoId: req.id,
            autorId: user.id,
            statusAnterior: req.status,
            statusNovo: "APROVADO" as StatusAgendamento,
            justificativa: "Proposta aceita pelo solicitante.",
            salaPropostaId: finalRoom?.id ?? req.salaId,
            criadoEm: new Date().toISOString(),
          };

          return {
            ...req,
            status: "APROVADO",
            salaId: finalRoom ? finalRoom.id : req.salaId,
            sala: finalRoom,
            dataInicio: nextIso ? nextIso.inicio : req.dataInicio,
            dataFim: nextIso ? nextIso.fim : req.dataFim,
            salaProposta: null,
            dataProposta: null,
            horarioProposto: null,
            foraDosFiltros: false,
            recusadoPeloUsuario: false,
            motivoRecusaUsuario: null,
            historico: [...(req.historico ?? []), alteracao],
          };
        } else {
          // Meta 7 (Regra 2 e 3): Se o usuário negar tanto uma sala fora dos filtros quanto um reagendamento,
          // retorna o pedido para a fila de PENDENTE do Gestor com aviso visual para refazer o julgamento
          const wasWithoutRoom = Boolean(req.semSalaOriginal || req.salaId === null);
          const refusalNote = req.foraDosFiltros
            ? `O solicitante recusou a alocação na sala ${req.salaProposta?.descritivo ?? "proposta"} (fora dos filtros exigidos).`
            : `O solicitante recusou a proposta de reagendamento (${req.salaProposta?.descritivo ?? req.sala?.descritivo ?? "Sala"} · ${req.dataProposta ?? ""} ${req.horarioProposto ?? ""}).`;

          const alteracao = {
            id: (req.historico?.length ?? 0) + 1,
            agendamentoId: req.id,
            autorId: user.id,
            statusAnterior: req.status,
            statusNovo: "PENDENTE" as StatusAgendamento,
            justificativa: `${refusalNote} Refazer julgamento.`,
            criadoEm: new Date().toISOString(),
          };

          return {
            ...req,
            status: "PENDENTE",
            salaId: wasWithoutRoom ? null : req.salaId,
            sala: wasWithoutRoom ? null : req.sala,
            salaProposta: null,
            dataProposta: null,
            horarioProposto: null,
            foraDosFiltros: false,
            recusadoPeloUsuario: true,
            motivoRecusaUsuario: refusalNote,
            historico: [...(req.historico ?? []), alteracao],
          };
        }
      })
    );

    if (accept && approvedRoomId) {
      setRooms((prev) =>
        prev.map((r) =>
          r.id === approvedRoomId ? { ...r, statusOcupacao: "Ocupada" } : r
        )
      );
    }
  };

  const updateRoomComponents = (
    roomId: number,
    updatedCapacity: number,
    updatedEquipments: SalaEquipamento[],
    updatedSoftwares: SalaSoftware[],
    updatedDescritivo?: string
  ) => {
    setRooms((prev) =>
      prev.map((room) => {
        if (room.id !== roomId) return room;
        return {
          ...room,
          descritivo: updatedDescritivo?.trim() || room.descritivo,
          capacidade: updatedCapacity,
          equipamentos: updatedEquipments,
          softwares: updatedSoftwares,
        };
      })
    );

    // Sincronizar referências de sala nos agendamentos existentes
    setRequests((prev) =>
      prev.map((req) => {
        if (req.salaId !== roomId || !req.sala) return req;
        return {
          ...req,
          sala: {
            ...req.sala,
            descritivo: updatedDescritivo?.trim() || req.sala.descritivo,
            capacidade: updatedCapacity,
            equipamentos: updatedEquipments,
            softwares: updatedSoftwares,
          },
        };
      })
    );
  };

  const updateUserData = (
    userId: number,
    updatedFields: Partial<Usuario> & {
      cursoDesc?: string;
      semestre?: number;
      disciplinaIds?: number[];
    }
  ) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;

        const nextTipo = updatedFields.tipoUsuario ?? u.tipoUsuario;
        const matchedCourse = updatedFields.cursoDesc
          ? systemCourses.find(
              (c) =>
                c.descritivo.toLowerCase() === updatedFields.cursoDesc!.toLowerCase()
            ) ?? { id: 1, descritivo: updatedFields.cursoDesc }
          : u.aluno?.curso ?? systemCourses[0];

        const nextDisciplinas = updatedFields.disciplinaIds
          ? systemDisciplinas.filter((d) =>
              updatedFields.disciplinaIds!.includes(d.id)
            )
          : u.professor?.disciplinas ?? [systemDisciplinas[0]];

        const updatedUser: Usuario = {
          ...u,
          ...updatedFields,
          tipoUsuario: nextTipo,
          aluno:
            nextTipo === "ALUNO"
              ? {
                  id: u.aluno?.id ?? u.id,
                  usuarioId: u.id,
                  cursoId: matchedCourse.id,
                  semestre: updatedFields.semestre ?? u.aluno?.semestre ?? 1,
                  curso: matchedCourse,
                  ativo: updatedFields.emailValidado ?? u.emailValidado,
                }
              : u.aluno,
          professor:
            nextTipo === "PROFESSOR"
              ? {
                  id: u.professor?.id ?? u.id,
                  usuarioId: u.id,
                  disciplinas:
                    nextDisciplinas.length > 0
                      ? nextDisciplinas
                      : [systemDisciplinas[0]],
                }
              : u.professor,
        };

        if (user.id === userId) {
          setUser(updatedUser);
        }

        return updatedUser;
      })
    );
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        rooms,
        blocks,
        requests,
        users,
        loginAs,
        loginWithCredentials,
        registerUser,
        getAvailableSlotsForRoom,
        createBookingRequest,
        judgeBookingRequest,
        respondToProposal,
        updateRoomComponents,
        updateUserData,
        notify,
      }}
    >
      {children}
      {toast && (
        <div className="toast" role="status">
          <span>
            <Icon name="check" size={17} />
          </span>
          {toast}
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp deve ser usado dentro de um AppProvider");
  }
  return context;
}
