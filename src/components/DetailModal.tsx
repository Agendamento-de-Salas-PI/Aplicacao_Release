"use client";

import { useState } from "react";
import { type Sala, type SalaEquipamento, type SalaSoftware } from "@/types";
import {
  formatEquipamentoItem,
  formatIntervaloHorario,
  OFFICIAL_TIME_SLOT_OBJECTS,
  getTodayLocalStr,
  isTimeSlotPast,
  systemDisciplinas,
} from "@/data/mockData";
import { useApp } from "@/context/AppContext";
import { Icon } from "./Icon";

export default function DetailModal({
  room,
  selectedDate,
  selectedTimeSlot,
  onClose,
}: {
  room: Sala;
  selectedDate: string;
  selectedTimeSlot: string;
  onClose: () => void;
}) {
  const {
    user,
    requests,
    getAvailableSlotsForRoom,
    createBookingRequest,
    updateRoomComponents,
    notify,
  } = useApp();

  // Modal de confirmação de agendamento
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDate, setBookingDate] = useState(selectedDate);
  const [bookingSlot, setBookingSlot] = useState(selectedTimeSlot);
  const [motivo, setMotivo] = useState("Aula prática / Atividade acadêmica");
  const professorDisciplinas =
    user.professor?.disciplinas && user.professor.disciplinas.length > 0
      ? user.professor.disciplinas
      : systemDisciplinas;
  const [selectedDisciplinaId, setSelectedDisciplinaId] = useState<number>(
    () => professorDisciplinas[0]?.id ?? 1
  );

  // Modal de edição de componentes da sala pelo GESTOR (Meta 3)
  const [showEditRoomModal, setShowEditRoomModal] = useState(false);
  const [editCapacity, setEditCapacity] = useState(room.capacidade);
  const [hasTv, setHasTv] = useState(false);
  const [hasProjector, setHasProjector] = useState(false);
  const [hasAc, setHasAc] = useState(false);
  const [computersCount, setComputersCount] = useState(0);
  const [softwaresInput, setSoftwaresInput] = useState("");

  const isUserInactive = !user.emailValidado || user.aluno?.ativo === false;

  const openBookingModal = () => {
    if (isUserInactive) {
      notify(
        "Conta inativa: usuários inativados não podem solicitar agendamentos."
      );
      return;
    }
    setBookingDate(selectedDate);
    if (user.tipoUsuario === "PROFESSOR") {
      setSelectedDisciplinaId(professorDisciplinas[0]?.id ?? 1);
    }
    const availableForDate = getAvailableSlotsForRoom(room.id, selectedDate);
    if (availableForDate.includes(selectedTimeSlot)) {
      setBookingSlot(selectedTimeSlot);
    } else {
      setBookingSlot(availableForDate[0] ?? "");
    }
    setShowBookingModal(true);
  };

  const handleBookingDateChange = (newDate: string) => {
    setBookingDate(newDate);
    const availableForNewDate = getAvailableSlotsForRoom(room.id, newDate);
    if (!availableForNewDate.includes(bookingSlot)) {
      setBookingSlot(availableForNewDate[0] ?? "");
    }
  };

  const openEditRoomModal = () => {
    setEditCapacity(room.capacidade);
    setHasTv(
      room.equipamentos.some((e) =>
        e.equipamento.descritivo.toLowerCase().includes("tv")
      )
    );
    setHasProjector(
      room.equipamentos.some((e) =>
        e.equipamento.descritivo.toLowerCase().includes("projetor")
      )
    );
    setHasAc(
      room.equipamentos.some((e) =>
        e.equipamento.descritivo.toLowerCase().includes("ar-condicionado")
      )
    );
    const compItem = room.equipamentos.find((e) =>
      e.equipamento.descritivo.toLowerCase().includes("computador")
    );
    setComputersCount(compItem ? compItem.quantidade : 0);
    setSoftwaresInput(
      room.softwares.map((s) => s.software.descritivo).join(", ")
    );
    setShowEditRoomModal(true);
  };

  // Agendamentos desta sala na data selecionada
  const roomRequestsOnDate = requests.filter((req) => {
    if (req.salaId !== room.id) return false;
    if (req.status === "REJEITADO" || req.status === "CANCELADO") return false;
    const reqDate = String(req.dataInicio).slice(0, 10);
    return reqDate === selectedDate;
  });

  // Verifica se o horário selecionado está livre de agendamentos APROVADOS ou PENDENTES
  const availableSlotsInModal = getAvailableSlotsForRoom(room.id, bookingDate);

  const isAvailableInSelectedSlot = !roomRequestsOnDate.some((req) => {
    if (req.status !== "APROVADO" && req.status !== "PENDENTE") return false;
    const slotText = formatIntervaloHorario(req.dataInicio, req.dataFim);
    return slotText === selectedTimeSlot;
  });

  const canSeeAuthor =
    user.tipoUsuario === "PROFESSOR" || user.tipoUsuario === "GESTOR";

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingSlot || !availableSlotsInModal.includes(bookingSlot)) {
      notify(
        `O horário ${bookingSlot || "selecionado"} já possui agendamento nesta sala e data!`
      );
      return;
    }

    const created = createBookingRequest({
      salaId: room.id,
      date: bookingDate,
      timeSlot: bookingSlot,
      motivo,
      disciplinaId:
        user.tipoUsuario === "PROFESSOR" ? selectedDisciplinaId : null,
    });

    if (!created) {
      notify(
        `Conflito de horário: ${room.descritivo} já está agendada em ${bookingDate} (${bookingSlot}).`
      );
      return;
    }

    setShowBookingModal(false);
    if (created.status === "APROVADO") {
      notify(`Agendamento direto confirmado para ${room.descritivo}!`);
    } else {
      notify(
        `Solicitação para ${room.descritivo} (${bookingDate} · ${bookingSlot}) enviada ao gestor!`
      );
    }
  };

  const handleSaveRoomComponents = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedEquipments: SalaEquipamento[] = [];
    let eqIdx = 1;

    if (computersCount > 0) {
      updatedEquipments.push({
        id: room.id * 100 + eqIdx++,
        salaId: room.id,
        equipamentoId: 4,
        quantidade: computersCount,
        equipamento: { id: 4, descritivo: "Computadores" },
      });
    }
    if (hasTv) {
      updatedEquipments.push({
        id: room.id * 100 + eqIdx++,
        salaId: room.id,
        equipamentoId: 1,
        quantidade: 1,
        equipamento: { id: 1, descritivo: 'TV 55"' },
      });
    }
    if (hasProjector) {
      updatedEquipments.push({
        id: room.id * 100 + eqIdx++,
        salaId: room.id,
        equipamentoId: 5,
        quantidade: 1,
        equipamento: { id: 5, descritivo: "Projetor" },
      });
    }
    if (hasAc) {
      updatedEquipments.push({
        id: room.id * 100 + eqIdx++,
        salaId: room.id,
        equipamentoId: 2,
        quantidade: 1,
        equipamento: { id: 2, descritivo: "Ar-condicionado" },
      });
    }
    updatedEquipments.push({
      id: room.id * 100 + eqIdx++,
      salaId: room.id,
      equipamentoId: 3,
      quantidade: editCapacity,
      equipamento: { id: 3, descritivo: "Cadeiras" },
    });

    const swNames = softwaresInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const updatedSoftwares: SalaSoftware[] = swNames.map((name, idx) => ({
      salaId: room.id,
      softwareId: idx + 1,
      software: { id: idx + 1, descritivo: name },
    }));

    updateRoomComponents(
      room.id,
      editCapacity,
      updatedEquipments,
      updatedSoftwares
    );
    setShowEditRoomModal(false);
    notify(`Componentes de ${room.descritivo} atualizados com sucesso!`);
  };

  return (
    <aside className="details">
      <div className="detail-top">
        <span>DETALHES DA SALA</span>
        <button type="button" onClick={onClose} aria-label="Fechar detalhes">
          <Icon name="close" />
        </button>
      </div>

      <div className="detail-content">
        <div
          className="available-pill"
          style={
            !isAvailableInSelectedSlot
              ? {
                  background: "#fff0f0",
                  color: "#9b0000",
                }
              : undefined
          }
        >
          <i
            style={
              !isAvailableInSelectedSlot ? { background: "#b20d19" } : undefined
            }
          />
          {isAvailableInSelectedSlot
            ? `Disponível em ${selectedTimeSlot}`
            : `Ocupada em ${selectedTimeSlot}`}
        </div>

        <h2>{room.descritivo}</h2>
        <p>
          {room.bloco.descritivo} · {room.tipoSala.descritivo} (SVG:{" "}
          <code>{room.codigoSvg}</code>)
        </p>

        <div className="equipment">
          <div className="mb-2 flex items-center justify-between">
            <h3 style={{ margin: 0 }}>Infraestrutura ({room.capacidade} cadeiras)</h3>
            {user.tipoUsuario === "GESTOR" && (
              <button
                type="button"
                onClick={openEditRoomModal}
                className="text-[10px] font-bold text-[#b20d19] underline hover:text-[#870a13]"
              >
                Editar sala
              </button>
            )}
          </div>
          <div>
            {room.equipamentos.map((item) => {
              const desc = item.equipamento.descritivo.toLowerCase();
              const iconName = desc.includes("comput")
                ? "monitor"
                : desc.includes("tv") || desc.includes("projetor")
                  ? "tv"
                  : desc.includes("ar-condicionado")
                    ? "snow"
                    : "chair";
              return (
                <span key={item.id}>
                  <Icon name={iconName} size={16} />
                  {formatEquipamentoItem(item)}
                </span>
              );
            })}
          </div>

          {room.softwares.length > 0 && (
            <div className="mt-3 border-t border-[#eceef0] pt-2.5">
              <h3 className="mb-1.5 text-[10px]">Softwares instalados</h3>
              <div className="flex flex-wrap gap-1.5">
                {room.softwares.map((sw) => (
                  <span
                    key={sw.softwareId}
                    className="rounded bg-[#f1f3f5] px-2 py-0.5 text-[9px] font-semibold text-[#3d424a]"
                  >
                    {sw.software.descritivo}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="schedule">
          <div className="section-title">
            <h3>Agenda ({selectedDate})</h3>
            <span className="text-[9px] font-semibold text-[#777c84]">
              {roomRequestsOnDate.length} reserva(s)
            </span>
          </div>

          {OFFICIAL_TIME_SLOT_OBJECTS.map((slot) => {
            const matchingBooking = roomRequestsOnDate.find(
              (req) =>
                formatIntervaloHorario(req.dataInicio, req.dataFim) ===
                slot.label
            );

            if (!matchingBooking) {
              return (
                <div key={slot.start}>
                  <time>{slot.start}</time>
                  <span className="event free">
                    <strong>Horário livre</strong>
                    <small>até {slot.end}</small>
                  </span>
                </div>
              );
            }

            const isApproved = matchingBooking.status === "APROVADO";
            const statusLabel = isApproved
              ? "Reservado"
              : matchingBooking.status === "EM_NEGOCIACAO"
                ? "Em negociação"
                : "Aguardando aprovação";
            const isProfessorBooking =
              matchingBooking.solicitante.tipoUsuario === "PROFESSOR";
            const disciplinaText = matchingBooking.disciplina
              ? `${matchingBooking.disciplina.descritivo}${
                  matchingBooking.disciplina.curso
                    ? ` (${matchingBooking.disciplina.curso.descritivo})`
                    : ""
                }`
              : null;

            return (
              <div key={slot.start}>
                <time>{slot.start}</time>
                <span className={`event ${isApproved ? "busy" : "pending"}`}>
                  <strong>
                    {isProfessorBooking && disciplinaText
                      ? disciplinaText
                      : matchingBooking.motivo || "Reserva acadêmica"}
                  </strong>
                  {isProfessorBooking && disciplinaText && (
                    <span className="mt-0.5 block text-[10px] font-semibold text-[#b20d19]">
                      Disciplina Docente · {matchingBooking.motivo || "Aula"}
                    </span>
                  )}
                  <small>
                    até {slot.end} · {statusLabel}
                    {canSeeAuthor
                      ? ` · ${matchingBooking.solicitante.nome}`
                      : ""}
                  </small>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="detail-footer">
        {isUserInactive && (
          <div className="mb-2 rounded border border-[#e1b6b9] bg-[#fff0f0] p-2 text-center text-[10px] font-bold text-[#9b0000]">
            Sua conta está inativa e não pode realizar agendamentos.
          </div>
        )}
        <button
          type="button"
          className="primary full"
          onClick={openBookingModal}
          disabled={isUserInactive}
          style={isUserInactive ? { opacity: 0.55, cursor: "not-allowed" } : undefined}
        >
          {isUserInactive
            ? "Agendamento bloqueado (Conta inativa)"
            : user.tipoUsuario === "GESTOR"
              ? "Agendar diretamente (Gestor)"
              : "Solicitar agendamento"}
          <Icon name="arrow" size={18} />
        </button>
        <small>
          {user.tipoUsuario === "GESTOR"
            ? "Como gestor, o agendamento será aprovado imediatamente."
            : user.tipoUsuario === "PROFESSOR"
              ? "Solicitação com Prioridade Docente (RF 403)."
              : "O pedido será enviado para aprovação do gestor."}
        </small>
      </div>

      {/* Modal de Confirmação de Agendamento (Meta 6) */}
      {showBookingModal && (
        <div
          className="modal-backdrop"
          onMouseDown={() => setShowBookingModal(false)}
        >
          <form
            className="action-modal"
            onMouseDown={(e) => e.stopPropagation()}
            onSubmit={handleConfirmBooking}
          >
            <button
              type="button"
              className="modal-close"
              onClick={() => setShowBookingModal(false)}
              aria-label="Fechar modal"
            >
              <Icon name="close" />
            </button>
            <span>NOVO AGENDAMENTO</span>
            <h2>Reservar {room.descritivo}</h2>
            <p>
              Solicitante: <strong>{user.nome}</strong> ({user.tipoUsuario})
            </p>

            <div className="modal-fields">
              <div>
                <label className="field-label" htmlFor="booking-date">
                  Data
                </label>
                <input
                  id="booking-date"
                  type="date"
                  required
                  min={getTodayLocalStr()}
                  value={bookingDate}
                  onChange={(e) => handleBookingDateChange(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="field-label" htmlFor="booking-slot">
                  Horário disponível
                </label>
                <select
                  id="booking-slot"
                  value={bookingSlot}
                  onChange={(e) => setBookingSlot(e.target.value)}
                  className="w-full"
                  required
                >
                  {OFFICIAL_TIME_SLOT_OBJECTS.map((s) => {
                    const isPast = isTimeSlotPast(bookingDate, s.label);
                    const isAvailable = availableSlotsInModal.includes(s.label);
                    return (
                      <option
                        key={s.label}
                        value={s.label}
                        disabled={!isAvailable}
                      >
                        {s.label}{" "}
                        {!isAvailable
                          ? isPast
                            ? "(Horário encerrado)"
                            : "(Indisponível / Agendado)"
                          : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {availableSlotsInModal.length === 0 && (
              <p className="mt-2 rounded bg-[#fff0f0] p-2 text-[10px] font-bold text-[#9b0000]">
                Todos os 6 horários desta sala já estão ocupados nesta data. Escolha outra data.
              </p>
            )}

            {user.tipoUsuario === "PROFESSOR" && (
              <div className="mt-3">
                <label className="field-label" htmlFor="booking-disciplina">
                  Disciplina ministrada (Obrigatório · RF 402/403)
                </label>
                <select
                  id="booking-disciplina"
                  required
                  value={selectedDisciplinaId}
                  onChange={(e) =>
                    setSelectedDisciplinaId(Number(e.target.value))
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

            <label className="field-label" htmlFor="booking-motivo">
              Finalidade / Atividade
            </label>
            <textarea
              id="booking-motivo"
              required
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Descreva a aula, monitoria ou atividade..."
            />

            <div className="modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setShowBookingModal(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="primary"
                disabled={availableSlotsInModal.length === 0 || !bookingSlot}
              >
                Confirmar solicitação
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal de Edição de Componentes da Sala pelo Gestor (Meta 3) */}
      {showEditRoomModal && (
        <div
          className="modal-backdrop"
          onMouseDown={() => setShowEditRoomModal(false)}
        >
          <form
            className="action-modal"
            onMouseDown={(e) => e.stopPropagation()}
            onSubmit={handleSaveRoomComponents}
          >
            <button
              type="button"
              className="modal-close"
              onClick={() => setShowEditRoomModal(false)}
              aria-label="Fechar modal"
            >
              <Icon name="close" />
            </button>
            <span>GESTÃO DE INFRAESTRUTURA</span>
            <h2>Editar {room.descritivo}</h2>
            <p>
              Atualize a capacidade, equipamentos e softwares disponíveis nesta
              sala.
            </p>

            <div className="modal-fields">
              <div>
                <label className="field-label" htmlFor="edit-cap">
                  Capacidade (Cadeiras)
                </label>
                <input
                  id="edit-cap"
                  type="number"
                  min={5}
                  max={200}
                  required
                  value={editCapacity}
                  onChange={(e) => setEditCapacity(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="field-label" htmlFor="edit-comp">
                  Qtd. Computadores
                </label>
                <input
                  id="edit-comp"
                  type="number"
                  min={0}
                  max={100}
                  value={computersCount}
                  onChange={(e) => setComputersCount(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            <div className="mt-3 space-y-2 text-xs">
              <label className="flex items-center gap-2 font-semibold text-[#33383e]">
                <input
                  type="checkbox"
                  checked={hasTv}
                  onChange={(e) => setHasTv(e.target.checked)}
                />
                Possui TV 55&quot;
              </label>
              <label className="flex items-center gap-2 font-semibold text-[#33383e]">
                <input
                  type="checkbox"
                  checked={hasProjector}
                  onChange={(e) => setHasProjector(e.target.checked)}
                />
                Possui Projetor Multimídia
              </label>
              <label className="flex items-center gap-2 font-semibold text-[#33383e]">
                <input
                  type="checkbox"
                  checked={hasAc}
                  onChange={(e) => setHasAc(e.target.checked)}
                />
                Possui Ar-condicionado
              </label>
            </div>

            <label className="field-label" htmlFor="edit-sw">
              Softwares instalados (separados por vírgula)
            </label>
            <input
              id="edit-sw"
              type="text"
              value={softwaresInput}
              onChange={(e) => setSoftwaresInput(e.target.value)}
              placeholder="Ex.: VS Code, Docker, Figma"
              className="auth-input"
            />

            <div className="modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setShowEditRoomModal(false)}
              >
                Cancelar
              </button>
              <button type="submit" className="primary">
                Salvar alterações
              </button>
            </div>
          </form>
        </div>
      )}
    </aside>
  );
}
