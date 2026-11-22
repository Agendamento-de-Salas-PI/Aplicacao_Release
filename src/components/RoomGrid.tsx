import { Icon } from "./Icon";
import { type Sala } from "@/types";

export function RoomGrid({
  rooms,
  selected,
  onSelect,
  onResetFilters,
}: {
  rooms: Sala[];
  selected: Sala | null;
  onSelect: (r: Sala) => void;
  onResetFilters?: () => void;
}) {
  if (rooms.length === 0) {
    return (
      <div className="p-10 text-center">
        <p className="text-sm font-bold text-[#34383d]">
          Nenhuma sala encontrada neste bloco com os filtros aplicados.
        </p>
        <p className="mt-1 text-xs text-[#747982]">
          Experimente reduzir o número de cadeiras ou desmarcar componentes.
        </p>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-4 rounded bg-[#b20d19] px-4 py-2 text-xs font-bold text-white hover:bg-[#870a13]"
          >
            Restaurar filtros do bloco
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="room-grid">
      {rooms.map((room) => {
        const eqSummary = room.equipamentos
          .map((e) => e.equipamento.descritivo)
          .slice(0, 3)
          .join(" · ");

        return (
          <button
            type="button"
            key={room.id}
            onClick={() => onSelect(room)}
            className={selected?.id === room.id ? "selected" : ""}
            aria-label={`${room.descritivo} - ${room.capacidade} lugares - ${room.statusOcupacao}`}
          >
            <div>
              <Icon
                name={room.descritivo.includes("Lab") ? "monitor" : "building"}
              />
              <span
                className={`status-dot ${room.statusOcupacao
                  ?.toLowerCase()
                  .replace(" ", "-")}`}
              />
            </div>
            <strong>{room.descritivo}</strong>
            <span>
              {room.capacidade} lugares · {room.statusOcupacao}
            </span>
            {eqSummary && (
              <span className="mt-1 block truncate text-[9px] text-[#8a8f96]">
                {eqSummary}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
