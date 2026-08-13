# Guia de configuração — Mercado Pago no Nutrição Neurofuncional iEsports

Este guia cobre a ativação **end-to-end** do pagamento online: conta Mercado Pago,
token de acesso, variáveis de ambiente no Lovable Cloud e teste do fluxo completo.

O código já está pronto (build OK). O que falta é **configuração** e **teste real**.

---

## 1. Conta no Mercado Pago

1. Crie a conta em https://www.mercadopago.com.br (pode ser a mesma do negócio).
2. Recomenda-se conta **empresarial** (PJ) — necessária para vender de forma recorrente/com volume.
3. A conta começa em **modo de teste** (sandbox). É por aí que começa o teste.

---

## 2. Credenciais da aplicação

1. Acesse **Seu negócio → Configurações → Suas integrações → Credenciais**.
2. Na aba **Credenciais de produção**, copie:
   - **Access Token** (`APP_USR-...` ou `TEST-...`)
   - **Public Key** (`APP_PUB-...`)
3. Guarde o **Access Token** — é ele que o site usa. A chave pública não é usada pelo checkouro atual.

> Acesse https://www.mercadopago.com.br/developers/panel/app → gere/use uma app de produção.

---

## 3. URL pública do site

O código usa `PUBLIC_SITE_URL` para três coisas:

- **`notification_url`** → webhook que confirma o pagamento (`/webhooks/mercado-pago`)
- **`back_urls`** → páginas de retorno (`/pagamento/sucesso|pendente|falha`)
- Validação de preferência

**Requisitos:**
- deve ser a URL final do site, **sem barra no final**;
- tem que estar **acessível de fora** (o Mercado Pago precisa chamar o webhook);
- domínio final planejado: `https://neuronutricao.iesports.com.br`.

⚠️ Se usar o preview do Lovable, o webhook só funciona enquanto o preview estiver de pé.
**Use o domínio publicado** antes de ativar de verdade.

---

## 4. Variáveis de ambiente no Lovable Cloud

Acesse o painel do projeto no Lovable → **Settings → Secrets/Environment variables**
e adicione:

| Chave | Valor | Obrigatória |
|---|---|---|
| `MERCADO_PAGO_ACCESS_TOKEN` | Access Token da conta Mercado Pago | Sim |
| `PUBLIC_SITE_URL` | `https://neuronutricao.iesports.com.br` | Sim |
| `SUPABASE_URL` | URL do projeto Supabase | Sim |
| `SUPABASE_PUBLISHABLE_KEY` | chave publishable (anônima) do Supabase | Sim |
| `SUPABASE_SERVICE_ROLE_KEY` | chave service role do Supabase (só server) | Sim |
| `WHATSAPP_ENABLED` | `false` (desligado até integrar) | Não |
| `WHATSAPP_API_URL` / `WHATSAPP_API_TOKEN` / `WHATSAPP_PROVIDER` / `WHATSAPP_FROM` | dados do provedor de WhatsApp | Não |

> Em dev local, crie um arquivo `.env` com as mesmas variáveis (o `client.server.ts` e o
> `mercado-pago.server.ts` leem `process.env`). Em desenvolvimento sem env, o Supabase usa um
> fallback placeholder para o build não quebrar — mas **produção exige valores reais**.

---

## 5. Rodar a migração do banco (Supabase)

1. No painel do Supabase → **SQL Editor**.
2. Cole o conteúdo de `supabase/migrations/0001_neurofuncional.sql`.
3. Execute. Isso cria: `profiles`, `atletas`, `contratos`, `agendamentos`, view `horarios_ocupados` + RLS.
4. Confirme que rodou sem erros (o script é idempotente / `if not exists`).

> Sem RLS/migração, o webhook falha ao gravar o contrato como pago.

---

## 6. Teste o fluxo completo (modo de teste)

1. No painel do Mercado Pago, ative o **modo de testes** (usuários de teste).
2. Obtenha cartões de teste em https://www.mercadopago.com.br/developers/panel → **Cartões de teste**
   (ex.: `5031 4332 1540 6351`, qualquer CVV, validade futura).
3. No site publicado:
   - Crie uma conta em `/cadastro` (dados do responsável + atleta).
   - Acesse `/pacotes` e clique em **Escolher este pacote**.
   - Você será redirecionado ao Checkout Pro do Mercado Pago.
   - Pague com o cartão de teste.
4. Verifique:
   - Retorno → `/pagamento/sucesso` (auto_return).
   - Na **área do cliente**, o contrato deve aparecer com status **pago** (poucos segundos após o webhook).
   - No Supabase, `contratos.status = 'pago'` e `mercado_pago_payment_id` preenchido.

---

## 7. Checkpoints de depuração

- **Erro `MERCADO_PAGO_ACCESS_TOKEN não configurado`** → variável de ambiente ausente no Lovable Cloud.
- **Erro `PUBLIC_SITE_URL não configurado`** → defina a URL pública (sem barra final).
- **Pagamento não vira "pago"** → confira: (a) webhook acessível de fora, (b) migração rodada,
  (c) o `listener` do webhook aponta para `/webhooks/mercado-pago`.
- **Retry infinito no webhook** → nosso webhook sempre responde `200`. Se o erro for nosso
  (bug), o Mercado Pago para de reenviar; confira os logs do servidor no Lovable.
- **Cliente vê "pendente" para sempre** → verifique se `notification_url` usa o domínio final
  e se `auto_return` voltou com `status=approved` (log da preferência).

---

## 8. Ir para produção

1. **Saia do modo de teste** na conta Mercado Pago (validação de dados bancários).
2. Atualize `MERCADO_PAGO_ACCESS_TOKEN` com o token **de produção** (`APP_USR-`).
3. Confirme `PUBLIC_SITE_URL` com o domínio final publicado.
4. Faça um pagamento real de baixo valor (pacote Inicial) para validar.
5. Acompanhe os **relatórios de cobrança** no painel do Mercado Pago na data de vencimento.

---

## Fluxo técnico (resumo)

```
/pacotes → criarContratoEIniciarPagamento (server fn)
   ├── cria contrato "pendente" no Supabase (RLS do responsável)
   ├── cria preferência no Checkout Pro (X-Idempotency-Key = contrato.id)
   └── redireciona para init_point

Checkout Pro (mercado-pago.com.br)
   └── webhook notification_url → /webhooks/mercado-pago
          └── buscarPagamento (status real via API, nunca confia no body)
          └── se approved → contratos.status = 'pago' (só de "pendente", idempotente)
          └── envia confirmação de WhatsApp (se WHATSAPP_ENABLED)

back_urls → /pagamento/sucesso|pendente|falha (UX; status real vem do banco)
```

---

## Pendências que não dependem desta configuração

- **WhatsApp**: integração em `src/lib/whatsapp.server.ts` está pronta, mas **sem provider real**
  (Z-API/WABA). Enquanto `WHATSAPP_ENABLED` não estiver com credenciais, roda em modo silencioso.
- **Supabase**: só fica 100% validado quando conectado no Lovable + migração rodada.
- **Auth middleware**: `auth-middleware.server.ts` valida Bearer via `getClaims(token)` —
  se apontar incompatibilidade na API do supabase-js, trocar para `getUser(token)` (por fazer).