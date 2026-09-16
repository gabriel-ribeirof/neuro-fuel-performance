ALTER TABLE public.agendamentos DROP CONSTRAINT IF EXISTS agendamentos_status_check;
ALTER TABLE public.agendamentos ADD CONSTRAINT agendamentos_status_check
  CHECK (status = ANY (ARRAY['agendado'::text,'confirmado'::text,'cancelado'::text,'realizado'::text,'aguardando_pagamento'::text]));

CREATE OR REPLACE FUNCTION public.is_equipe(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = _user_id AND p.role IN ('profissional','admin')
  )
$$;

CREATE TABLE public.registros_clinicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  atleta_id uuid NOT NULL REFERENCES public.atletas(id) ON DELETE CASCADE,
  autor_id uuid NOT NULL REFERENCES auth.users(id),
  tipo text NOT NULL DEFAULT 'prontuario' CHECK (tipo = ANY (ARRAY['anamnese','relatorio','prontuario','exame','evolucao'])),
  titulo text NOT NULL,
  conteudo text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.registros_clinicos TO authenticated;
GRANT ALL ON public.registros_clinicos TO service_role;

ALTER TABLE public.registros_clinicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "equipe gerencia registros clinicos"
ON public.registros_clinicos FOR ALL TO authenticated
USING (public.is_equipe(auth.uid()))
WITH CHECK (public.is_equipe(auth.uid()));

CREATE POLICY "responsavel ve registros do proprio atleta"
ON public.registros_clinicos FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.atletas a WHERE a.id = registros_clinicos.atleta_id AND a.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_registros_clinicos_updated_at
BEFORE UPDATE ON public.registros_clinicos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();