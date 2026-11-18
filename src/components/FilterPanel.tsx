import { Icon } from "./Icon";
import {
  OFFICIAL_TIME_SLOTS,
  getTodayLocalStr,
  isTimeSlotPast,
} from "@/data/mockData";

export interface FilterState {
  date: string;
  timeSlot: string;
  seats: number;
  hasTvOrProjector: boolean;
  hasAc: boolean;
  hasComputers: boolean;
  softwareQuery: string;
}

export default function FilterPanel({
  filters,
  onChange,
  matchedCount,
  onReset,
  onRequestWithoutRoom,
  mobileOpen,
  onCloseMobile,
}: {
  filters: FilterState;
  onChange: (updated: Partial<FilterState>) => void;
  matchedCount: number;
  onReset: () => void;
  onRequestWithoutRoom?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}) {
  return (
    <aside
      className={`filters ${mobileOpen ? "mobile-open" : ""}`}
      id="filters"
      tabIndex={-1}
    >
      <div className="panel-heading">
        <div>
          <span>BUSCAR SALA</span>
          <h2>Filtros</h2>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="hidden lg:inline-block">⇧ F</kbd>
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="rounded border border-[#d4d7da] px-2.5 py-1 text-[11px] font-bold text-[#4c5158] lg:hidden"
            >
              Fechar
            </button>
          )}
        </div>
      </div>

      <label className="field-label" htmlFor="date">
        Data
      </label>
      <div className="input-icon">
        <Icon name="calendar" size={18} />
        <input
          id="date"
          type="date"
          min={getTodayLocalStr()}
          value={filters.date}
          onChange={(e) => onChange({ date: e.target.value })}
        />
      </div>

      <label className="field-label" htmlFor="time">
        Horário disponível
      </label>
      <div className="input-icon">
        <Icon name="clock" size={18} />
        <select
          id="time"
          value={filters.timeSlot}
          onChange={(e) => onChange({ timeSlot: e.target.value })}
        >
          {OFFICIAL_TIME_SLOTS.map((slot) => {
            const isPast = isTimeSlotPast(filters.date, slot);
            return (
              <option key={slot} value={slot} disabled={isPast}>
                {slot} {isPast ? "(Horário encerrado)" : ""}
              </option>
            );
          })}
        </select>
      </div>

      <div className="range-header">
        <label className="field-label" htmlFor="seats">
          Número de cadeiras
        </label>
        <output>{filters.seats}+</output>
      </div>
      <input
        className="range"
        id="seats"
        type="range"
        min="10"
        max="80"
        value={filters.seats}
        onChange={(e) => onChange({ seats: Number(e.target.value) })}
        style={
          {
            "--range": `${((filters.seats - 10) / 70) * 100}%`,
          } as React.CSSProperties
        }
      />
      <div className="range-scale">
        <span>10</span>
        <span>80</span>
      </div>

      <fieldset>
        <legend>Componentes</legend>
        <label className="check-row">
          <input
            type="checkbox"
            checked={filters.hasTvOrProjector}
            onChange={(e) => onChange({ hasTvOrProjector: e.target.checked })}
          />
          <span>
            <Icon name="tv" size={18} />
            TV ou projetor
          </span>
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={filters.hasAc}
            onChange={(e) => onChange({ hasAc: e.target.checked })}
          />
          <span>
            <Icon name="snow" size={18} />
            Ar-condicionado
          </span>
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={filters.hasComputers}
            onChange={(e) => onChange({ hasComputers: e.target.checked })}
          />
          <span>
            <Icon name="monitor" size={18} />
            Computadores
          </span>
        </label>
      </fieldset>

      <label className="field-label" htmlFor="software">
        Software
      </label>
      <div className="input-icon">
        <Icon name="search" size={18} />
        <input
          id="software"
          type="text"
          autoComplete="off"
          value={filters.softwareQuery}
          onChange={(e) => onChange({ softwareQuery: e.target.value })}
          onKeyDown={(e) => e.stopPropagation()}
          placeholder="Ex.: Figma, VS Code, Docker..."
        />
      </div>

      <div className="mt-4 flex items-center justify-between rounded border border-[#e0e2e5] bg-[#f8f9fa] px-3 py-2 text-[11px] font-bold text-[#33383e]">
        <span>Salas compatíveis no bloco</span>
        <span className="rounded bg-[#b20d19] px-2 py-0.5 text-[10px] text-white">
          {matchedCount} {matchedCount === 1 ? "sala" : "salas"}
        </span>
      </div>

      <button type="button" className="text-btn" onClick={onReset}>
        Limpar todos os filtros
      </button>

      {onRequestWithoutRoom && (
        <div className="mt-2 border-t border-[#e4e5e7] pt-3">
          <button
            type="button"
            onClick={onRequestWithoutRoom}
            className="w-full rounded border border-[#d4d7da] bg-[#fafafb] px-3 py-2 text-[10px] font-bold text-[#3f444c] hover:border-[#b20d19] hover:text-[#b20d19]"
          >
            Solicitar horário sem sala específica
          </button>
        </div>
      )}

      <div className="shortcut-help">
        <Icon name="info" size={17} />
        <span>
          Use <kbd>⇧ F</kbd> para abrir filtros e <kbd>Esc</kbd> para fechar.
        </span>
      </div>
    </aside>
  );
}
