DROP POLICY "equipe gerencia registros clinicos" ON public.registros_clinicos;

CREATE POLICY "equipe gerencia registros clinicos"
ON public.registros_clinicos FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('profissional','admin')))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('profissional','admin')));

DROP FUNCTION IF EXISTS public.is_equipe(uuid);