
CREATE OR REPLACE FUNCTION public.accept_invitation()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller_id uuid := auth.uid();
  _caller_email text := auth.jwt() ->> 'email';
  _invitation RECORD;
BEGIN
  IF _caller_id IS NULL OR _caller_email IS NULL THEN
    RETURN;
  END IF;

  SELECT * INTO _invitation
  FROM public.user_invitations
  WHERE email = _caller_email AND status = 'pending';

  IF NOT FOUND THEN RETURN; END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_caller_id, _invitation.role)
  ON CONFLICT DO NOTHING;

  UPDATE public.user_invitations
  SET status = 'accepted', accepted_at = now()
  WHERE email = _caller_email;
END;
$$;
