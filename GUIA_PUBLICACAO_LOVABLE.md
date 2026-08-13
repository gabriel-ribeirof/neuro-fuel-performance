# Guia de publicação — Publicar o site no Lovable Cloud

Passo a passo completo do zero até o site no ar com cadastro, pagamento
(Mercado Pago) e agendamento funcionando.

> Pré-requisito: o código já está no GitHub
> (`gabriel-ribeirof/neuro-fuel-performance`, branch `main`, commit `3cc6187`).
> Qualquer alteração de código precisa ser commitada e empurrada (`git push origin main`)
> — o Lovable sincroniza sozinho pelo repositório.

---

## Etapa 1 — Projeto conectado no Lovable

Se o projeto ainda não estiver conectado ao repositório:

1. Acesse https://lovable.dev e abra o projeto (ou crie um novo).
2. No painel do projeto, conecte o **repositório GitHub** `gabriel-ribeirof/neuro-fuel-performance`.
3. Autorize o Lovable a acessar a conta do **Gabriel** (a que tem permissão no repo).
4. Aguarde o Lovable sincronizar/rebuildar o código do `main`.

O site deve abrir no **preview** do Lovable. Se o preview falhar no build, avise o
desenvolvedor — mas o build local passou (commit `3cc6187`).

---

## Etapa 2 — Conectar Supabase no Lovable

O site usa Supabase para: login, contratos, agendamentos, admin.

1. No painel do projeto no Lovable, vá em **Settings → Supabase** (ou "Data").
2. Clique em **Connect** e siga o fluxo para criar/vincular um projeto Supabase.
   - Se preferir usar um Supabase já existente, use **"Connect to existing project"**
     e cole a URL e as chaves (abas abaixo).
3. O Lovable grava automaticamente as variáveis:
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY` (chave anônima)
   - `SUPABASE_SERVICE_ROLE_KEY` (service role — server only)

> Sem isso, qualquer página que consulta banco quebra em runtime (cadastro, pacotes,
> agendamento, área do cliente, profissional, admin).

---

## Etapa 3 — Rodar a migração do banco (Supabase)

O schema está no arquivo `supabase/migrations/0001_neurofuncional.sql` (no repo).

1. No painel do **Supabase** (supabase.com) → projeto conectado → **SQL Editor**.
2. Crie um *New query*, cole o conteúdo do arquivo e clique em **Run**.
3. Confirme na lateral **Tables** que apareceram: `profiles`, `atletas`, `contratos`,
   `agendamentos` + a view `horarios_ocupados`.

> O script é idempotente (`if not exists`) — pode rodar de novo sem quebrar.

---

## Etapa 4 — Criar usuário Admin e Profissional

O site não tem tela de cadastro admin. Crie os acessos assim:

1. Acesse o site publicado → `/cadastro` e crie uma conta normal (ex.: do Gabriel).
2. No **Supabase → Authentication → Users**, copie o **UUID** desse usuário.
3. No **Supabase → SQL Editor**, rode:

```sql
update public.profiles set role = 'admin' where id = '<UUID-DO-USER>';
```

4. Para profissionais (Amanda, Letícia, Manuela, Gabriel), crie contas da mesma
   forma e rode:

```sql
-- amanda = Amanda (Neuronutri), leticia = Letícia (Nutri esportiva)
-- manuela = Manuela, gabriel = Gabriel (Auxiliar)
update public.profiles
set role = 'profissional', profissional_slug = 'amanda'
where id = '<UUID-DO-PROFISSIONAL>';
```

> Sem papel `admin`/`profissional` no banco, as páginas `/admin` e `/profissional`
> aparecem mas ficam vazias/sem permissão.

---

## Etapa 5 — Secrets do Mercado Pago

1. Crie a conta Mercado Pago em https://www.mercadopago.com.br (recomendado: PJ).
2. Acesse **Seu negócio → Configurações → Suas integrações → Credenciais**.
3. Copie o **Access Token**.
4. No Lovable → **Settings → Secrets/Environment variables**, adicione:

| Chave | Valor |
|---|---|
| `MERCADO_PAGO_ACCESS_TOKEN` | Access Token do Mercado Pago |
| `PUBLIC_SITE_URL` | URL final do site (ex.: `https://neuronutricao.iesports.com.br`), **sem barra no final** |

> `PUBLIC_SITE_URL` é usada para o webhook de pagamento e as páginas de retorno.
> Tem que ser o **domínio publicado** — o preview do Lovable muda a cada build.

5. (Opcional) WhatsApp — só liga se quiser notificação automática:

| Chave | Valor |
|---|---|
| `WHATSAPP_ENABLED` | `1` (liga) |
| `WHATSAPP_PROVIDER` | `z-api` |
| `WHATSAPP_API_URL` | URL base do provedor |
| `WHATSAPP_API_TOKEN` | token do provedor |
| `WHATSAPP_FROM` | número remetente (ex.: `5511987654321`) |

> Sem as variáveis de WhatsApp, o site funciona normalmente — só não envia
> mensagem (modo silencioso).

---

## Etapa 6 — Publicar

1. No painel do Lovable → **Publish/Deploy** → configure o **domínio final**
   (ex.: `neuronutricao.iesports.com.br`) e publique.
2. Aguarde o deploy terminar e abra o site no domínio definitivo.

> Guarde a URL publicada — ela vira o `PUBLIC_SITE_URL`.

---

## Etapa 7 — Testar o fluxo completo

Teste no **domínio final** (não no preview), logado como conta normal:

1. `/cadastro` → crie conta (responsável + atleta).
2. `/pacotes` → escolha um pacote → será redirecionado ao Checkout Pro do MP.
   - Em modo de teste, pague com cartão de teste
     (`5031 4332 1540 6351`, qualquer CVV, validade futura).
3. Verifique o retorno `/pagamento/sucesso`.
4. Na `/area-cliente`, o contrato deve aparecer como **pago** em segundos
   (confirmação via webhook).
5. `/agendamento` → marque Amanda, depois Letícia na mesma semana → assine o termo.
6. Confira em `/profissional` (logado como Amanda/Letícia) e `/admin` (logado como
   admin) se as sessões aparecem.

---

## Etapa 8 — Ir para produção (Mercado Pago)

1. No painel do Mercado Pago, saia do **modo de teste** e valide a conta
   (dados bancários/docusign).
2. Substitua `MERCADO_PAGO_ACCESS_TOKEN` pelo token **de produção** (começa com `APP_USR-`).
3. Faça um pagamento real de baixo valor (pacote Inicial) para validar.
4. Acompanhe os relatórios no painel do Mercado Pago.

---

## Resumo visual

```
Código (main) ──push──▶ Lovable Cloud ──► build/deploy
                              │
                              ├─► Supabase (conectar + migração SQL)
                              ├─► Secrets (MP token, site URL, [WhatsApp])
                              └─► Publish (domínio final)
```

---

## Se algo quebrar

| Sintoma | Causa provável |
|---|---|
| Preview/build falha | Código local não sincronizado — rode `git push origin main` |
| Página de banco quebra | Supabase não conectado ou migração não rodada |
| `/admin` vazia | Papel `admin` não atribuído no `profiles` |
| Pagamento não vira "pago" | `PUBLIC_SITE_URL` não é o domínio publicado / webhook fora do ar |
| Erro `Missing Supabase environment variable(s)` | Supabase não conectado no Lovable |
| Erro `MERCADO_PAGO_ACCESS_TOKEN não configurado` | Secret ausente |
