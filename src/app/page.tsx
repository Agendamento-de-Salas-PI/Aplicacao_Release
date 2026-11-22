"use client";

import { useEffect, useMemo, useState } from "react";
import { type Sala } from "@/types";
import {
  formatIntervaloHorario,
  getTodayLocalStr,
  isTimeSlotPast,
  getFirstAvailableFutureSlot,
  systemDisciplinas,
} from "@/data/mockData";
import { Icon } from "@/components/Icon";
import { useApp } from "@/context/AppContext";
import FilterPanel, { type FilterState } from "@/components/FilterPanel";
import FloorPlan from "@/components/FloorPlan";
import { RoomGrid } from "@/components/RoomGrid";
import DetailModal from "@/components/DetailModal";

function getInitialFilters(): FilterState {
  const today = getTodayLocalStr();
  return {
    date: today,
    timeSlot: getFirstAvailableFutureSlot(today),
    seats: 20,
    hasTvOrProjector: false,
    hasAc: false,
    hasComputers: false,
    softwareQuery: "",
  };
}

export default function BookingPage() {
  const {
    user,
    rooms,
    blocks,
    requests,
    createBookingRequest,
    respondToProposal,
    notify,
  } = useApp();

  const [view, setView] = useState<"map" | "grid">("map");
  // Inicia no Bloco 1 · Térreo (id: 1)
  const [selectedBlockId, setSelectedBlockId] = useState<number>(1);
  const [selectedRoomId, setSelectedRoomId] = useState<number>(1);
  // Meta 10: Painel de detalhes inicia fechado tanto em desktop quanto em mobile
  const [showDetails, setShowDetails] = useState(false);
  const [filters, setFilters] = useState<FilterState>(getInitialFilters);

  // Modal de agendamento sem sala específica (RF 401)
  const [showNoRoomModal, setShowNoRoomModal] = useState(false);
  const [noRoomMotivo, setNoRoomMotivo] = useState("Monitoria / Estudo em grupo");
  const professorDisciplinas =
    user.professor?.disciplinas && user.professor.disciplinas.length > 0
      ? user.professor.disciplinas
      : systemDisciplinas;
  const [noRoomDisciplinaId, setNoRoomDisciplinaId] = useState<number>(
    () => professorDisciplinas[0]?.id ?? 1
  );
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const isUserInactive = !user.emailValidado || user.aluno?.ativo === false;

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.seats > 20) count++;
    if (filters.hasTvOrProjector) count++;
    if (filters.hasAc) count++;
    if (filters.hasComputers) count++;
    if (filters.softwareQuery.trim() !== "") count++;
    return count;
  }, [filters]);

  const activeBlock = useMemo(
    () => blocks.find((b) => b.id === selectedBlockId) ?? blocks[0],
    [blocks, selectedBlockId]
  );

  // Salas pertencentes ao bloco ativo, com statusOcupacao derivado dos agendamentos na data/horário filtrados
  const blockRooms = useMemo(() => {
    return rooms
      .filter((r) => r.blocoId === activeBlock.id)
      .map((room) => {
        const roomBookingsOnDate = requests.filter(
          (req) =>
            req.salaId === room.id &&
            String(req.dataInicio).slice(0, 10) === filters.date
        );

        const hasApprovedInSlot = roomBookingsOnDate.some(
          (req) =>
            req.status === "APROVADO" &&
            formatIntervaloHorario(req.dataInicio, req.dataFim) ===
              filters.timeSlot
        );

        const hasPendingInSlot = roomBookingsOnDate.some(
          (req) =>
            (req.status === "PENDENTE" || req.status === "EM_NEGOCIACAO") &&
            formatIntervaloHorario(req.dataInicio, req.dataFim) ===
              filters.timeSlot
        );

        const computedStatus = hasApprovedInSlot
          ? "Ocupada"
          : hasPendingInSlot
            ? "Em breve"
            : "Livre";

        return {
          ...room,
          statusOcupacao: computedStatus,
        } as Sala;
      });
  }, [rooms, activeBlock.id, requests, filters.date, filters.timeSlot]);

  // Filtragem real das salas do bloco (Meta 8: RF 301 e RF 302)
  const filteredBlockRooms = useMemo(() => {
    return blockRooms.filter((room) => {
      // 1. Verificar se não possui agendamento APROVADO ou PENDENTE conflitante na data/horário selecionados
      if (
        room.statusOcupacao === "Ocupada" ||
        room.statusOcupacao === "Em breve"
      ) {
        return false;
      }

      // 2. Número de cadeiras
      if (room.capacidade < filters.seats) {
        return false;
      }

      // 3. Componentes (TV/Projetor, Ar-condicionado, Computadores)
      const eqDescs = room.equipamentos.map((e) =>
        e.equipamento.descritivo.toLowerCase()
      );

      if (filters.hasTvOrProjector) {
        const matchesTvOrProj = eqDescs.some(
          (d) => d.includes("tv") || d.includes("projetor")
        );
        if (!matchesTvOrProj) return false;
      }

      if (filters.hasAc) {
        const matchesAc = eqDescs.some((d) => d.includes("ar-condicionado"));
        if (!matchesAc) return false;
      }

      if (filters.hasComputers) {
        const matchesComp = eqDescs.some((d) => d.includes("computador"));
        if (!matchesComp) return false;
      }

      // 4. Software (Busca textual)
      if (filters.softwareQuery.trim() !== "") {
        const query = filters.softwareQuery.trim().toLowerCase();
        const matchesSoftware = room.softwares.some((s) =>
          s.software.descritivo.toLowerCase().includes(query)
        );
        if (!matchesSoftware) return false;
      }

      return true;
    });
  }, [blockRooms, filters]);

  const matchedRoomIds = useMemo(
    () => new Set(filteredBlockRooms.map((r) => r.id)),
    [filteredBlockRooms]
  );

  const selectedRoom = useMemo(() => {
    return (
      blockRooms.find((r) => r.id === selectedRoomId) ??
      blockRooms[0] ??
      null
    );
  }, [blockRooms, selectedRoomId]);

  // Propostas de reagendamento pendentes para o usuário logado (RF 408 / RF 409)
  const myNegotiationRequests = useMemo(() => {
    return requests.filter(
      (req) =>
        req.solicitanteId === user.id && req.status === "EM_NEGOCIACAO"
    );
  }, [requests, user.id]);

  // Ao trocar de bloco, selecionar automaticamente a primeira sala do novo bloco
  const handleSelectBlock = (newBlockId: number) => {
    setSelectedBlockId(newBlockId);
    const firstRoomInBlock = rooms.find((r) => r.blocoId === newBlockId);
    if (firstRoomInBlock) {
      setSelectedRoomId(firstRoomInBlock.id);
    }
  };

  const handleUpdateFilters = (partial: Partial<FilterState>) => {
    setFilters((prev) => {
      const next = { ...prev, ...partial };
      const today = getTodayLocalStr();
      if (next.date < today) {
        next.date = today;
      }
      if (isTimeSlotPast(next.date, next.timeSlot)) {
        next.timeSlot = getFirstAvailableFutureSlot(next.date);
      }
      return next;
    });
  };

  const handleResetFilters = () => {
    setFilters(getInitialFilters());
    notify("Filtros restaurados para a data e horário atuais");
  };

  const buildFilterRequirementsSummary = () => {
    const reqs: string[] = [`Mín. ${filters.seats} cadeiras`];
    if (filters.hasTvOrProjector) reqs.push("TV/Projetor");
    if (filters.hasAc) reqs.push("Ar-condicionado");
    if (filters.hasComputers) reqs.push("Computadores");
    if (filters.softwareQuery.trim()) {
      reqs.push(`Software: ${filters.softwareQuery.trim()}`);
    }
    return reqs.join(", ");
  };

  const handleCreateWithoutRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (isUserInactive) {
      notify(
        "Sua conta está inativa. Contas inativadas não podem criar pedidos de agendamento."
      );
      return;
    }

    const filterSummary = buildFilterRequirementsSummary();
    const fullMotivo = `${noRoomMotivo.trim()} [Requisitos filtrados: ${filterSummary}]`;
    const eqList: string[] = [];
    if (filters.hasTvOrProjector) eqList.push("TV/Projetor");
    if (filters.hasAc) eqList.push("Ar-condicionado");
    if (filters.hasComputers) eqList.push("Computadores");

    const created = createBookingRequest({
      salaId: null,
      date: filters.date,
      timeSlot: filters.timeSlot,
      motivo: fullMotivo,
      disciplinaId:
        user.tipoUsuario === "PROFESSOR" ? noRoomDisciplinaId : null,
      requisitosFiltro: {
        minCadeiras: filters.seats,
        hasTvOrProjector: filters.hasTvOrProjector,
        hasAc: filters.hasAc,
        hasComputers: filters.hasComputers,
        equipamentos: eqList,
        software: filters.softwareQuery.trim() || undefined,
      },
    });
    if (!created) return;

    setShowNoRoomModal(false);
    notify(
      `Solicitação de horário (${filters.date} · ${filters.timeSlot}) com requisitos (${filterSummary}) enviada ao gestor!`
    );
  };

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT");

      if (!isTyping && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        document.getElementById("filters")?.focus();
      }
      if (e.key === "Escape") setShowDetails(false);
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, []);

  // Meta 10: Trava de scroll da página principal quando o modal/bottom-sheet de detalhes estiver aberto no mobile
  useEffect(() => {
    const applyScrollLock = () => {
      const isMobileViewport = window.innerWidth < 1024;
      if (showDetails && isMobileViewport) {
        document.body.style.overflow = "hidden";
        document.body.style.overscrollBehavior = "none";
        document.documentElement.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
        document.body.style.overscrollBehavior = "";
        document.documentElement.style.overflow = "";
      }
    };

    applyScrollLock();
    window.addEventListener("resize", applyScrollLock);
    return () => {
      window.removeEventListener("resize", applyScrollLock);
      document.body.style.overflow = "";
      document.body.style.overscrollBehavior = "";
      document.documentElement.style.overflow = "";
    };
  }, [showDetails]);

  return (
    <main
      className={`booking-layout ${showDetails && selectedRoom ? "" : "details-closed"}`}
    >
      <FilterPanel
        filters={filters}
        onChange={handleUpdateFilters}
        matchedCount={filteredBlockRooms.length}
        onReset={handleResetFilters}
        mobileOpen={mobileFiltersOpen}
        onCloseMobile={() => setMobileFiltersOpen(false)}
        onRequestWithoutRoom={() => {
          if (isUserInactive) {
            notify(
              "Conta inativa: usuários inativados não podem solicitar agendamentos."
            );
            return;
          }
          if (user.tipoUsuario === "PROFESSOR") {
            setNoRoomDisciplinaId(professorDisciplinas[0]?.id ?? 1);
          }
          setShowNoRoomModal(true);
        }}
      />

      <section className="map-area">
        {/* Barra compacta Mobile para expandir/recolher Filtros (Meta 10) */}
        <div className="mobile-filter-bar lg:hidden">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="mobile-filter-toggle"
          >
            <Icon name="sliders" size={16} />
            <span>
              Filtros {activeFiltersCount > 0 ? `(${activeFiltersCount} ativos)` : ""}
            </span>
            <span className="ml-auto rounded bg-[#b20d19] px-2 py-0.5 text-[10px] text-white">
              {filteredBlockRooms.length} salas
            </span>
          </button>
        </div>
        {/* Banner de Proposta de Reagendamento ou Alocação Fora dos Filtros (RF 408 / RF 409) */}
        {myNegotiationRequests.length > 0 && (
          <div className="border-b border-[#e5c78f] bg-[#fff7e9] px-6 py-3 text-xs text-[#694104]">
            {myNegotiationRequests.map((req) => {
              const targetRoomDesc =
                req.salaProposta?.descritivo ??
                req.sala?.descritivo ??
                "sua solicitação";
              const targetDate =
                req.dataProposta ?? String(req.dataInicio).slice(0, 10);
              const targetTime =
                req.horarioProposto ??
                formatIntervaloHorario(req.dataInicio, req.dataFim);

              return (
                <div
                  key={req.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-1"
                >
                  <div>
                    <strong className="text-[#885405]">
                      {req.foraDosFiltros
                        ? "Proposta de Sala Fora dos Filtros:"
                        : "Proposta de Reagendamento:"}
                    </strong>{" "}
                    O gestor sugeriu <strong>{targetRoomDesc}</strong> (
                    {targetDate} · {targetTime}).
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        respondToProposal(req.id, true);
                        notify(
                          `Proposta aceita! Seu agendamento foi confirmado em ${targetRoomDesc}.`
                        );
                      }}
                      className="rounded bg-[#167647] px-3 py-1 text-[11px] font-bold text-white hover:bg-[#115e38]"
                    >
                      Aceitar proposta
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        respondToProposal(req.id, false);
                        notify(
                          "Proposta recusada. Sua solicitação retornou ao gestor para novo julgamento."
                        );
                      }}
                      className="rounded border border-[#d6b682] bg-white px-3 py-1 text-[11px] font-bold text-[#885405] hover:bg-gray-50"
                    >
                      Rejeitar proposta
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="map-toolbar">
          <div>
            <span>MAPA INTERATIVO</span>
            <h1>{activeBlock.descritivo}</h1>
            <p className="mt-1">
              Selecione uma sala ({filteredBlockRooms.length}{" "}
              de {blockRooms.length} salas atendem aos filtros).
            </p>
          </div>

          <div className="toolbar-right flex flex-wrap items-end gap-4">
            {/* Abas rápidas de Blocos */}
            <div>
              <label>Blocos do Campus</label>
              <div className="segmented">
                {blocks.map((b) => (
                  <button
                    type="button"
                    key={b.id}
                    className={activeBlock.id === b.id ? "active" : ""}
                    onClick={() => handleSelectBlock(b.id)}
                  >
                    {b.descritivo.split("·")[0].trim()}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label>Visualização</label>
              <div className="segmented">
                <button
                  type="button"
                  className={view === "map" ? "active" : ""}
                  onClick={() => setView("map")}
                >
                  <Icon name="map" size={17} />
                  Mapa SVG
                </button>
                <button
                  type="button"
                  className={view === "grid" ? "active" : ""}
                  onClick={() => setView("grid")}
                >
                  <Icon name="grid" size={17} />
                  Grid de salas
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="map-stage">
          {view === "map" ? (
            <FloorPlan
              block={activeBlock}
              rooms={blockRooms}
              matchedRoomIds={matchedRoomIds}
              selected={selectedRoom}
              onSelect={(r) => {
                setSelectedRoomId(r.id);
                setShowDetails(true);
              }}
            />
          ) : (
            <RoomGrid
              rooms={filteredBlockRooms}
              selected={selectedRoom}
              onSelect={(r) => {
                setSelectedRoomId(r.id);
                setShowDetails(true);
              }}
              onResetFilters={handleResetFilters}
            />
          )}

          {!showDetails && selectedRoom && (
            <button
              type="button"
              className="open-details"
              onClick={() => setShowDetails(true)}
            >
              Ver {selectedRoom.descritivo}
              <Icon name="chevron" size={17} />
            </button>
          )}
        </div>
      </section>

      {showDetails && selectedRoom && (
        <>
          <div
            className="details-mobile-backdrop lg:hidden"
            onClick={() => setShowDetails(false)}
          />
          <DetailModal
            room={selectedRoom}
            selectedDate={filters.date}
            selectedTimeSlot={filters.timeSlot}
            onClose={() => setShowDetails(false)}
          />
        </>
      )}

      {/* Modal para Solicitar Horário Sem Sala Definida (RF 401) */}
      {showNoRoomModal && (
        <div
          className="modal-backdrop"
          onMouseDown={() => setShowNoRoomModal(false)}
        >
          <form
            className="action-modal"
            onMouseDown={(e) => e.stopPropagation()}
            onSubmit={handleCreateWithoutRoom}
          >
            <button
              type="button"
              className="modal-close"
              onClick={() => setShowNoRoomModal(false)}
              aria-label="Fechar modal"
            >
              <Icon name="close" />
            </button>
            <span>RF 401 · RESERVA FLEXÍVEL</span>
            <h2>Solicitar horário sem sala específica</h2>
            <p>
              O gestor alocará a melhor sala disponível para a sua atividade em{" "}
              <strong>{filters.date}</strong> ({filters.timeSlot}).
            </p>

            <div className="mt-3 rounded border border-[#e0e2e5] bg-[#f8f9fa] p-2.5 text-[11px] text-[#33383e]">
              <strong className="block text-[10px] uppercase tracking-wider text-[#b20d19]">
                Requisitos capturados dos filtros ativos:
              </strong>
              <span className="mt-0.5 block font-semibold">
                {buildFilterRequirementsSummary()}
              </span>
            </div>

            {user.tipoUsuario === "PROFESSOR" && (
              <div className="mt-3">
                <label className="field-label" htmlFor="noroom-disciplina">
                  Disciplina ministrada (Obrigatório · RF 401/403)
                </label>
                <select
                  id="noroom-disciplina"
                  required
                  value={noRoomDisciplinaId}
                  onChange={(e) =>
                    setNoRoomDisciplinaId(Number(e.target.value))
                  }
                  className="auth-input w-full"
                >
                  {professorDisciplinas.map((disc) => (
                    <option key={disc.id} value={disc.id}>
                      {disc.descritivo}
                      {disc.curso ? ` — ${disc.curso.descritivo}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <label className="field-label" htmlFor="noroom-motivo">
              Finalidade / Descrição da atividade
            </label>
            <textarea
              id="noroom-motivo"
              required
              value={noRoomMotivo}
              onChange={(e) => setNoRoomMotivo(e.target.value)}
              placeholder="Informe a necessidade (ex.: grupo de 15 alunos, precisa de projetor)..."
            />

            <div className="modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setShowNoRoomModal(false)}
              >
                Cancelar
              </button>
              <button type="submit" className="primary">
                Enviar solicitação
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
