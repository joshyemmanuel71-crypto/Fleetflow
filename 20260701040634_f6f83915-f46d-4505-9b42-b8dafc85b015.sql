
CREATE POLICY "Ops update profiles"
ON public.profiles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'ops'))
WITH CHECK (public.has_role(auth.uid(), 'ops'));
