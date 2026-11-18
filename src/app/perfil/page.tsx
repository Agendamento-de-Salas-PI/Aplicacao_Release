"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { useApp } from "@/context/AppContext";
import {
  getInitials,
  formatTipoUsuario,
  formatDataCurta,
  formatIntervaloHorario,
} from "@/data/mockData";

export default function ProfilePage() {
  const router = useRouter();
  const { user, requests, updateUserData, respondToProposal, notify } =
    useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [editNome, setEditNome] = useState(user.nome);
  const [editEmail, setEditEmail] = useState(user.email);

  const myRequests = requests.filter((r) => r.solicitanteId === user.id);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserData(user.id, {
      nome: editNome,
      email: editEmail,
    });
    setIsEditing(false);
    notify("Dados institucionais atualizados com sucesso!");
  };

  return (
    <main className="profile-page">
      <div className="profile-breadcrumb">
        <span onClick={() => router.push("/")} style={{ cursor: "pointer" }}>
          Início
        </span>
        <Icon name="chevron" size={14} />
        Meu perfil
      </div>
      <section className="profile-shell">
        <aside className="profile-summary">
          <div className="profile-cover" />
          <div className="profile-avatar">{getInitials(user.nome)}</div>
          <div className="profile-identity">
            <span className="eyebrow">CONTA INSTITUCIONAL</span>
            <h1>{user.nome}</h1>
            <p>{formatTipoUsuario(user.tipoUsuario)}</p>
            <span className="verified-badge">
              <Icon name="check" size={13} />
              {user.emailValidado ? "Conta verificada" : "Verificação pendente"}
            </span>
          </div>
          <nav aria-label="Seções do perfil">
            <button type="button" className="active">
              <Icon name="users" size={18} />
              Informações pessoais
            </button>
            <button
              type="button"
              onClick={() => notify("Preferências de notificação abertas")}
            >
              <Icon name="bell" size={18} />
              Notificações
            </button>
            <button
              type="button"
              onClick={() => {
                notify("Sessão encerrada");
                router.push("/login");
              }}
            >
              <Icon name="logout" size={18} />
              Sair da conta
            </button>
          </nav>
        </aside>

        <div className="profile-content">
          <div className="profile-content-head">
            <div>
              <span>MEU PERFIL</span>
              <h2>Informações pessoais</h2>
              <p>Consulte e mantenha seus dados institucionais atualizados.</p>
            </div>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setEditNome(user.nome);
                setEditEmail(user.email);
                setIsEditing(!isEditing);
              }}
            >
              {isEditing ? "Cancelar edição" : "Editar informações"}
            </button>
          </div>

          <div className="profile-section">
            <h3>Dados da conta</h3>
            {isEditing ? (
              <form onSubmit={handleSaveProfile} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="field-label" htmlFor="p-nome">
                      Nome completo
                    </label>
                    <input
                      id="p-nome"
                      className="auth-input"
                      required
                      value={editNome}
                      onChange={(e) => setEditNome(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="p-email">
                      E-mail institucional
                    </label>
                    <input
                      id="p-email"
                      type="email"
                      className="auth-input"
                      required
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                    />
                  </div>
                </div>
                <button type="submit" className="primary">
                  Salvar alterações
                </button>
              </form>
            ) : (
              <div className="profile-fields">
                <div>
                  <span>Nome completo</span>
                  <strong>{user.nome}</strong>
                </div>
                <div>
                  <span>Tipo de usuário</span>
                  <strong>{formatTipoUsuario(user.tipoUsuario)}</strong>
                </div>
                <div>
                  <span>E-mail institucional</span>
                  <strong>{user.email}</strong>
                </div>
                <div>
                  <span>RA / Matrícula</span>
                  <strong>{user.ra}</strong>
                </div>
                {user.aluno?.curso && (
                  <div>
                    <span>Curso</span>
                    <strong>{user.aluno.curso.descritivo}</strong>
                  </div>
                )}
                {user.aluno?.semestre && (
                  <div>
                    <span>Semestre atual</span>
                    <strong>{user.aluno.semestre}º Semestre</strong>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Meus agendamentos e propostas de negociação (RF 408 / RF 409) */}
          <div className="profile-section">
            <h3>Meus agendamentos ({myRequests.length})</h3>
            {myRequests.length === 0 ? (
              <p className="text-xs text-[#777c84]">
                Você ainda não realizou solicitações de agendamento nesta sessão.
              </p>
            ) : (
              <div className="space-y-2.5">
                {myRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded border border-[#dfe1e4] bg-[#fafafb] p-3 text-xs"
                  >
                    <div>
                      <strong className="text-[#202124]">
                        {req.sala?.descritivo ?? "Horário sem sala específica (RF 401)"}
                      </strong>
                      <span className="mt-0.5 block text-[11px] text-[#6d7175]">
                        {formatDataCurta(req.dataInicio)} ·{" "}
                        {formatIntervaloHorario(req.dataInicio, req.dataFim)} —{" "}
                        {req.motivo}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded px-2.5 py-1 text-[10px] font-extrabold ${
                          req.status === "APROVADO"
                            ? "bg-[#e7f4ec] text-[#176a3a]"
                            : req.status === "EM_NEGOCIACAO"
                              ? "bg-[#fff7e9] text-[#885405]"
                              : req.status === "REJEITADO" ||
                                  req.status === "CANCELADO"
                                ? "bg-[#fff0f0] text-[#9b0000]"
                                : "bg-[#eeeeeb] text-[#41454a]"
                        }`}
                      >
                        {req.status}
                      </span>

                      {req.status === "EM_NEGOCIACAO" && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              respondToProposal(req.id, true);
                              notify("Proposta aceita e agendamento confirmado!");
                            }}
                            className="rounded bg-[#167647] px-2.5 py-1 text-[10px] font-bold text-white"
                          >
                            Aceitar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              respondToProposal(req.id, false);
                              notify(
                                "Proposta recusada. Sua solicitação retornou ao gestor para novo julgamento."
                              );
                            }}
                            className="rounded border border-[#d4d7da] bg-white px-2.5 py-1 text-[10px] font-bold text-[#4c5158]"
                          >
                            Rejeitar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="profile-note">
            <Icon name="info" size={19} />
            <p>
              Alguns dados são sincronizados com o sistema acadêmico da FATEC.
              Para corrigir informações institucionais, entre em contato com a
              secretaria.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
