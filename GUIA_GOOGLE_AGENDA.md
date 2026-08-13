# Guia de integração — Google Agenda (Google Calendar)

Objetivo: quando uma sessão é marcada no app (anamnese Amanda/Letícia, ou
remarcação pelo admin), um **evento criado automaticamente no Google Agenda
da profissional responsável** — Amanda, Manuela, Letícia e Gabriel.

Fluxo no código:
- `src/lib/agendamentos.server.ts` → `agendarAnamnese` cria as sessões (Amanda + Letícia)
- `src/lib/admin.server.ts` → remarcação/sessão
- **Novo**: `src/lib/google-calendar.server.ts` → cria/remove evento no Google Agenda
  de cada profissional, usando a **Service Account** do Google Cloud.

---

## Modelo escolhido: Service Account (recomendado)

O servidor (Lovable Cloud) usa uma **Service Account** do Google Cloud. Ela ganha
acesso de escrita no calendário de cada profissional (Amanda, Manuela, Letícia,
Gabriel) por **compartilhamento de agenda**. Assim:

- cada profissional mantém a **agenda própria** (Google Agenda pessoal);
- a Service Account cria eventos como se fosse ela, mas dentro do calendário
  compartilhado;
- não precisa de OAuth de cada pessoa nem de refresh token.

> Alternativa: OAuth 2.0 por usuário (cada um autoriza o app). Mais invasivo e
> com expiração de token — só use se a Service Account não servir.

---

## Passo a passo (Google Cloud)

### 1. Criar projeto e habilitar a API

1. Acesse https://console.cloud.google.com (login com a conta Google do Gabriel/da Amanda — a "dona" do negócio).
2. Crie um projeto novo: **Selecionar projeto → Novo Projeto** → nome: `neuro-iesports` → **Criar**.
3. Ative a **Google Calendar API**:
   - Menu **APIs & Services → Library**.
   - Busque **Google Calendar API** → **Enable**.

### 2. Criar a Service Account

1. Menu **APIs & Services → Credentials** → **+ Criar credenciais → Conta de serviço**.
2. Nome: `neuro-agenda-sa` → **Criar e continuar** (pode pular papéis e criar).
3. Anote o **e-mail da service account** (formato `neuro-agenda-sa@...gserviceaccount.com`).

### 3. Baixar a chave (JSON)

1. Na lista de contas de serviço → clique na `neuro-agenda-sa` → aba **Chaves** → **Adicionar chave → Criar nova chave**.
2. Tipo **JSON** → **Criar** → baixa um arquivo `.json`.
3. **Nunca suba esse arquivo pro repositório.** Guarde o conteúdo (tem `client_email` e `private_key`).

### 4. Compartilhar as agendas com a Service Account

Para CADA profissional (Amanda, Manuela, Letícia, Gabriel):

1. Abra **Google Agenda** (calendar.google.com) logado com a conta da pessoa.
2. No calendário a usar (normalmente o principal, com o e-mail dela) →
   **Configurações e compartilhamento** (engrenagem → Configurações → agenda).
3. Em **Compartilhar com pessoas específicas** → **Adicionar pessoas**.
4. Cole o **e-mail da service account** (`neuro-agenda-sa@...gserviceaccount.com`).
5. Permissão: **"Fazer alterações nos eventos"** → **Enviar**.

Repita para os 4 profissionais. Cada um compartilha **a própria agenda** com a mesma
Service Account.

> Anote o **ID da agenda** de cada um = o e-mail da conta Google da pessoa
> (ex.: `amanda@dominio.com.br`). É o `calendarId` que o servidor usa.

---

## Variáveis de ambiente (Lovable Cloud → Secrets)

| Chave | Valor |
|---|---|
| `GOOGLE_CALENDAR_CLIENT_EMAIL` | `client_email` do JSON da Service Account |
| `GOOGLE_CALENDAR_PRIVATE_KEY` | `private_key` do JSON (em uma linha, entre aspas) |
| `GOOGLE_CALENDAR_AMANDA` | e-mail da agenda da Amanda |
| `GOOGLE_CALENDAR_MANUELA` | e-mail da agenda da Manuela |
| `GOOGLE_CALENDAR_LETICIA` | e-mail da agenda da Letícia |
| `GOOGLE_CALENDAR_GABRIEL` | e-mail da agenda do Gabriel |

> Sem essas variáveis, o site funciona normalmente — só **não cria evento no
> Google Agenda** (modo silencioso, igual ao WhatsApp). Assim não derruba o
> agendamento se faltar config.

---

## O que o código vai fazer (a implementar)

Em `src/lib/google-calendar.server.ts`:

```ts
// Pseudo-código (implementação real em breve)
import { google } from "googleapis";

export async function criarEventoGoogleAgenda(params: {
  profissionalSlug: string; // amanda | manuela | leticia | gabriel
  titulo: string;
  data: string;       // YYYY-MM-DD
  inicio: string;     // HH:MM
  duracaoMin: number;
}) {
  const emailAgenda = calendarEmail(params.profissionalSlug);
  if (!emailAgenda) return; // sem config → silencioso

  const auth = new google.auth.JWT(
    process.env.GOOGLE_CALENDAR_CLIENT_EMAIL,
    undefined,
    process.env.GOOGLE_CALENDAR_PRIVATE_KEY,
    ["https://www.googleapis.com/auth/calendar"],
  );

  await google.calendar("v3").events.insert({
    auth,
    calendarId: emailAgenda,
    requestBody: {
      summary: params.titulo,
      start: { dateTime: `${params.data}T${params.inicio}:00-03:00` },
      end: { dateTime: ... },
    },
  });
}
```

**Pontos de chamada (a implementar):**
- `agendarAnamnese` → chama `criarEventoGoogleAgenda` para Amanda e para Letícia.
- `admin.server.ts` (remarcação) → remove evento antigo + cria evento na nova data.
- (Opcional) cancelamento → deleta evento.

---

## Testar

1. Depois de configurar as secrets, agende uma anamnese no site (pacote pago).
2. Confira no Google Agenda da Amanda e da Letícia se o evento apareceu
   (pode levar alguns segundos).
3. Remarque pelo admin e veja o evento mudar de data.

---

## Falhas comuns

| Problema | Causa |
|---|---|
| Evento não cria | Secrets ausentes, ou agenda não compartilhada com a SA |
| Erro de permissão (403) | A conta do calendário não compartilhou com a SA, ou permissão ≠ "Fazer alterações nos eventos" |
| Erro de chave privada | `GOOGLE_CALENDAR_PRIVATE_KEY` quebrado em várias linhas — precisa vir em uma linha |
| `client_email` não encontrado | Chave JSON errada ou projecto errado |

---

## Dependência

Vou adicionar `googleapis` ao `package.json` (só server-side). Nada disso afeta o
bundle do cliente.
