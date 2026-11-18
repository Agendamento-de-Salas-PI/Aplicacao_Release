import { ArrowLeft, UserRound, EyeOff, Eye, ChevronRight, MapPin } from "lucide-react";
import { useState } from "react";
import Brand from "./Brand";

export default function LoginScreen() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState("Aluno");
  const [showPassword, setShowPassword] = useState(false);
  return (
    <main className="grid min-h-[calc(100vh-72px)] lg:grid-cols-[minmax(360px,0.82fr)_1.18fr]">
      <section className="flex items-center justify-center bg-white px-5 py-10 sm:px-10">
        <div className="w-full max-w-[430px]">
          <button
            type="button"
            className="mb-10 flex items-center gap-2 text-xs font-bold text-[#606469] hover:text-[#b20000]"
          >
            <ArrowLeft size={16} /> Voltar ao agendamento
          </button>
          <p className="label">
            {mode === "login" ? "Bem-vindo de volta" : "Novo acesso institucional"}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
            {mode === "login" ? "Acesse sua conta" : "Crie sua conta"}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#666a6e]">
            {mode === "login"
              ? "Use suas credenciais institucionais para continuar."
              : "Selecione seu perfil e informe seus dados da FATEC."}
          </p>
          {mode === "register" && (
            <div className="mt-7">
              <span className="field-label">Qual é o seu perfil?</span>
              <div className="grid grid-cols-3 gap-2">
                {["Aluno", "Professor", "Gestor"].map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() => setRole(item)}
                    className={`border px-2 py-3 text-xs font-extrabold ${role === item ? "border-[#b20000] bg-[#fff2f2] text-[#990000]" : "border-[#d5d7d9] text-[#666a6e]"}`}
                  >
                    <UserRound size={17} className="mx-auto mb-1.5" />
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
          <form className="mt-7 space-y-5" onSubmit={(e) => e.preventDefault()}>
            {mode === "register" && (
              <div>
                <label className="field-label" htmlFor="name">
                  Nome completo
                </label>
                <input
                  id="name"
                  className="text-field"
                  placeholder="Como consta no sistema acadêmico"
                />
              </div>
            )}
            <div>
              <label className="field-label" htmlFor="email">
                E-mail institucional
              </label>
              <input
                id="email"
                type="email"
                className="text-field"
                placeholder="seu.nome@fatec.sp.gov.br"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="field-label" htmlFor="password">
                  Senha
                </label>
                {mode === "login" && (
                  <button type="button" className="mb-2 text-xs font-bold text-[#990000]">
                    Esqueci minha senha
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="text-field pr-12"
                  placeholder="Digite sua senha"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666a6e]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {mode === "register" && (
              <div>
                <label className="field-label" htmlFor="ra">
                  {role === "Aluno" ? "RA do aluno" : "Matrícula funcional"}
                </label>
                <input
                  id="ra"
                  className="text-field"
                  placeholder={role === "Aluno" ? "Ex.: 123456789" : "Ex.: FJ-00428"}
                />
              </div>
            )}
            <button type="submit" className="btn-primary w-full py-3.5 text-sm">
              {mode === "login" ? "Entrar" : "Criar conta"} <ChevronRight size={17} />
            </button>
          </form>
          <div className="mt-7 border-t border-[#e1e2e3] pt-6 text-center text-sm text-[#666a6e]">
            {mode === "login" ? "Ainda não tem uma conta?" : "Já possui uma conta?"}
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="ml-2 font-extrabold text-[#990000] underline decoration-[#d9aaaa] underline-offset-4"
            >
              {mode === "login" ? "Criar conta" : "Entrar"}
            </button>
          </div>
        </div>
      </section>
      <section className="relative hidden overflow-hidden bg-[#26292d] lg:block">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full border-[72px] border-[#b20000] opacity-90" />
        <div className="absolute bottom-[-180px] left-[-120px] h-[480px] w-[480px] rounded-full border-[90px] border-white/5" />
        <div className="relative flex h-full flex-col justify-between p-14 xl:p-20">
          <Brand />
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 border border-white/20 bg-white/5 px-3 py-2 text-xs font-bold text-white">
              <MapPin size={15} className="text-[#ef6b6b]" /> Campus Jahu
            </span>
            <h2 className="mt-7 text-5xl font-black leading-[1.05] tracking-[-0.05em] text-white xl:text-6xl">
              Seu espaço de estudo, no tempo certo.
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-white/65">
              Encontre ambientes, confira equipamentos e solicite sua sala em poucos minutos.
            </p>
          </div>
          <p className="text-xs font-semibold text-white/40">
            Centro Paula Souza · Faculdade de Tecnologia de Jahu
          </p>
        </div>
      </section>
    </main>
  );
}