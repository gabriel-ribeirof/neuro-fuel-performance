// Server functions do painel administrativo e da agenda dos profissionais.
import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/integrations/supabase/auth-middleware.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { nomeProfissional, type ProfissionalSlug } from "@/lib/negocio";

async function lerPerfilSeguro(userId: string) {
  const db = await supabaseAdmin;
  const { data } = await db
    .from("profiles")
    .select("role, profissional_slug")
    .eq("id", userId)
    .maybeSingle();
  return data;
}

/** Exige admin. */
async function exigirAdmin(userId: string) {
  const perfil = await lerPerfilSeguro(userId);
  if (perfil?.role !== "admin") throw new Error("Acesso restrito ao painel administrativo.");
  return perfil;
}

/** Exige profissional (ou admin). */
async function exigirProfissional(userId: string) {
  const perfil = await lerPerfilSeguro(userId);
  if (!perfil || (perfil.role !== "profissional" && perfil.role !== "admin")) {
    throw new Error("Acesso restrito aos profissionais.");
  }
  return perfil;
}

/** Agenda do profissional logado (só as sessões com ele/ela). */
export const listarMinhaAgenda = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const perfil = await exigirProfissional(context.userId);
    const db = await supabaseAdmin;

    const { data: agendamentos } = await db
      .from("agendamentos")
      .select(
        "id, contrato_id, atleta_id, tipo_sessao, data, horario, duracao_min, status, profissional_slug",
      )
      .eq("profissional_slug", perfil.profissional_slug ?? "amanda")
      .order("data", { ascending: true });

    const nomes = new Map<string, string>();
    for (const a of agendamentos ?? []) {
      if (!nomes.has(a.atleta_id)) {
        const { data: atl } = await db
          .from("atletas")
          .select("nome, sobrenome")
          .eq("id", a.atleta_id)
          .maybeSingle();
        if (atl) nomes.set(a.atleta_id, `${atl.nome} ${atl.sobrenome}`);
      }
    }

    return (agendamentos ?? []).map((a) => ({
      id: a.id,
      tipoSessao: a.tipo_sessao,
      data: a.data,
      horario: a.horario,
      duracaoMin: a.duracao_min,
      status: a.status,
      atletaNome: nomes.get(a.atleta_id) ?? "—",
    }));
  });

/** Painel admin: resumo de tudo. */
export const listarVisaoAdmin = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    await exigirAdmin(context.userId);
    const db = await supabaseAdmin;

    const [{ data: contratos }, { data: agendamentos }, { data: atletas }] = await Promise.all([
      db
        .from("contratos")
        .select("id, user_id, atleta_id, pacote_slug, valor_centavos, status, created_at"),
      db
        .from("agendamentos")
        .select("id, atleta_id, profissional_slug, tipo_sessao, data, horario, status")
        .order("data", { ascending: true }),
      db.from("atletas").select("id, nome, sobrenome, idade, clube, telefone, user_id"),
    ]);

    const nomes = new Map<string, string>();
    for (const a of atletas ?? []) nomes.set(a.id, `${a.nome} ${a.sobrenome}`);
    const emails = new Map<string, string>();
    for (const c of contratos ?? []) {
      if (!emails.has(c.user_id)) {
        const { data: ud } = await db.auth.admin.getUserById(c.user_id);
        emails.set(c.user_id, ud?.user?.email ?? "");
      }
    }

    return {
      contratos: (contratos ?? []).map((c) => ({
        id: c.id,
        pacoteSlug: c.pacote_slug,
        valorCentavos: c.valor_centavos,
        status: c.status,
        createdAt: c.created_at,
        atletaNome: nomes.get(c.atleta_id) ?? "—",
        responsavelEmail: emails.get(c.user_id) ?? "",
      })),
      agendamentos: (agendamentos ?? []).map((a) => ({
        id: a.id,
        atletaNome: nomes.get(a.atleta_id) ?? "—",
        profissional: a.profissional_slug,
        tipoSessao: a.tipo_sessao,
        data: a.data,
        horario: a.horario,
        status: a.status,
      })),
      atletas: (atletas ?? []).map((a) => ({
        id: a.id,
        nome: nomes.get(a.id) ?? "—",
        idade: a.idade,
        clube: a.clube,
        telefone: a.telefone,
      })),
    };
  });

export const atualizarSessaoAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator(
    (dado: {
      agendamentoId: string;
      acao: "cancelar" | "remarcar";
      novaData?: string;
      novoHorario?: string;
    }) => dado,
  )
  .handler(async ({ data, context }) => {
    await exigirAdmin(context.userId);
    const db = await supabaseAdmin;

    if (data.acao === "cancelar") {
      const { error } = await db
        .from("agendamentos")
        .update({ status: "cancelado" })
        .eq("id", data.agendamentoId);
      if (error) throw new Error(error.message);
      return { ok: true };
    }

    if (data.acao === "remarcar") {
      if (!data.novaData || !data.novoHorario) {
        throw new Error("Data e horário são obrigatórios para remarcar.");
      }
      const { error: erroData } = await db
        .from("agendamentos")
        .update({ data: data.novaData, horario: data.novoHorario, status: "agendado" })
        .eq("id", data.agendamentoId);
      if (erroData) throw new Error(erroData.message);
      return { ok: true };
    }

    throw new Error("Ação desconhecida.");
  });

export const trocarStatusSessaoProfissional = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((dado: { agendamentoId: string; status: "realizado" | "cancelado" }) => dado)
  .handler(async ({ data, context }) => {
    // Profissional só mexe na própria sessão.
    const perfil = await exigirProfissional(context.userId);
    const db = await supabaseAdmin;
    const { data: sessao } = await db
      .from("agendamentos")
      .select("profissional_slug")
      .eq("id", data.agendamentoId)
      .maybeSingle();
    if (!sessao || sessao.profissional_slug !== perfil.profissional_slug) {
      throw new Error("Sessão não pertence ao seu consultório.");
    }
    const { error } = await db
      .from("agendamentos")
      .update({ status: data.status })
      .eq("id", data.agendamentoId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Pacientes do consultório: atletas com contrato (exclui cancelados). */
export const listarPacientesProfissional = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const perfil = await exigirProfissional(context.userId);
    const db = await supabaseAdmin;

    const { data: contratos } = await db
      .from("contratos")
      .select("id, atleta_id, pacote_slug, status, user_id")
      .neq("status", "cancelado")
      .order("created_at", { ascending: false });

    const nomes = new Map<string, string>();
    const emails = new Map<string, string>();
    for (const c of contratos ?? []) {
      if (!nomes.has(c.atleta_id)) {
        const { data: atl } = await db
          .from("atletas")
          .select("nome, sobrenome")
          .eq("id", c.atleta_id)
          .maybeSingle();
        if (atl) nomes.set(c.atleta_id, `${atl.nome} ${atl.sobrenome}`);
      }
      if (!emails.has(c.user_id)) {
        const { data: ud } = await db.auth.admin.getUserById(c.user_id);
        emails.set(c.user_id, ud?.user?.email ?? "");
      }
    }

    return {
      profissionalSlug: perfil.profissional_slug ?? "amanda",
      pacientes: (contratos ?? []).map((c) => ({
        email: emails.get(c.user_id) ?? "",
        atletaNome: nomes.get(c.atleta_id) ?? "Atleta",
        pacoteSlug: c.pacote_slug,
        status: c.status,
      })),
    };
  });

/** Profissional marca um retorno com horário no próprio consultório. */
export const criarRetornoProfissional = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((dado: { email: string; tipoSessao: string; data: string; horario: string }) => dado)
  .handler(async ({ data, context }) => {
    const perfil = await exigirProfissional(context.userId);
    const slug = perfil.profissional_slug ?? "amanda";
    const db = await supabaseAdmin;

    const email = data.email.trim().toLowerCase();
    if (!email) throw new Error("Informe o e-mail do cliente.");

    const { data: usuarios } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const usuario = usuarios?.users?.find((u) => u.email?.toLowerCase() === email);
    if (!usuario) throw new Error("Nenhum cliente cadastrado com esse e-mail.");

    const { data: contrato } = await db
      .from("contratos")
      .select("id, atleta_id, status")
      .eq("user_id", usuario.id)
      .neq("status", "cancelado")
      .order("created_at", { ascending: false })
      .maybeSingle();
    if (!contrato) throw new Error("Esse cliente ainda não tem contrato ativo.");

    // Slot ocupado? (mesmo profissional, mesma data e horário)
    const { data: ocupados } = await db
      .from("agendamentos")
      .select("id")
      .eq("data", data.data)
      .eq("horario", data.horario)
      .eq("profissional_slug", slug)
      .in("status", ["agendado", "confirmado"]);
    if (ocupados && ocupados.length > 0) {
      throw new Error("Esse horário já está reservado. Escolha outro.");
    }

    const { error } = await db.from("agendamentos").insert({
      contrato_id: contrato.id,
      atleta_id: contrato.atleta_id,
      profissional_slug: slug,
      tipo_sessao: data.tipoSessao,
      data: data.data,
      horario: data.horario,
      duracao_min: 60,
      status: "agendado",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
