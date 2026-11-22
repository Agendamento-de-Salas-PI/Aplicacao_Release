"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Brand from "@/components/Brand";
import { Icon } from "@/components/Icon";
import { useApp } from "@/context/AppContext";
import { defaultAccounts } from "@/data/mockData";

export default function LoginPage() {
  const router = useRouter();
  const {
    loginWithCredentials,
    setUser,
    notify,
  } = useApp();

  // Campos controlados
  const [email, setEmail] = useState("gabriel.lima@fatec.sp.gov.br");
  const [password, setPassword] = useState("123456");
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

    const authenticated = loginWithCredentials(email, password);
    if (!authenticated) {
      notify("E-mail ou senha inválidos. Verifique suas credenciais.");
      return;
    }
    notify(`Bem-vindo(a), ${authenticated.nome} (${authenticated.tipoUsuario})!`);
    router.push("/");
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
          <span className="eyebrow">BEM-VINDO DE VOLTA</span>
          <h2>Acesse sua conta</h2>
          <p>
            Utilize uma das 3 contas padrões para demonstração rápida ou entre com seu e-mail institucional.
          </p>

          {/* 3 Contas Padrões Pré-Configuradas (Meta 4) */}
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
            <button
              type="button"
              onClick={() =>
                notify("Link de recuperação enviado ao e-mail institucional")
              }
            >
              Esqueci minha senha
            </button>
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

          <label className="remember">
            <input type="checkbox" defaultChecked />
            Manter conectado neste dispositivo
          </label>

          <button className="primary full auth-submit" type="submit">
            Entrar
            <Icon name="arrow" size={18} />
          </button>

          <div className="auth-switch">
            <span>Não tem conta?</span>
            <Link
              href="/registro"
              className="font-extrabold text-[#b20d19] hover:underline"
            >
              Cadastre-se
            </Link>
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
