-- Adiciona 'aguardando_pagamento' ao CHECK constraint de status dos agendamentos.
-- O fluxo novo reserva o horário antes do pagamento; só vira "confirmado" quando
-- o webhook do Mercado Pago confirma.

ALTER TABLE public.agendamentos
  DROP CONSTRAINT IF EXISTS agendamentos_status_check;

ALTER TABLE public.agendamentos
  ADD CONSTRAINT agendamentos_status_check
  CHECK (status IN ('agendado', 'confirmado', 'cancelado', 'realizado', 'aguardando_pagamento'));

-- Recria a view horarios_ocupados (foi dropada numa migration anterior) incluindo
-- 'aguardando_pagamento' pra evitar dupla reserva.
CREATE OR REPLACE VIEW public.horarios_ocupados AS
  SELECT data, horario, duracao_min, profissional_slug
  FROM public.agendamentos
  WHERE status IN ('agendado', 'confirmado', 'aguardando_pagamento');

GRANT SELECT ON public.horarios_ocupados TO authenticated;
