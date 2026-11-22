"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Brand from "@/components/Brand";
import { Icon } from "@/components/Icon";
import { useApp } from "@/context/AppContext";
import { systemCourses, type UserRole } from "@/data/mockData";

export default function RegistroPage() {
  const router = useRouter();
  const { registerUser, notify } = useApp();

  const [role, setRole] = useState<UserRole>("ALUNO");
  const [nome, setNome] = useState("");
  const [ra, setRa] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cursoDesc, setCursoDesc] = useState("DSM");
  const [semestre, setSemestre] = useState(1);
  const [showPassword, setShowPassword] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

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
            Cadastre-se com seu vínculo institucional para reservar salas e
            laboratórios da Fatec Jahu.
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
          <span className="eyebrow">NOVO CADASTRO</span>
          <h2>Crie sua conta</h2>
          <p>
            Selecione seu perfil e preencha seus dados institucionais da Fatec.
          </p>

          <label className="field-label">Eu sou</label>
          <div className="role-selector">
            {(["ALUNO", "PROFESSOR", "GESTOR"] as UserRole[]).map((item) => (
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
            ))}
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
          </div>
          <div className="password-input">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Crie uma senha de acesso"
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

          <button className="primary full auth-submit" type="submit">
            Criar conta e acessar
            <Icon name="arrow" size={18} />
          </button>

          <div className="auth-switch">
            <span>Já possui conta?</span>
            <Link
              href="/login"
              className="font-extrabold text-[#b20d19] hover:underline"
            >
              Entrar
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
