

# Fix: accept_invitation RPC Privilege Escalation

## Problem

The `accept_invitation(_user_id uuid, _email text)` function takes both user ID and email as client-provided parameters. Any authenticated user can call it with an arbitrary email to claim someone else's invitation and gain their role (including admin).

## Solution

### 1. Database migration — Replace the RPC function

Remove parameters entirely; derive identity from the JWT:

```sql
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
```

### 2. Update `src/contexts/AuthContext.tsx`

Change the RPC call from:
```typescript
await supabase.rpc("accept_invitation", { _user_id: userId, _email: userEmail });
```
to:
```typescript
await supabase.rpc("accept_invitation");
```

### Files modified
| File | Change |
|------|--------|
| Migration SQL | Replace `accept_invitation` function (no params, reads JWT) |
| `src/contexts/AuthContext.tsx` | Remove parameters from `supabase.rpc("accept_invitation")` call |

