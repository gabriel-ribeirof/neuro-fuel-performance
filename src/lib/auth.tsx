import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Papel = "responsavel" | "profissional" | "admin";

export type DadosCadastro = {
  nome: string; // nome do responsável
  telefone: string; // telefone do responsável
};

export type DadosAtleta = {
  nome: string;
  sobrenome: string;
  idade: number;
  clube: string;
};

type AuthContextValue = {
  carregando: boolean;
  user: User | null;
  session: Session | null;
  papel: Papel | null;
  perfilNome: string;
  cadastrar: (
    email: string,
    senha: string,
    dadosCadastro: DadosCadastro,
    atleta: DadosAtleta,
  ) => Promise<{ erro: string | null }>;
  entrar: (email: string, senha: string) => Promise<{ erro: string | null }>;
  sair: () => Promise<void>;
  recarregarPapel: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [papel, setPapel] = useState<Papel | null>(null);
  const [perfilNome, setPerfilNome] = useState("");

  async function lerPapel(userId: string | undefined) {
    if (!userId) {
      setPapel(null);
      setPerfilNome("");
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("role, nome")
      .eq("id", userId)
      .maybeSingle();
    if (data) {
      setPapel((data.role ?? "responsavel") as Papel);
      setPerfilNome(data.nome ?? "");
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCarregando(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, novaSession) => {
      setSession(novaSession);
      if (novaSession) void lerPapel(novaSession.user.id);
      else {
        setPapel(null);
        setPerfilNome("");
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user.id) void lerPapel(session.user.id);
  }, [session?.user.id]);

  async function cadastrar(
    email: string,
    senha: string,
    dadosCadastro: DadosCadastro,
    atleta: DadosAtleta,
  ) {
    // Metadata vai junto no signUp (não usa updateUser), então sobrevive ao
    // modo de confirmação por e-mail e nunca depende de existir sessão.
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: {
          tipo_acesso: "responsavel",
          responsavel: dadosCadastro,
          atleta,
        },
      },
    });

    if (error) return { erro: error.message };
    if (!data.user) return { erro: "Não foi possível criar a conta." };

    // Se o projeto não exige confirmação de e-mail, já temos sessão e podemos
    // materializar profiles/atletas agora. Caso exija, isso ocorre no login.
    await finalizarPerfil(data.user);

    return { erro: null };
  }

  async function entrar(email: string, senha: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) return { erro: error.message };
    if (data.user) await finalizarPerfil(data.user);
    return { erro: null };
  }

  async function sair() {
    await supabase.auth.signOut();
  }

  async function recarregarPapel() {
    const { data } = await supabase.auth.getSession();
    await lerPapel(data.session?.user.id);
  }

  /**
   * Garante que profiles + atletas existam. O signUp do Supabase grava
   * responsavel/atleta em user_metadata; na janela pós-cadastro (com ou sem
   * confirmação de e-mail) materializamos essa metadata nas tabelas. É
   * idempotente — roda de novo a cada login até completar.
   */
  async function finalizarPerfil(user: User) {
    const meta = (user.user_metadata ?? {}) as {
      responsavel?: DadosCadastro;
      atleta?: DadosAtleta;
    };
    if (!meta.responsavel && !meta.atleta) return;

    // 1) profile do responsável
    const { data: perfilExistente } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();
    if (!perfilExistente && meta.responsavel) {
      await supabase.from("profiles").insert({
        id: user.id,
        role: "responsavel",
        nome: meta.responsavel.nome,
        telefone: meta.responsavel.telefone,
      });
    }

    // 2) atleta (um por conta nesse fluxo inicial)
    const { data: atletaExistente } = await supabase
      .from("atletas")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!atletaExistente && meta.atleta) {
      await supabase.from("atletas").insert({
        user_id: user.id,
        nome: meta.atleta.nome,
        sobrenome: meta.atleta.sobrenome,
        idade: meta.atleta.idade,
        clube: meta.atleta.clube,
        email: null,
        telefone: meta.responsavel?.telefone ?? "",
      });
    }
  }

  return (
    <AuthContext.Provider
      value={{
        carregando,
        user: session?.user ?? null,
        session,
        papel,
        perfilNome,
        cadastrar,
        entrar,
        sair,
        recarregarPapel,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}