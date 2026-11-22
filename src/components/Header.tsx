"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Brand from "./Brand";
import { Icon } from "./Icon";
import { useApp } from "@/context/AppContext";
import {
  getInitials,
  formatDataCurta,
  formatIntervaloHorario,
} from "@/data/mockData";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, requests, respondToProposal, notify } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  if (pathname === "/login" || pathname === "/registro") {
    return null;
  }

  // Propostas aguardando resposta deste usuário (EM_NEGOCIACAO)
  const myProposals = requests.filter(
    (r) => r.solicitanteId === user.id && r.status === "EM_NEGOCIACAO"
  );

  // Pedidos recusados pelo solicitante que voltaram para o Gestor refazer julgamento
  const managerReturnedRequests =
    user.tipoUsuario === "GESTOR"
      ? requests.filter((r) => r.status === "PENDENTE" && r.recusadoPeloUsuario)
      : [];

  const totalNotifications = myProposals.length + managerReturnedRequests.length;

  return (
    <header className="app-header">
      <Brand />
      <nav className={mobileOpen ? "main-nav open" : "main-nav"} aria-label="Navegação principal">
        <button
          type="button"
          className={pathname === "/" ? "active" : ""}
          onClick={() => {
            router.push("/");
            setMobileOpen(false);
          }}
        >
          <Icon name="calendar" />
          Agendar sala
        </button>
        {user.tipoUsuario === "GESTOR" && (
          <button
            type="button"
            className={pathname === "/gestor" ? "active" : ""}
            onClick={() => {
              router.push("/gestor");
              setMobileOpen(false);
            }}
          >
            <Icon name="grid" />
            Painel do gestor
          </button>
        )}
      </nav>
      <div className="header-actions relative">
        <div className="relative">
          <button
            type="button"
            className="icon-btn"
            aria-label="Notificações"
            onClick={() => setNotifOpen((prev) => !prev)}
          >
            <Icon name="bell" />
            {totalNotifications > 0 && <i />}
          </button>

          {notifOpen && (
            <div className=" absolute right-0 top-11 z-50 w-80 rounded-lg border border-[#dfe1e4] bg-white p-3.5 shadow-xl">
              <div className="mb-2 flex items-center justify-between border-b border-[#eceef0] pb-2">
                <strong className="text-xs font-extrabold text-[#202124]">
                  Notificações ({totalNotifications})
                </strong>
                <button
                  type="button"
                  onClick={() => setNotifOpen(false)}
                  className="text-[11px] font-bold text-[#686d75] hover:text-[#202124]"
                >
                  Fechar
                </button>
              </div>

              {totalNotifications === 0 ? (
                <p className="py-4 text-center text-xs text-[#747982]">
                  Você não possui propostas ou alertas pendentes.
                </p>
              ) : (
                <div className="max-h-80 space-y-2.5 overflow-y-auto">
                  {myProposals.map((req) => {
                    const targetRoomDesc =
                      req.salaProposta?.descritivo ??
                      req.sala?.descritivo ??
                      "Sala sugerida";
                    const targetDate = req.dataProposta
                      ? req.dataProposta
                      : formatDataCurta(req.dataInicio);
                    const targetTime =
                      req.horarioProposto ??
                      formatIntervaloHorario(req.dataInicio, req.dataFim);

                    return (
                      <div
                        key={req.id}
                        className="rounded border border-[#e5c78f] bg-[#fff7e9] p-2.5 text-xs text-[#694104]"
                      >
                        <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#b20d19]">
                          {req.foraDosFiltros
                            ? "Alocação fora dos filtros solicitados"
                            : "Proposta de reagendamento"}
                        </span>
                        <p className="mt-1 leading-snug">
                          O gestor propôs <strong>{targetRoomDesc}</strong> em{" "}
                          <strong>{targetDate}</strong> ({targetTime}).
                        </p>
                        <div className="mt-2 flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              respondToProposal(req.id, true);
                              notify(
                                `Proposta aceita! Agendamento confirmado em ${targetRoomDesc}.`
                              );
                              setNotifOpen(false);
                            }}
                            className="flex-1 rounded bg-[#167647] px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#115e38]"
                          >
                            Aceitar proposta
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              respondToProposal(req.id, false);
                              notify(
                                "Proposta rejeitada. O pedido retornou ao gestor para novo julgamento."
                              );
                              setNotifOpen(false);
                            }}
                            className="flex-1 rounded border border-[#e1b6b9] bg-white px-2.5 py-1.5 text-[11px] font-bold text-[#9e101a] hover:bg-[#fff0f0]"
                          >
                            Rejeitar proposta
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {managerReturnedRequests.map((req) => (
                    <div
                      key={req.id}
                      className="rounded border border-[#e1b6b9] bg-[#fff0f0] p-2.5 text-xs text-[#9b0000]"
                    >
                      <span className="block text-[10px] font-extrabold uppercase tracking-wider">
                        Negado pelo usuário — refazer julgamento
                      </span>
                      <p className="mt-1 text-[11px] text-[#4c5158]">
                        <strong>{req.solicitante.nome}</strong> recusou a proposta anterior.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setNotifOpen(false);
                          router.push("/gestor");
                        }}
                        className="mt-2 w-full rounded bg-[#b20d19] py-1 text-[11px] font-bold text-white"
                      >
                        Abrir no Painel do Gestor
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          className={`profile-btn ${pathname === "/perfil" ? "active" : ""}`}
          onClick={() => router.push("/perfil")}
          aria-label="Abrir meu perfil"
        >
          <span>{getInitials(user.nome)}</span>
          <div>
            <strong>{user.nome}</strong>
            <small>{user.tipoUsuario}</small>
          </div>
          <Icon name="chevron" size={16} />
        </button>
        <button
          type="button"
          className="mobile-menu"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Abrir menu"
        >
          <Icon name="menu" />
        </button>
      </div>
    </header>
  );
}