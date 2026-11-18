"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Brand from "@/components/Brand";
import { Icon } from "@/components/Icon";
import { useApp } from "@/context/AppContext";
import {
  defaultAccounts,
  systemCourses,
  type UserRole,
} from "@/data/mockData";

export default function LoginPage() {
  const router = useRouter();
  const {
    loginWithCredentials,
    registerUser,
    setUser,
    notify,
  } = useApp();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [role, setRole] = useState<UserRole>("ALUNO");

  // Campos controlados
  const [nome, setNome] = useState("");
  const [ra, setRa] = useState("");
  const [email, setEmail] = useState("gabriel.lima@fatec.sp.gov.br");
  const [password, setPassword] = useState("123456");
  const [cursoDesc, setCursoDesc] = useState("DSM");
  const [semestre, setSemestre] = useState(4);
  const [showPassword, setShowPassword] = useState(false);

  const handleQuickLogin = (accountKey: "gestor" | "professor" | "aluno") => {
    const account = defaultAccounts[accountKey];
    setEmail(account.email);
    setPassword(account.senha ?? "123456");
    setUser(account);
    notify(
      `Autenticado como ${account.nome} (${account.tipoUsuario})`
    );
    router.push("/");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "login") {
      const authenticated = loginWithCredentials(email, password);
      if (!authenticated) {
        notify("E-mail ou senha inválidos. Verifique suas credenciais.");
        return;
      }
      notify(`Bem-vindo(a), ${authenticated.nome} (${authenticated.tipoUsuario})!`);
      router.push("/");
    } else {
      const created = registerUser({
        nome,
        ra,
        email,
        senha: password,
        tipoUsuario: role,
        cursoDesc: role === "ALUNO" ? cursoDesc : undefined,
        semestre: role === "ALUNO" ? semestre : undefined,
      });
      notify(
        `Conta criada com sucesso! Logado como ${created.nome} (${created.tipoUsuario}).`
      );
      router.push("/");
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-aside">
        <Brand />
        <div className="auth-copy">
          <span>FATEC JAHU</span>
          <h1>
            O espaço certo,
            <br />
            na hora certa.
          </h1>
          <p>
            Encontre, reserve e gerencie os espaços da faculdade em poucos
            passos.
          </p>
          <div className="auth-benefits">
            <span>
              <i>
                <Icon name="map" />
              </i>
              Mapa SVG interativo por blocos
            </span>
            <span>
              <i>
                <Icon name="clock" />
              </i>
              Disponibilidade e filtros em tempo real
            </span>
            <span>
              <i>
                <Icon name="check" />
              </i>
              Aprovação e negociação transparentes
            </span>
          </div>
        </div>
        <small>Centro Paula Souza · Governo do Estado de São Paulo</small>
      </section>

      <section className="auth-form-wrap">
        <div className="mobile-auth-brand">
          <Brand />
        </div>
        <form className="auth-card" onSubmit={submit}>
          <span className="eyebrow">
            {mode === "login" ? "BEM-VINDO DE VOLTA" : "NOVO CADASTRO"}
          </span>
          <h2>{mode === "login" ? "Acesse sua conta" : "Crie sua conta"}</h2>
          <p>
            {mode === "login"
              ? "Utilize uma das 3 contas padrões para demonstração rápida ou entre com seu e-mail institucional."
              : "Selecione seu perfil e preencha seus dados institucionais da Fatec."}
          </p>

          {/* 3 Contas Padrões Pré-Configuradas (Meta 4) */}
          {mode === "login" && (
            <div className="mb-5 rounded-md border border-[#e0e2e5] bg-[#f8f9fa] p-3">
              <span className="mb-2 block text-[9px] font-extrabold uppercase tracking-wider text-[#b20d19]">
                Contas Padrões (Acesso Rápido · Senha: 123456)
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickLogin("aluno")}
                  className="rounded border border-[#b20d19] bg-[#fff8f8] px-2 py-2 text-left transition hover:bg-[#fff0f0]"
                >
                  <strong className="block text-[10px] text-[#b20d19]">
                    Aluno (Padrão)
                  </strong>
                  <span className="block truncate text-[9px] text-[#686d75]">
                    Gabriel Lima
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin("professor")}
                  className="rounded border border-[#d4d6da] bg-white px-2 py-2 text-left transition hover:border-[#b20d19] hover:bg-[#fff8f8]"
                >
                  <strong className="block text-[10px] text-[#202124]">
                    Professor
                  </strong>
                  <span className="block truncate text-[9px] text-[#686d75]">
                    Marina Prado
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin("gestor")}
                  className="rounded border border-[#d4d6da] bg-white px-2 py-2 text-left transition hover:border-[#b20d19] hover:bg-[#fff8f8]"
                >
                  <strong className="block text-[10px] text-[#202124]">
                    Gestor
                  </strong>
                  <span className="block truncate text-[9px] text-[#686d75]">
                    Bruno Lallo
                  </span>
                </button>
              </div>
            </div>
          )}

          {mode === "signup" && (
            <>
              <label className="field-label">Eu sou</label>
              <div className="role-selector">
                {(["ALUNO", "PROFESSOR", "GESTOR"] as UserRole[]).map(
                  (item) => (
                    <button
                      type="button"
                      key={item}
                      className={role === item ? "active" : ""}
                      onClick={() => setRole(item)}
                    >
                      <Icon
                        name={
                          item === "ALUNO"
                            ? "users"
                            : item === "PROFESSOR"
                              ? "building"
                              : "sliders"
                        }
                      />
                      {item}
                    </button>
                  )
                )}
              </div>

              <label className="field-label" htmlFor="name">
                Nome completo
              </label>
              <input
                className="auth-input"
                id="name"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Como devemos chamar você?"
              />

              <label className="field-label" htmlFor="ra">
                RA / Matrícula institucional
              </label>
              <input
                className="auth-input"
                id="ra"
                required
                value={ra}
                onChange={(e) => setRa(e.target.value)}
                placeholder="Ex.: 1460482213099 ou P-10500"
              />

              {role === "ALUNO" && (
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="field-label" htmlFor="curso">
                      Curso (RF 103)
                    </label>
                    <select
                      id="curso"
                      value={cursoDesc}
                      onChange={(e) => setCursoDesc(e.target.value)}
                      className="auth-input"
                    >
                      {systemCourses.map((c) => (
                        <option key={c.id} value={c.descritivo}>
                          {c.descritivo}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="field-label" htmlFor="semestre">
                      Semestre
                    </label>
                    <select
                      id="semestre"
                      value={semestre}
                      onChange={(e) => setSemestre(Number(e.target.value))}
                      className="auth-input"
                    >
                      {[1, 2, 3, 4, 5, 6].map((sem) => (
                        <option key={sem} value={sem}>
                          {sem}º Semestre
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </>
          )}

          <label className="field-label" htmlFor="email">
            E-mail institucional
          </label>
          <div className="email-input">
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome.sobrenome@fatec.sp.gov.br"
            />
            <span>@</span>
          </div>

          <div className="label-row">
            <label className="field-label" htmlFor="password">
              Senha
            </label>
            {mode === "login" && (
              <button
                type="button"
                onClick={() =>
                  notify("Link de recuperação enviado ao e-mail institucional")
                }
              >
                Esqueci minha senha
              </button>
            )}
          </div>
          <div className="password-input">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha (padrão: 123456)"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ border: 0, background: "none", padding: 0 }}
              aria-label="Alternar visibilidade da senha"
            >
              <Icon name="eye" size={19} />
            </button>
          </div>

          {mode === "login" && (
            <label className="remember">
              <input type="checkbox" defaultChecked />
              Manter conectado neste dispositivo
            </label>
          )}

          <button className="primary full auth-submit" type="submit">
            {mode === "login" ? "Entrar" : "Criar conta e acessar"}
            <Icon name="arrow" size={18} />
          </button>

          <div className="auth-switch">
            <span>
              {mode === "login"
                ? "Ainda não possui uma conta?"
                : "Já possui uma conta?"}
            </span>
            <button
              type="button"
              onClick={() => {
                if (mode === "login") {
                  setMode("signup");
                  setEmail("");
                  setPassword("");
                } else {
                  setMode("login");
                  setEmail("gabriel.lima@fatec.sp.gov.br");
                  setPassword("123456");
                }
              }}
            >
              {mode === "login" ? "Criar conta" : "Entrar"}
            </button>
          </div>

          <small className="privacy">
            Ao continuar, você concorda com os <a href="#">Termos de Uso</a> e a{" "}
            <a href="#">Política de Privacidade</a>.
          </small>
        </form>
      </section>
    </main>
  );
}
