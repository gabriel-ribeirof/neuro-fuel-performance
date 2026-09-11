import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth, type DadosAtleta } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/cadastro")({
  validateSearch: (search: Record<string, unknown>): { pacote?: string } =>
    typeof search["pacote"] === "string" ? { pacote: search["pacote"] as string } : {},
  head: () => ({ meta: [{ title: "Criar conta — Nutrição Neurofuncional iEsports" }] }),
  component: CadastroPage,
});

const CLUBES = [
  "Grêmio",
  "Botafogo",
  "Fluminense",
  "Vasco",
  "Coritiba",
  "Palmeiras",
  "Santos",
  "Bahia",
  "Sport",
  "ABC",
];

function Campo({
  id,
  label,
  type = "text",
  placeholder,
  autoComplete,
  inputMode,
  value,
  onChange,
  required,
}: {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>["inputMode"];
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm text-cocoa">{label}</label>
      <input
        id={id}
        type={type}
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none transition-colors focus:border-camel"
        placeholder={placeholder}
      />
    </div>
  );
}

function CadastroPage() {
  const { cadastrar, carregando, user, perfilNome } = useAuth();
  const navigate = useNavigate();
  const { pacote } = Route.useSearch();
  const logado = !carregando && !!user;

  function seguir() {
    if (pacote) navigate({ to: "/pacotes", search: { pacote } as never, replace: true });
    else navigate({ to: "/area-cliente", replace: true });
  }

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");

  const [atNome, setAtNome] = useState("");
  const [atSobrenome, setAtSobrenome] = useState("");
  const [atIdade, setAtIdade] = useState("");
  const [atClubes, setAtClubes] = useState<string[]>([]);

  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    setSucesso("");

    const idade = Number.parseInt(atIdade, 10);
    if (Number.isNaN(idade) || idade <= 0) {
      setEnviando(false);
      setErro("Informe uma idade válida para o atleta.");
      return;
    }

    const atleta: DadosAtleta = {
      nome: atNome.trim(),
      sobrenome: atSobrenome.trim(),
      idade,
      clube: atClubes.join(", "),
    };

    if (logado && user) {
      const { error } = await supabase.from("atletas").insert({
        user_id: user.id,
        nome: atleta.nome,
        sobrenome: atleta.sobrenome,
        idade: atleta.idade,
        clube: atleta.clube,
        email: null,
        telefone: telefone.trim(),
      });
      setEnviando(false);
      if (error) {
        setErro(error.message);
        return;
      }
      seguir();
      return;
    }

    const resultado = await cadastrar(email.trim(), senha, { nome, telefone }, atleta);

    setEnviando(false);
    if (resultado.erro) {
      setErro(resultado.erro);
      return;
    }

    const { data } = await supabase.auth.getSession();
    if (data.session) {
      seguir();
      return;
    }
    setSucesso("Conta criada! Entre para continuar.");
  }

  if (carregando) {
    return (
      <section className="mx-auto max-w-2xl px-6 py-20">
        <p className="text-sm text-cocoa">Verificando seu acesso…</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl px-6 py-20">
      <p className="eyebrow">{logado ? "Cadastrar atleta" : "Criar conta"}</p>
      <h1 className="mt-4 font-display text-4xl text-espresso">
        {logado ? "Dados do atleta" : "Vamos começar"}
      </h1>
      <p className="mt-3 max-w-xl text-sm text-cocoa">
        {logado
          ? `Olá${perfilNome ? `, ${perfilNome}` : ""}! Sua conta já está criada — informe apenas os dados do atleta para continuar.`
          : "Cadastre os dados do responsável e do atleta. Depois você escolhe o pacote e agenda a avaliação inicial."}
      </p>

      <form onSubmit={onSubmit} className="mt-10 space-y-10">
        {!logado && (
        <fieldset className="space-y-5">
          <legend className="font-display text-xl text-espresso">Responsável</legend>
          <Campo id="nome" label="Nome completo" autoComplete="name" value={nome} onChange={setNome} required />
          <Campo id="telefone" label="Celular (WhatsApp)" type="tel" autoComplete="tel" value={telefone} onChange={setTelefone} required placeholder="(11) 99999-9999" />
          <Campo id="email" label="E-mail" type="email" autoComplete="email" value={email} onChange={setEmail} required placeholder="voce@email.com" />
          <Campo id="senha" label="Senha" type="password" autoComplete="new-password" value={senha} onChange={setSenha} required />
        </fieldset>
        )}

        <fieldset className="space-y-5">
          <legend className="font-display text-xl text-espresso">Atleta</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <Campo id="at-nome" label="Nome" value={atNome} onChange={setAtNome} required />
            <Campo id="at-sobrenome" label="Sobrenome" value={atSobrenome} onChange={setAtSobrenome} required />
          </div>
          <Campo id="at-idade" label="Idade" type="number" inputMode="numeric" value={atIdade} onChange={setAtIdade} required />

          <div>
            <p className="mb-1.5 text-sm text-cocoa">Clube/Time (pode marcar mais de um)</p>
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-card p-4 sm:grid-cols-3">
              {CLUBES.map((clube) => (
                <label key={clube} className="flex items-center gap-2 text-sm text-cocoa">
                  <input
                    type="checkbox"
                    checked={atClubes.includes(clube)}
                    onChange={(e) =>
                      setAtClubes((atual) =>
                        e.target.checked
                          ? [...atual, clube]
                          : atual.filter((c) => c !== clube),
                      )
                    }
                    className="h-4 w-4 accent-camel"
                  />
                  {clube}
                </label>
              ))}
            </div>
          </div>
        </fieldset>

        {erro && (
          <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs text-destructive">{erro}</p>
        )}
        {sucesso && (
          <p className="rounded-xl border border-emerald-600/30 bg-emerald-600/5 px-4 py-3 text-xs text-emerald-800">{sucesso}</p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded-full bg-espresso px-6 py-3.5 text-sm font-medium text-linen transition-colors hover:bg-cocoa disabled:opacity-60"
        >
          {enviando ? "Salvando…" : logado ? "Salvar atleta e continuar" : "Criar conta"}
        </button>
      </form>

      {!logado && (
        <p className="mt-8 text-center text-sm text-cocoa">
          Já tem acesso?{" "}
          <Link to="/login" search={{ pacote } as never} className="text-espresso underline underline-offset-4">
            Entrar
          </Link>
        </p>
      )}
    </section>
  );
}
