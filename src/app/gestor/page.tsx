"use client";

import { useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  Search,
  MoreHorizontal,
  Sparkles,
  Check,
  X,
  Clock3,
  Users,
  ChevronRight,
  Building2,
  Sliders,
} from "lucide-react";
import {
  getInitials,
  formatDataCurta,
  formatIntervaloHorario,
  formatTipoUsuario,
  formatUsuarioDetalhe,
  formatEquipamentoItem,
  systemCourses,
  OFFICIAL_TIME_SLOTS,
  getTodayLocalStr,
  isTimeSlotPast,
  getFirstAvailableFutureSlot,
} from "@/data/mockData";
import {
  type Usuario,
  type Sala,
  type SalaEquipamento,
  type SalaSoftware,
  type TipoUsuario,
  type Agendamento,
} from "@/types";
import { useApp, checkRoomMatchesRequirements } from "@/context/AppContext";
import { Icon } from "@/components/Icon";

export default function ManagerScreen() {
  const {
    requests,
    users,
    rooms,
    blocks,
    judgeBookingRequest,
    updateRoomComponents,
    updateUserData,
    notify,
  } = useApp();

  // Navegação principal do painel: Solicitações vs. Gerenciar Blocos e Salas vs. Buscar Usuários
  const [section, setSection] = useState<"requests" | "rooms" | "users">("requests");

  // Estados da aba de Solicitações
  const [tab, setTab] = useState<"Pendentes" | "Aprovados" | "Rejeitados">("Pendentes");
  const [search, setSearch] = useState("");
  const [reasonFor, setReasonFor] = useState<number | null>(null);
  const [rescheduleFor, setRescheduleFor] = useState<number | null>(null);
  const [reasonText, setReasonText] = useState("");
  const [newDate, setNewDate] = useState<string>(() => getTodayLocalStr());
  const [newTime, setNewTime] = useState<string>(() =>
    getFirstAvailableFutureSlot(getTodayLocalStr())
  );
  const [proposedRoomId, setProposedRoomId] = useState<number | null>(null);

  // Modal de alocação de sala em Grid para pedidos sem sala definida (Meta 7)
  const [allocatingRequest, setAllocatingRequest] = useState<Agendamento | null>(null);
  const [allocatedRoomId, setAllocatedRoomId] = useState<number | null>(null);
  const [allocationBlockFilter, setAllocationBlockFilter] = useState<number | "ALL">("ALL");
  const [showAllAvailableInModal, setShowAllAvailableInModal] = useState(false);

  // Estados da aba de Gerenciar Blocos e Salas (Meta 3)
  const [selectedBlockFilter, setSelectedBlockFilter] = useState<number | "ALL">("ALL");
  const [editingRoom, setEditingRoom] = useState<Sala | null>(null);
  const [roomDescritivo, setRoomDescritivo] = useState("");
  const [roomCapacity, setRoomCapacity] = useState(30);
  const [roomHasTv, setRoomHasTv] = useState(false);
  const [roomHasProjector, setRoomHasProjector] = useState(false);
  const [roomHasAc, setRoomHasAc] = useState(false);
  const [roomComputers, setRoomComputers] = useState(0);
  const [roomSoftwares, setRoomSoftwares] = useState("");

  // Estados da aba de Buscar Usuários (RF 107)
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editUserName, setEditUserName] = useState("");
  const [editUserRa, setEditUserRa] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editUserRole, setEditUserRole] = useState<TipoUsuario>("ALUNO");
  const [editUserValidado, setEditUserValidado] = useState(true);
  const [editUserCurso, setEditUserCurso] = useState("DSM");
  const [editUserSemestre, setEditUserSemestre] = useState(1);

  // Filtragem de Solicitações a partir do estado global `requests`
  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.solicitante.nome.toLowerCase().includes(search.toLowerCase()) ||
      (req.sala?.descritivo ?? "Sem sala").toLowerCase().includes(search.toLowerCase()) ||
      (req.motivo ?? "").toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (tab === "Pendentes")
      return req.status === "PENDENTE" || req.status === "EM_NEGOCIACAO";
    if (tab === "Aprovados") return req.status === "APROVADO";
    if (tab === "Rejeitados")
      return req.status === "REJEITADO" || req.status === "CANCELADO";
    return true;
  });

  // Filtragem de Salas por Bloco
  const filteredRooms = rooms.filter((r) =>
    selectedBlockFilter === "ALL" ? true : r.blocoId === selectedBlockFilter
  );

  // Filtragem de Usuários (Nome, E-mail, RA ou Perfil) a partir do estado global `users`
  const filteredUsers = users.filter((u) =>
    `${u.nome} ${u.email} ${u.ra} ${u.tipoUsuario} ${formatUsuarioDetalhe(u)}`
      .toLowerCase()
      .includes(userSearch.toLowerCase())
  );

  const pendentesCount = requests.filter(
    (r) => r.status === "PENDENTE" || r.status === "EM_NEGOCIACAO"
  ).length;
  const aprovadosCount = requests.filter((r) => r.status === "APROVADO").length;
  const occupiedRoomsCount = rooms.filter(
    (r) => r.statusOcupacao === "Ocupada"
  ).length;

  const openRoomEditor = (room: Sala) => {
    setEditingRoom(room);
    setRoomDescritivo(room.descritivo);
    setRoomCapacity(room.capacidade);
    setRoomHasTv(
      room.equipamentos.some((e) =>
        e.equipamento.descritivo.toLowerCase().includes("tv")
      )
    );
    setRoomHasProjector(
      room.equipamentos.some((e) =>
        e.equipamento.descritivo.toLowerCase().includes("projetor")
      )
    );
    setRoomHasAc(
      room.equipamentos.some((e) =>
        e.equipamento.descritivo.toLowerCase().includes("ar-condicionado")
      )
    );
    const comp = room.equipamentos.find((e) =>
      e.equipamento.descritivo.toLowerCase().includes("computador")
    );
    setRoomComputers(comp ? comp.quantidade : 0);
    setRoomSoftwares(
      room.softwares.map((s) => s.software.descritivo).join(", ")
    );
  };

  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;

    const updatedEquipments: SalaEquipamento[] = [];
    let idx = 1;

    if (roomComputers > 0) {
      updatedEquipments.push({
        id: editingRoom.id * 100 + idx++,
        salaId: editingRoom.id,
        equipamentoId: 4,
        quantidade: roomComputers,
        equipamento: { id: 4, descritivo: "Computadores" },
      });
    }
    if (roomHasTv) {
      updatedEquipments.push({
        id: editingRoom.id * 100 + idx++,
        salaId: editingRoom.id,
        equipamentoId: 1,
        quantidade: 1,
        equipamento: { id: 1, descritivo: 'TV 55"' },
      });
    }
    if (roomHasProjector) {
      updatedEquipments.push({
        id: editingRoom.id * 100 + idx++,
        salaId: editingRoom.id,
        equipamentoId: 5,
        quantidade: 1,
        equipamento: { id: 5, descritivo: "Projetor" },
      });
    }
    if (roomHasAc) {
      updatedEquipments.push({
        id: editingRoom.id * 100 + idx++,
        salaId: editingRoom.id,
        equipamentoId: 2,
        quantidade: 1,
        equipamento: { id: 2, descritivo: "Ar-condicionado" },
      });
    }
    updatedEquipments.push({
      id: editingRoom.id * 100 + idx++,
      salaId: editingRoom.id,
      equipamentoId: 3,
      quantidade: roomCapacity,
      equipamento: { id: 3, descritivo: "Cadeiras" },
    });

    const swList = roomSoftwares
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const updatedSoftwares: SalaSoftware[] = swList.map((name, i) => ({
      salaId: editingRoom.id,
      softwareId: i + 1,
      software: { id: i + 1, descritivo: name },
    }));

    updateRoomComponents(
      editingRoom.id,
      roomCapacity,
      updatedEquipments,
      updatedSoftwares,
      roomDescritivo
    );
    notify(`Sala ${roomDescritivo} atualizada no AppContext!`);
    setEditingRoom(null);
  };

  const openUserModal = (person: Usuario) => {
    setSelectedUser(person);
    setIsEditingUser(false);
    setEditUserName(person.nome);
    setEditUserRa(person.ra);
    setEditUserEmail(person.email);
    setEditUserRole(person.tipoUsuario);
    setEditUserValidado(person.emailValidado);
    setEditUserCurso(person.aluno?.curso?.descritivo ?? "DSM");
    setEditUserSemestre(person.aluno?.semestre ?? 1);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    updateUserData(selectedUser.id, {
      nome: editUserName,
      ra: editUserRa,
      email: editUserEmail,
      tipoUsuario: editUserRole,
      emailValidado: editUserValidado,
      cursoDesc: editUserCurso,
      semestre: editUserSemestre,
    });

    notify(`Cadastro de ${editUserName} atualizado com sucesso!`);
    setSelectedUser(null);
    setIsEditingUser(false);
  };

  return (
    <main className="min-h-[calc(100vh-72px)] bg-[#f5f5f2] text-[#202124]">
      <div className="mx-auto max-w-[1440px] px-4 py-7 sm:px-6 lg:px-10 lg:py-10">
        {/* Cabeçalho do Painel */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#b20d19]">
              Painel administrativo
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              Gestão de Agendamentos e Espaços
            </h1>
            <p className="mt-2 max-w-xl text-sm text-[#666a6e]">
              Analise solicitações, edite a infraestrutura dos blocos/salas e gerencie usuários.
            </p>
          </div>
          <button
            type="button"
            onClick={() => notify("Período ativo: Maio de 2026")}
            className="inline-flex items-center gap-2 self-start rounded border border-[#d4d7da] bg-white px-3.5 py-2 text-xs font-bold text-[#4c5158] hover:bg-gray-50"
          >
            <CalendarDays size={16} /> Maio de 2026 <ChevronDown size={15} />
          </button>
        </div>

        {/* Cards de Estatísticas Reativas */}
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            [
              String(pendentesCount).padStart(2, "0"),
              "Aguardando análise",
              "bg-[#fff0f0] text-[#9b0000]",
            ],
            [
              String(aprovadosCount).padStart(2, "0"),
              "Agendamentos aprovados",
              "bg-[#eaf5ee] text-[#1c6b3d]",
            ],
            [
              String(occupiedRoomsCount).padStart(2, "0"),
              `Salas ocupadas (de ${rooms.length})`,
              "bg-[#eeeeeb] text-[#41454a]",
            ],
          ].map(([num, text, cls]) => (
            <div key={text} className="border border-[#dedfdf] bg-white p-5">
              <div
                className={`mb-4 grid h-8 w-8 place-items-center text-xs font-black ${cls}`}
              >
                {num}
              </div>
              <p className="text-sm font-bold text-[#3e4246]">{text}</p>
            </div>
          ))}
        </div>

        {/* Abas Superiores: Solicitações vs. Gerenciar Blocos e Salas vs. Buscar Usuários */}
        <div
          className="mt-6 flex flex-wrap gap-2 border-b border-[#d9dcdf]"
          role="tablist"
          aria-label="Áreas do painel do gestor"
        >
          <button
            type="button"
            onClick={() => setSection("requests")}
            className={`inline-flex min-h-[42px] items-center gap-2 border-b-2 px-4 text-xs font-extrabold transition ${
              section === "requests"
                ? "border-[#b20d19] text-[#b20d19]"
                : "border-transparent text-[#666b72] hover:text-[#202124]"
            }`}
          >
            <CalendarDays size={16} />
            Solicitações
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] ${
                section === "requests"
                  ? "bg-[#f6e6e7] text-[#b20d19]"
                  : "bg-[#e7e9eb] text-[#565b62]"
              }`}
            >
              {pendentesCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSection("rooms")}
            className={`inline-flex min-h-[42px] items-center gap-2 border-b-2 px-4 text-xs font-extrabold transition ${
              section === "rooms"
                ? "border-[#b20d19] text-[#b20d19]"
                : "border-transparent text-[#666b72] hover:text-[#202124]"
            }`}
          >
            <Building2 size={16} />
            Gerenciar Blocos e Salas
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] ${
                section === "rooms"
                  ? "bg-[#f6e6e7] text-[#b20d19]"
                  : "bg-[#e7e9eb] text-[#565b62]"
              }`}
            >
              {rooms.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSection("users")}
            className={`inline-flex min-h-[42px] items-center gap-2 border-b-2 px-4 text-xs font-extrabold transition ${
              section === "users"
                ? "border-[#b20d19] text-[#b20d19]"
                : "border-transparent text-[#666b72] hover:text-[#202124]"
            }`}
          >
            <Users size={16} />
            Buscar usuários
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] ${
                section === "users"
                  ? "bg-[#f6e6e7] text-[#b20d19]"
                  : "bg-[#e7e9eb] text-[#565b62]"
              }`}
            >
              {users.length}
            </span>
          </button>
        </div>

        {/* SEÇÃO 1: SOLICITAÇÕES DE AGENDAMENTO */}
        {section === "requests" && (
          <section className="mt-4 border border-[#dedfdf] bg-white">
            <div className="flex flex-col gap-4 border-b border-[#dedfdf] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="flex gap-1 overflow-x-auto">
                {(["Pendentes", "Aprovados", "Rejeitados"] as const).map(
                  (item) => (
                    <button
                      type="button"
                      key={item}
                      onClick={() => setTab(item)}
                      className={`px-4 py-2 text-xs font-extrabold transition ${
                        tab === item
                          ? "bg-[#26292d] text-white"
                          : "text-[#666a6e] hover:bg-[#f2f2ef]"
                      }`}
                    >
                      {item}
                      {item === "Pendentes" && (
                        <span className="ml-2 bg-[#b20000] px-1.5 py-0.5 text-[10px] text-white">
                          {pendentesCount}
                        </span>
                      )}
                      {item === "Aprovados" && (
                        <span className="ml-2 bg-[#1c6b3d] px-1.5 py-0.5 text-[10px] text-white">
                          {aprovadosCount}
                        </span>
                      )}
                    </button>
                  )
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777b80]"
                  />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-9 w-56 border border-[#d4d6d8] pl-9 pr-3 text-xs outline-none focus:border-[#b20000]"
                    placeholder="Buscar solicitante, sala ou motivo..."
                  />
                </div>
                <button
                  type="button"
                  aria-label="Mais opções"
                  onClick={() => notify("Lista sincronizada com o AppContext")}
                  className="grid h-9 w-9 place-items-center border border-[#d4d6d8] bg-white text-[#555b64] hover:bg-gray-50"
                >
                  <MoreHorizontal size={18} />
                </button>
              </div>
            </div>

            <div className="hidden grid-cols-[minmax(220px,1.5fr)_minmax(145px,1fr)_minmax(120px,.8fr)_minmax(130px,.8fr)_300px] border-b border-[#dedfdf] bg-[#f7f7f4] px-5 py-3 text-[10px] font-extrabold uppercase tracking-[0.09em] text-[#74787c] lg:grid">
              <span>Solicitante</span>
              <span>Data e horário</span>
              <span>Sala</span>
              <span>Finalidade</span>
              <span className="text-right">Ações / Status</span>
            </div>

            <div>
              {filteredRequests.map((request) => {
                const lastHistory =
                  request.historico && request.historico.length > 0
                    ? request.historico[request.historico.length - 1]
                    : null;

                return (
                  <div
                    key={request.id}
                    className="border-b border-[#e6e7e7] p-4 last:border-b-0 sm:p-5"
                  >
                    <div className="grid items-center gap-4 lg:grid-cols-[minmax(220px,1.5fr)_minmax(145px,1fr)_minmax(120px,.8fr)_minmax(130px,.8fr)_300px]">
                      <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#eee0e0] text-xs font-black text-[#8d0000]">
                          {getInitials(request.solicitante.nome)}
                        </span>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <strong className="text-sm">
                              {request.solicitante.nome}
                            </strong>
                            {request.solicitante.tipoUsuario === "PROFESSOR" && (
                              <span
                                title="Prioridade Docente (RF 403)"
                                className="inline-flex items-center gap-1 rounded bg-[#fff0f0] px-1.5 py-0.5 text-[10px] font-bold text-[#b20000]"
                              >
                                <Sparkles size={11} /> Prioridade Docente
                              </span>
                            )}
                            {request.recusadoPeloUsuario && (
                              <span className="inline-flex items-center gap-1 rounded border border-[#e1b6b9] bg-[#fff0f0] px-2 py-0.5 text-[10px] font-extrabold text-[#9b0000]">
                                Negado pelo usuário — refazer julgamento
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-[#71757a]">
                            {formatTipoUsuario(request.solicitante.tipoUsuario)}
                            {request.curso
                              ? ` · ${request.curso.descritivo}`
                              : ""}
                          </span>
                        </div>
                      </div>

                      <div>
                        <strong className="block text-xs">
                          {formatDataCurta(request.dataInicio)}
                        </strong>
                        <span className="mt-1 block text-xs text-[#6d7175]">
                          {formatIntervaloHorario(
                            request.dataInicio,
                            request.dataFim
                          )}
                        </span>
                      </div>

                      <div>
                        <span className="inline-flex bg-[#eeeeeb] px-2.5 py-1.5 text-xs font-extrabold">
                          {request.sala?.descritivo ?? "Sem sala (RF 401)"}
                        </span>
                        {request.status === "EM_NEGOCIACAO" && request.salaProposta && (
                          <span className="mt-1 block text-[10px] font-bold text-[#885405]">
                            Proposta: {request.salaProposta.descritivo}
                            {request.foraDosFiltros ? " (Fora dos filtros)" : ""}
                          </span>
                        )}
                      </div>

                      <div>
                        <p className="text-xs leading-relaxed text-[#5e6266]">
                          {request.motivo ?? "Atividade acadêmica"}
                        </p>
                        {lastHistory?.justificativa && (
                          <small className="mt-1 block text-[10px] italic text-[#8a8f96]">
                            Obs.: {lastHistory.justificativa}
                          </small>
                        )}
                      </div>

                      <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                        {request.status === "APROVADO" ? (
                          <span className="flex items-center gap-1.5 bg-[#e7f4ec] px-3 py-2 text-xs font-bold text-[#176a3a]">
                            <Check size={14} />
                            Aprovado
                          </span>
                        ) : request.status === "REJEITADO" ||
                          request.status === "CANCELADO" ? (
                          <span className="flex items-center gap-1.5 bg-[#fff0f0] px-3 py-2 text-xs font-bold text-[#9b0000]">
                            <X size={14} />
                            {request.status === "REJEITADO"
                              ? "Rejeitado"
                              : "Cancelado"}
                          </span>
                        ) : (
                          <>
                            {request.status === "EM_NEGOCIACAO" && (
                              <span className="flex items-center gap-1 bg-[#fff7e9] px-2.5 py-1.5 text-[11px] font-bold text-[#885405]">
                                <Clock3 size={13} /> Em negociação
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                if (request.salaId === null || !request.sala) {
                                  setAllocatingRequest(request);
                                  setAllocationBlockFilter("ALL");
                                  setAllocatedRoomId(null);
                                  setShowAllAvailableInModal(false);
                                  return;
                                }
                                judgeBookingRequest(
                                  request.id,
                                  "APROVADO",
                                  "Aprovado pelo gestor"
                                );
                                notify(
                                  `Agendamento de ${request.solicitante.nome} aprovado!`
                                );
                              }}
                              className="inline-flex items-center gap-1.5 border border-[#9dcbb3] bg-white px-3 py-1.5 text-xs font-bold text-[#14623d] hover:bg-[#eaf6ef]"
                            >
                              <Check size={15} />{" "}
                              {request.salaId === null ? "Alocar e Aprovar" : "Aprovar"}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setRescheduleFor(null);
                                setReasonFor(
                                  reasonFor === request.id ? null : request.id
                                );
                              }}
                              className="inline-flex items-center gap-1.5 border border-[#e1b6b9] bg-white px-3 py-1.5 text-xs font-bold text-[#9e101a] hover:bg-[#fff0f0]"
                            >
                              <X size={15} /> Rejeitar
                            </button>

                            <button
                              type="button"
                              title="Propor novo horário ou sala (RF 407)"
                              onClick={() => {
                                setReasonFor(null);
                                setProposedRoomId(request.salaId ?? rooms[0]?.id ?? null);
                                setRescheduleFor(
                                  rescheduleFor === request.id
                                    ? null
                                    : request.id
                                );
                              }}
                              className="inline-flex items-center justify-center border border-[#d9dcdf] bg-white px-2.5 py-1.5 text-[#656a71] hover:bg-gray-100"
                            >
                              <Clock3 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Justificativa de Rejeição Inline (RF 406) */}
                    {reasonFor === request.id && (
                      <div className="mt-4 flex flex-col gap-2 border-l-2 border-[#b20000] bg-[#fff7f7] p-3 sm:ml-12 sm:flex-row">
                        <input
                          autoFocus
                          value={reasonText}
                          onChange={(e) => setReasonText(e.target.value)}
                          className="min-w-0 flex-1 border border-[#d6c9c9] bg-white px-3 py-2 text-xs outline-none focus:border-[#b20000]"
                          placeholder="Informe a justificativa da rejeição..."
                        />
                        <button
                          type="button"
                          onClick={() => {
                            judgeBookingRequest(
                              request.id,
                              "REJEITADO",
                              reasonText.trim() ||
                                "Incompatibilidade de horário/espaço"
                            );
                            setReasonFor(null);
                            setReasonText("");
                            notify(
                              `Solicitação de ${request.solicitante.nome} rejeitada.`
                            );
                          }}
                          className="bg-[#b20d19] px-4 py-2 text-xs font-bold text-white hover:bg-[#870a13]"
                        >
                          Confirmar rejeição
                        </button>
                      </div>
                    )}

                    {/* Proposta de Novo Horário/Sala Inline (RF 407) */}
                    {rescheduleFor === request.id && (
                      <div className="mt-4 flex flex-col gap-2 border-l-2 border-[#c87a0b] bg-[#fff7e9] p-3 sm:ml-12 sm:flex-row sm:flex-wrap sm:items-center">
                        <span className="text-xs font-bold text-[#885405]">
                          Propor alternativa:
                        </span>
                        <select
                          value={proposedRoomId ?? ""}
                          onChange={(e) =>
                            setProposedRoomId(
                              e.target.value ? Number(e.target.value) : null
                            )
                          }
                          className="border border-[#d6c9c9] bg-white px-3 py-1.5 text-xs"
                        >
                          {rooms.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.descritivo} ({r.bloco.descritivo})
                            </option>
                          ))}
                        </select>
                        <input
                          type="date"
                          min={getTodayLocalStr()}
                          value={newDate}
                          onChange={(e) => {
                            const chosen = e.target.value;
                            setNewDate(chosen);
                            if (isTimeSlotPast(chosen, newTime)) {
                              setNewTime(getFirstAvailableFutureSlot(chosen));
                            }
                          }}
                          className="border border-[#d6c9c9] bg-white px-3 py-1.5 text-xs"
                        />
                        <select
                          value={newTime}
                          onChange={(e) => setNewTime(e.target.value)}
                          className="border border-[#d6c9c9] bg-white px-3 py-1.5 text-xs"
                        >
                          {OFFICIAL_TIME_SLOTS.map((slot) => {
                            const isPast = isTimeSlotPast(newDate, slot);
                            return (
                              <option key={slot} value={slot} disabled={isPast}>
                                {slot} {isPast ? "(Horário encerrado)" : ""}
                              </option>
                            );
                          })}
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            judgeBookingRequest(
                              request.id,
                              "EM_NEGOCIACAO",
                              `Proposta de reagendamento para ${newDate} (${newTime})`,
                              newDate,
                              newTime,
                              proposedRoomId
                            );
                            setRescheduleFor(null);
                            notify(
                              `Nova proposta (${newDate} · ${newTime}) enviada para ${request.solicitante.nome}`
                            );
                          }}
                          className="bg-[#b20d19] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#870a13]"
                        >
                          Enviar proposta
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredRequests.length === 0 && (
                <div className="p-12 text-center text-xs text-[#666a6e]">
                  Nenhuma solicitação encontrada na aba <strong>{tab}</strong>.
                </div>
              )}
            </div>
          </section>
        )}

        {/* SEÇÃO 2: GERENCIAR BLOCOS E SALAS (META 3) */}
        {section === "rooms" && (
          <section className="mt-4 border border-[#dedfdf] bg-white">
            <div className="flex flex-col gap-4 border-b border-[#dedfdf] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-extrabold text-[#202124]">
                  Infraestrutura de Blocos e Salas
                </h2>
                <p className="text-xs text-[#666a6e]">
                  Clique em qualquer sala para editar sua capacidade, equipamentos e softwares.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedBlockFilter("ALL")}
                  className={`px-3 py-1.5 text-xs font-extrabold transition ${
                    selectedBlockFilter === "ALL"
                      ? "bg-[#26292d] text-white"
                      : "bg-[#f2f2ef] text-[#666a6e] hover:bg-[#e5e5e0]"
                  }`}
                >
                  Todos os blocos ({rooms.length})
                </button>
                {blocks.map((b) => (
                  <button
                    type="button"
                    key={b.id}
                    onClick={() => setSelectedBlockFilter(b.id)}
                    className={`px-3 py-1.5 text-xs font-extrabold transition ${
                      selectedBlockFilter === b.id
                        ? "bg-[#b20d19] text-white"
                        : "bg-[#f2f2ef] text-[#666a6e] hover:bg-[#e5e5e0]"
                    }`}
                  >
                    {b.descritivo}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredRooms.map((room) => (
                <div
                  key={room.id}
                  className="flex flex-col justify-between border border-[#dfe1e4] bg-[#fafafb] p-4 transition hover:border-[#b20d19]"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#b20d19]">
                          {room.bloco.descritivo} · SVG: {room.codigoSvg}
                        </span>
                        <h3 className="mt-0.5 text-base font-black text-[#202124]">
                          {room.descritivo}
                        </h3>
                      </div>
                      <span className="rounded bg-[#eeeeeb] px-2 py-1 text-[10px] font-extrabold text-[#3e4246]">
                        {room.capacidade} lugares
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {room.equipamentos.map((eq) => (
                        <span
                          key={eq.id}
                          className="rounded border border-[#d8dadd] bg-white px-2 py-0.5 text-[10px] font-semibold text-[#4d5259]"
                        >
                          {formatEquipamentoItem(eq)}
                        </span>
                      ))}
                    </div>

                    {room.softwares.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {room.softwares.map((sw) => (
                          <span
                            key={sw.softwareId}
                            className="rounded bg-[#e8edf5] px-2 py-0.5 text-[9px] font-bold text-[#315681]"
                          >
                            {sw.software.descritivo}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => openRoomEditor(room)}
                    className="mt-4 inline-flex w-full items-center justify-center gap-1.5 border border-[#b20d19] bg-white py-2 text-xs font-bold text-[#b20d19] transition hover:bg-[#b20d19] hover:text-white"
                  >
                    <Sliders size={14} /> Editar componentes e capacidade
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SEÇÃO 3: BUSCAR USUÁRIOS (RF 107) */}
        {section === "users" && (
          <section className="mt-4 overflow-hidden border border-[#dedfdf] bg-white">
            {/* Hero de Busca de Usuários */}
            <div className="grid items-center gap-6 bg-[#282b30] p-6 text-white lg:grid-cols-[1fr_minmax(320px,42%)]">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#f08a91]">
                  Gestão de usuários
                </span>
                <h2 className="mt-1 text-xl font-bold tracking-tight">
                  Encontre alunos, professores e gestores
                </h2>
                <p className="mt-1 text-xs text-[#bfc2c6]">
                  Pesquise por nome, e-mail institucional, curso ou RA.
                </p>
              </div>

              <div className="flex h-11 items-center gap-2 rounded border border-white/15 bg-white px-3 text-[#70757c]">
                <Search size={18} />
                <input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Buscar nome, e-mail ou RA..."
                  className="h-full w-full border-0 bg-transparent text-xs text-[#25292d] outline-none"
                  autoFocus
                />
                {userSearch && (
                  <button
                    type="button"
                    onClick={() => setUserSearch("")}
                    aria-label="Limpar busca"
                    className="p-1 text-[#747980] hover:text-[#202124]"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Resumo da listagem */}
            <div className="flex min-h-[52px] items-center justify-between border-b border-[#e4e6e8] px-6 text-xs text-[#71767d]">
              <div>
                <strong className="mr-1.5 text-sm text-[#25292d]">
                  {filteredUsers.length}
                </strong>
                <span>
                  {filteredUsers.length === 1
                    ? "usuário encontrado"
                    : "usuários encontrados"}
                </span>
              </div>
              <div className="hidden items-center gap-4 sm:flex">
                <span className="flex items-center gap-1.5">
                  <i className="inline-block h-2 w-2 rounded-full bg-[#486aa5]" />
                  Alunos
                </span>
                <span className="flex items-center gap-1.5">
                  <i className="inline-block h-2 w-2 rounded-full bg-[#b20d19]" />
                  Professores / Gestores
                </span>
              </div>
            </div>

            {/* Lista de Usuários */}
            <div className="divide-y divide-[#e9eaec]">
              {filteredUsers.map((person) => {
                const isStaff =
                  person.tipoUsuario === "PROFESSOR" ||
                  person.tipoUsuario === "GESTOR";
                const statusConta = person.emailValidado ? "Ativo" : "Inativo";

                return (
                  <button
                    type="button"
                    key={person.id}
                    onClick={() => openUserModal(person)}
                    className="grid w-full grid-cols-[40px_1fr_20px] items-center gap-4 bg-white px-6 py-3.5 text-left transition hover:bg-[#fafafb] sm:grid-cols-[40px_minmax(190px,1.4fr)_minmax(160px,1fr)_90px_20px]"
                  >
                    <span
                      className={`grid h-9 w-9 place-items-center rounded-full text-xs font-extrabold ${
                        isStaff
                          ? "bg-[#f7e7e8] text-[#b20d19]"
                          : "bg-[#e8edf5] text-[#315681]"
                      }`}
                    >
                      {getInitials(person.nome)}
                    </span>

                    <div>
                      <strong className="block text-xs text-[#25292d]">
                        {person.nome}
                      </strong>
                      <small className="mt-0.5 block text-[11px] text-[#7c8188]">
                        {person.email}
                      </small>
                    </div>

                    <div className="hidden sm:block">
                      <strong className="block text-xs text-[#25292d]">
                        {formatTipoUsuario(person.tipoUsuario)}
                      </strong>
                      <small className="mt-0.5 block text-[11px] text-[#7c8188]">
                        {formatUsuarioDetalhe(person)}
                      </small>
                    </div>

                    <span
                      className={`hidden items-center gap-1.5 text-xs font-bold sm:inline-flex ${
                        person.emailValidado
                          ? "text-[#176541]"
                          : "text-[#747980]"
                      }`}
                    >
                      <i
                        className={`inline-block h-1.5 w-1.5 rounded-full ${
                          person.emailValidado
                            ? "bg-[#218052]"
                            : "bg-[#8a8f95]"
                        }`}
                      />
                      {statusConta}
                    </span>

                    <ChevronRight size={16} className="text-[#7c8188]" />
                  </button>
                );
              })}

              {filteredUsers.length === 0 && (
                <div className="p-12 text-center text-xs text-[#666a6e]">
                  Nenhum usuário encontrado para <strong>{userSearch}</strong>.
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {/* Modal de Alocação de Sala em Grid para Solicitações Sem Sala Definida (Meta 7) */}
      {allocatingRequest && (() => {
        const reqDate = String(allocatingRequest.dataInicio).slice(0, 10);
        const reqSlot = formatIntervaloHorario(
          allocatingRequest.dataInicio,
          allocatingRequest.dataFim
        );

        const reqCriteria = allocatingRequest.requisitosFiltro;

        const availableRoomsForAllocation = rooms.filter((r) => {
          if (allocationBlockFilter !== "ALL" && r.blocoId !== allocationBlockFilter) {
            return false;
          }
          const hasConflict = requests.some(
            (other) =>
              other.id !== allocatingRequest.id &&
              other.salaId === r.id &&
              (other.status === "APROVADO" || other.status === "PENDENTE") &&
              String(other.dataInicio).slice(0, 10) === reqDate &&
              formatIntervaloHorario(other.dataInicio, other.dataFim) === reqSlot
          );
          if (hasConflict) return false;

          // Se não estiver com o toggle "Mostrar todas as salas disponíveis" ativo, aplica os requisitos do solicitante
          if (!showAllAvailableInModal && reqCriteria) {
            if (r.capacidade < reqCriteria.minCadeiras) return false;

            const eqDescs = r.equipamentos.map((e) =>
              e.equipamento.descritivo.toLowerCase()
            );

            if (reqCriteria.hasTvOrProjector) {
              if (!eqDescs.some((d) => d.includes("tv") || d.includes("projetor"))) {
                return false;
              }
            }
            if (reqCriteria.hasAc) {
              if (!eqDescs.some((d) => d.includes("ar-condicionado"))) {
                return false;
              }
            }
            if (reqCriteria.hasComputers) {
              if (!eqDescs.some((d) => d.includes("computador"))) {
                return false;
              }
            }
            if (reqCriteria.software && reqCriteria.software.trim() !== "") {
              const swQuery = reqCriteria.software.trim().toLowerCase();
              const hasSw = r.softwares.some((s) =>
                s.software.descritivo.toLowerCase().includes(swQuery)
              );
              if (!hasSw) return false;
            }
          }

          return true;
        });

        const selectedRoomObj =
          availableRoomsForAllocation.find((r) => r.id === allocatedRoomId) ??
          availableRoomsForAllocation[0] ??
          null;

        const selectedRoomCheck = selectedRoomObj
          ? checkRoomMatchesRequirements(selectedRoomObj, reqCriteria)
          : { matches: true, missingReasons: [] };

        return (
          <div
            className="fixed inset-0 z-50 grid place-items-center bg-[#13161a]/60 p-4"
            onMouseDown={() => setAllocatingRequest(null)}
          >
            <div
              className="relative flex max-h-[88vh] w-full max-w-[780px] flex-col overflow-hidden rounded-lg bg-white shadow-2xl"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="border-b border-[#e4e6e8] p-6">
                <button
                  type="button"
                  onClick={() => setAllocatingRequest(null)}
                  aria-label="Fechar modal"
                  className="absolute right-5 top-5 p-1 text-[#686d74] hover:text-[#202124]"
                >
                  <X size={18} />
                </button>
                <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#b20d19]">
                  ALOCAÇÃO DE SALA · RF 401 / RF 405
                </span>
                <h2 className="mt-1 text-xl font-bold text-[#202124]">
                  Selecione uma sala disponível para aprovar
                </h2>
                <p className="mt-1 text-xs text-[#666a6e]">
                  Solicitante: <strong>{allocatingRequest.solicitante.nome}</strong> · Data:{" "}
                  <strong>{formatDataCurta(allocatingRequest.dataInicio)}</strong> ({reqSlot})
                </p>
                {allocatingRequest.motivo && (
                  <div className="mt-2.5 rounded border border-[#e5c78f] bg-[#fff7e9] px-3 py-2 text-xs text-[#694104]">
                    <strong>Requisitos / Finalidade solicitada:</strong>{" "}
                    {allocatingRequest.motivo}
                  </div>
                )}

                {reqCriteria && (
                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded border border-[#d8dadd] bg-[#f8f9fa] px-3 py-2 text-xs">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-[#202124]">
                        Filtro de componentes exigidos:
                      </span>
                      <span className="rounded bg-[#fff0f0] px-2 py-0.5 text-[10px] font-bold text-[#b20d19]">
                        Mín. {reqCriteria.minCadeiras} cadeiras
                      </span>
                      {reqCriteria.equipamentos.map((eq) => (
                        <span
                          key={eq}
                          className="rounded bg-[#fff0f0] px-2 py-0.5 text-[10px] font-bold text-[#b20d19]"
                        >
                          {eq}
                        </span>
                      ))}
                      {reqCriteria.software && (
                        <span className="rounded bg-[#e8edf5] px-2 py-0.5 text-[10px] font-bold text-[#315681]">
                          Software: {reqCriteria.software}
                        </span>
                      )}
                    </div>
                    <label className="flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold text-[#4c5158]">
                      <input
                        type="checkbox"
                        checked={showAllAvailableInModal}
                        onChange={(e) => setShowAllAvailableInModal(e.target.checked)}
                      />
                      Mostrar todas as salas disponíveis
                    </label>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAllocationBlockFilter("ALL")}
                    className={`rounded px-3 py-1 text-xs font-extrabold transition ${
                      allocationBlockFilter === "ALL"
                        ? "bg-[#26292d] text-white"
                        : "bg-[#f2f2ef] text-[#666a6e]"
                    }`}
                  >
                    Todos os blocos
                  </button>
                  {blocks.map((b) => (
                    <button
                      type="button"
                      key={b.id}
                      onClick={() => setAllocationBlockFilter(b.id)}
                      className={`rounded px-3 py-1 text-xs font-extrabold transition ${
                        allocationBlockFilter === b.id
                          ? "bg-[#b20d19] text-white"
                          : "bg-[#f2f2ef] text-[#666a6e]"
                      }`}
                    >
                      {b.descritivo}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-y-auto bg-[#eef0f2]">
                {availableRoomsForAllocation.length === 0 ? (
                  <div className="p-10 text-center text-xs text-[#666a6e]">
                    Nenhuma sala disponível neste bloco para o horário {reqSlot}.
                  </div>
                ) : (
                  <div className="room-grid">
                    {availableRoomsForAllocation.map((room) => {
                      const isChosen = selectedRoomObj?.id === room.id;
                      const roomCheck = checkRoomMatchesRequirements(room, reqCriteria);
                      const eqSummary = room.equipamentos
                        .map((e) => e.equipamento.descritivo)
                        .slice(0, 3)
                        .join(" · ");

                      return (
                        <button
                          type="button"
                          key={room.id}
                          onClick={() => setAllocatedRoomId(room.id)}
                          className={isChosen ? "selected" : ""}
                        >
                          <div>
                            <Icon
                              name={
                                room.descritivo.includes("Lab")
                                  ? "monitor"
                                  : "building"
                              }
                            />
                            <span
                              className={`rounded px-1.5 py-0.5 text-[8px] font-extrabold ${
                                roomCheck.matches
                                  ? "bg-[#e7f4ec] text-[#176a3a]"
                                  : "bg-[#fff7e9] text-[#885405]"
                              }`}
                            >
                              {roomCheck.matches ? "Compatível" : "Fora dos filtros"}
                            </span>
                          </div>
                          <strong>{room.descritivo}</strong>
                          <span>
                            {room.bloco.descritivo} · {room.capacidade} lugares · Livre
                          </span>
                          {eqSummary && (
                            <span className="mt-1 block truncate text-[9px] text-[#8a8f96]">
                              {eqSummary}
                            </span>
                          )}
                          {!roomCheck.matches && (
                            <span className="mt-1 block truncate text-[9px] font-bold text-[#885405]">
                              Falta: {roomCheck.missingReasons.join(", ")}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e4e6e8] bg-white px-6 py-4">
                <div className="text-xs text-[#666a6e]">
                  {selectedRoomObj ? (
                    <>
                      Sala selecionada:{" "}
                      <strong className="text-[#202124]">
                        {selectedRoomObj.descritivo} ({selectedRoomObj.bloco.descritivo})
                      </strong>
                      {!selectedRoomCheck.matches && (
                        <span className="mt-0.5 block text-[11px] font-bold text-[#885405]">
                          Esta sala está fora dos filtros solicitados e será enviada para aprovação do solicitante.
                        </span>
                      )}
                    </>
                  ) : (
                    "Selecione uma sala acima"
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAllocatingRequest(null)}
                    className="rounded border border-[#d4d7da] bg-white px-4 py-2 text-xs font-semibold text-[#4c5158] hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={!selectedRoomObj}
                    onClick={() => {
                      if (!selectedRoomObj) return;
                      judgeBookingRequest(
                        allocatingRequest.id,
                        "APROVADO",
                        `Alocada na sala ${selectedRoomObj.descritivo} e aprovada pelo gestor`,
                        undefined,
                        undefined,
                        selectedRoomObj.id
                      );
                      if (selectedRoomCheck.matches) {
                        notify(
                          `Solicitação de ${allocatingRequest.solicitante.nome} alocada em ${selectedRoomObj.descritivo} e aprovada!`
                        );
                      } else {
                        notify(
                          `Sala ${selectedRoomObj.descritivo} (fora dos filtros) proposta para ${allocatingRequest.solicitante.nome}!`
                        );
                      }
                      setAllocatingRequest(null);
                    }}
                    className={`rounded px-4 py-2 text-xs font-bold text-white disabled:opacity-50 ${
                      selectedRoomCheck.matches
                        ? "bg-[#167647] hover:bg-[#115e38]"
                        : "bg-[#c87a0b] hover:bg-[#a16107]"
                    }`}
                  >
                    {selectedRoomCheck.matches
                      ? "Confirmar alocação e aprovar"
                      : "Propor sala ao solicitante (Fora dos filtros)"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal de Edição de Sala (Meta 3) */}
      {editingRoom && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-[#13161a]/60 p-4"
          onMouseDown={() => setEditingRoom(null)}
        >
          <form
            onSubmit={handleSaveRoom}
            onMouseDown={(e) => e.stopPropagation()}
            className="relative w-full max-w-[460px] rounded-lg bg-white p-7 shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setEditingRoom(null)}
              aria-label="Fechar modal"
              className="absolute right-4 top-4 p-1 text-[#686d74] hover:text-[#202124]"
            >
              <X size={18} />
            </button>

            <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#b20d19]">
              {editingRoom.bloco.descritivo} · SVG: {editingRoom.codigoSvg}
            </span>
            <h2 className="mt-1 text-xl font-bold text-[#202124]">
              Editar componentes da sala
            </h2>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="mb-1 block font-bold text-[#40444b]">
                  Nome / Identificação da Sala
                </label>
                <input
                  type="text"
                  required
                  value={roomDescritivo}
                  onChange={(e) => setRoomDescritivo(e.target.value)}
                  className="w-full rounded border border-[#cfd2d6] px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-bold text-[#40444b]">
                    Capacidade (Cadeiras)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={200}
                    required
                    value={roomCapacity}
                    onChange={(e) => setRoomCapacity(Number(e.target.value))}
                    className="w-full rounded border border-[#cfd2d6] px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-[#40444b]">
                    Computadores
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={roomComputers}
                    onChange={(e) => setRoomComputers(Number(e.target.value))}
                    className="w-full rounded border border-[#cfd2d6] px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 font-semibold text-[#31353a]">
                  <input
                    type="checkbox"
                    checked={roomHasTv}
                    onChange={(e) => setRoomHasTv(e.target.checked)}
                  />
                  TV 55&quot;
                </label>
                <label className="flex items-center gap-2 font-semibold text-[#31353a]">
                  <input
                    type="checkbox"
                    checked={roomHasProjector}
                    onChange={(e) => setRoomHasProjector(e.target.checked)}
                  />
                  Projetor Multimídia
                </label>
                <label className="flex items-center gap-2 font-semibold text-[#31353a]">
                  <input
                    type="checkbox"
                    checked={roomHasAc}
                    onChange={(e) => setRoomHasAc(e.target.checked)}
                  />
                  Ar-condicionado
                </label>
              </div>

              <div>
                <label className="mb-1 block font-bold text-[#40444b]">
                  Softwares instalados (separados por vírgula)
                </label>
                <input
                  type="text"
                  value={roomSoftwares}
                  onChange={(e) => setRoomSoftwares(e.target.value)}
                  placeholder="Ex.: VS Code, Node.js, Docker, Figma"
                  className="w-full rounded border border-[#cfd2d6] px-3 py-2 text-xs"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingRoom(null)}
                className="rounded border border-[#d4d7da] bg-white px-4 py-2 text-xs font-semibold text-[#4c5158] hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded bg-[#b20d19] px-4 py-2 text-xs font-bold text-white hover:bg-[#870a13]"
              >
                Salvar alterações
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal de Detalhes e Edição Real do Usuário (RF 107) */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-[#13161a]/60 p-4"
          onMouseDown={() => setSelectedUser(null)}
        >
          <div
            className="relative w-full max-w-[440px] rounded-lg bg-white p-7 shadow-2xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedUser(null)}
              aria-label="Fechar modal"
              className="absolute right-4 top-4 p-1 text-[#686d74] hover:text-[#202124]"
            >
              <X size={18} />
            </button>

            <span
              className={`mb-4 grid h-12 w-12 place-items-center rounded-full text-sm font-extrabold ${
                selectedUser.tipoUsuario === "PROFESSOR" ||
                selectedUser.tipoUsuario === "GESTOR"
                  ? "bg-[#f7e7e8] text-[#b20d19]"
                  : "bg-[#e8edf5] text-[#315681]"
              }`}
            >
              {getInitials(selectedUser.nome)}
            </span>

            <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#b20d19]">
              Perfil do usuário (RF 107)
            </span>
            <h2 className="mt-1 text-xl font-bold text-[#202124]">
              {selectedUser.nome}
            </h2>
            <p className="mt-0.5 text-xs text-[#747981]">
              {formatTipoUsuario(selectedUser.tipoUsuario)} ·{" "}
              {formatUsuarioDetalhe(selectedUser)}
            </p>

            {!isEditingUser ? (
              <>
                <dl className="my-5 divide-y divide-[#e3e5e7] border-y border-[#e3e5e7] text-xs">
                  <div className="flex justify-between gap-4 py-3">
                    <dt className="text-[#797e85]">E-mail institucional</dt>
                    <dd className="font-semibold text-[#31353a]">
                      {selectedUser.email}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 py-3">
                    <dt className="text-[#797e85]">RA / Matrícula</dt>
                    <dd className="font-semibold text-[#31353a]">
                      {selectedUser.ra}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 py-3">
                    <dt className="text-[#797e85]">Status da conta</dt>
                    <dd className="font-semibold text-[#31353a]">
                      {selectedUser.emailValidado
                        ? "Ativo (Verificado)"
                        : "Inativo"}
                    </dd>
                  </div>
                </dl>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="rounded border border-[#d4d7da] bg-white px-4 py-2 text-xs font-semibold text-[#4c5158] hover:bg-gray-50"
                  >
                    Fechar
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingUser(true)}
                    className="rounded bg-[#b20d19] px-4 py-2 text-xs font-bold text-white hover:bg-[#870a13]"
                  >
                    Editar cadastro
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleSaveUser} className="mt-4 space-y-3 text-xs">
                <div>
                  <label className="mb-1 block font-bold text-[#40444b]">
                    Nome completo
                  </label>
                  <input
                    type="text"
                    required
                    value={editUserName}
                    onChange={(e) => setEditUserName(e.target.value)}
                    className="w-full rounded border border-[#cfd2d6] px-3 py-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block font-bold text-[#40444b]">
                      RA / Matrícula
                    </label>
                    <input
                      type="text"
                      required
                      value={editUserRa}
                      onChange={(e) => setEditUserRa(e.target.value)}
                      className="w-full rounded border border-[#cfd2d6] px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-bold text-[#40444b]">
                      Cargo / Perfil
                    </label>
                    <select
                      value={editUserRole}
                      onChange={(e) =>
                        setEditUserRole(e.target.value as TipoUsuario)
                      }
                      className="w-full rounded border border-[#cfd2d6] px-3 py-2"
                    >
                      <option value="ALUNO">ALUNO</option>
                      <option value="PROFESSOR">PROFESSOR</option>
                      <option value="GESTOR">GESTOR</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block font-bold text-[#40444b]">
                    E-mail institucional
                  </label>
                  <input
                    type="email"
                    required
                    value={editUserEmail}
                    onChange={(e) => setEditUserEmail(e.target.value)}
                    className="w-full rounded border border-[#cfd2d6] px-3 py-2"
                  />
                </div>

                {editUserRole === "ALUNO" && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block font-bold text-[#40444b]">
                        Curso
                      </label>
                      <select
                        value={editUserCurso}
                        onChange={(e) => setEditUserCurso(e.target.value)}
                        className="w-full rounded border border-[#cfd2d6] px-3 py-2"
                      >
                        {systemCourses.map((c) => (
                          <option key={c.id} value={c.descritivo}>
                            {c.descritivo}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block font-bold text-[#40444b]">
                        Semestre
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={6}
                        value={editUserSemestre}
                        onChange={(e) =>
                          setEditUserSemestre(Number(e.target.value))
                        }
                        className="w-full rounded border border-[#cfd2d6] px-3 py-2"
                      />
                    </div>
                  </div>
                )}

                <label className="flex items-center gap-2 pt-1 font-semibold text-[#31353a]">
                  <input
                    type="checkbox"
                    checked={editUserValidado}
                    onChange={(e) => setEditUserValidado(e.target.checked)}
                  />
                  Conta ativa / E-mail verificado
                </label>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsEditingUser(false)}
                    className="rounded border border-[#d4d7da] bg-white px-4 py-2 text-xs font-semibold text-[#4c5158]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded bg-[#b20d19] px-4 py-2 text-xs font-bold text-white hover:bg-[#870a13]"
                  >
                    Salvar dados
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
