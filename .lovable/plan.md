

## Plan: Gestion des utilisateurs et invitations + Menu utilisateur

### Objectif
1. **Gerer les utilisateurs dans Admin Data** - Inviter des users par email, gerer leurs roles
2. **Systeme d'invitation obligatoire** - Un user ne peut pas se connecter sans avoir ete invite (avoir un role dans `user_roles`)
3. **Retirer l'import/export CSV** de l'Admin Data (garder uniquement la gestion users)
4. **Menu utilisateur en haut a droite** - Initiales + dropdown (deconnexion, acces admin)

---

### Partie 1 : Base de donnees - Table invitations

**Migration SQL** : Creer une table `user_invitations` pour gerer les invitations en attente

```sql
-- Table des invitations
CREATE TABLE public.user_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  role app_role NOT NULL DEFAULT 'user',
  invited_by uuid REFERENCES auth.users(id),
  invited_at timestamp with time zone DEFAULT now(),
  accepted_at timestamp with time zone DEFAULT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired'))
);

-- RLS policies
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- Only admins can manage invitations
CREATE POLICY "Admins can manage invitations"
ON public.user_invitations
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Function to check if email is invited
CREATE OR REPLACE FUNCTION public.is_email_invited(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_invitations
    WHERE email = _email
      AND status IN ('pending', 'accepted')
  )
$$;

-- Function to accept invitation (called after signup)
CREATE OR REPLACE FUNCTION public.accept_invitation(_user_id uuid, _email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _invitation RECORD;
BEGIN
  -- Get the invitation
  SELECT * INTO _invitation 
  FROM public.user_invitations 
  WHERE email = _email AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No pending invitation for this email';
  END IF;
  
  -- Create user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, _invitation.role)
  ON CONFLICT DO NOTHING;
  
  -- Mark invitation as accepted
  UPDATE public.user_invitations
  SET status = 'accepted', accepted_at = now()
  WHERE email = _email;
END;
$$;
```

---

### Partie 2 : Modification du flux d'authentification

**Fichier : `src/pages/Auth.tsx`**

| Modification | Detail |
|--------------|--------|
| Retirer l'onglet "Inscription" | Seule la connexion est possible |
| Verification d'invitation | Apres login, verifier que l'user a un role |
| Message d'erreur | "Votre compte n'est pas autorise. Contactez un administrateur." |

**Fichier : `src/contexts/AuthContext.tsx`**

| Modification | Detail |
|--------------|--------|
| Ajouter `userRole` | Stocker le role de l'utilisateur connecte |
| Ajouter `isAdmin` | Boolean pour savoir si l'user est admin |
| Verification au login | Apres auth, verifier la presence dans `user_roles` |
| Deconnexion automatique | Si pas de role, deconnecter et afficher erreur |

```typescript
interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: 'admin' | 'user' | null;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  isLoading: boolean;
}
```

**Logique de verification** :
```typescript
// Apres authentification reussie
const { data: roleData } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', user.id)
  .single();

if (!roleData) {
  // Tenter d'accepter une invitation
  await supabase.rpc('accept_invitation', { 
    _user_id: user.id, 
    _email: user.email 
  });
  
  // Re-verifier
  const { data: newRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();
    
  if (!newRole) {
    await signOut();
    toast({ title: "Acces refuse", description: "Vous n'etes pas invite." });
    return;
  }
}
```

---

### Partie 3 : Refonte de DataAdminView

**Fichier : `src/components/DataAdminView.tsx`**

Remplacer completement le contenu :

| Section | Contenu |
|---------|---------|
| **Utilisateurs actifs** | Liste des users avec leur role + email |
| **Invitations en attente** | Liste des invitations non acceptees |
| **Inviter un utilisateur** | Formulaire email + role |
| **Changer le role** | Dropdown pour modifier le role d'un user |
| **Supprimer un user** | Retirer son role (il ne pourra plus se connecter) |

**Interface utilisateur** :
```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│ Gestion des utilisateurs                                                         │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│ [+ Inviter un utilisateur]                                                       │
│                                                                                  │
│ UTILISATEURS ACTIFS (3)                                                          │
│ ┌────────────────────────────────────────────────────────────────────────────┐   │
│ │ Email                     │ Role       │ Depuis        │ Actions          │   │
│ ├───────────────────────────┼────────────┼───────────────┼──────────────────┤   │
│ │ admin@company.com         │ [Admin ▼]  │ 15/01/2026    │ 🗑 Retirer       │   │
│ │ user1@company.com         │ [User ▼]   │ 20/01/2026    │ 🗑 Retirer       │   │
│ │ user2@company.com         │ [User ▼]   │ 28/01/2026    │ 🗑 Retirer       │   │
│ └────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│ INVITATIONS EN ATTENTE (2)                                                       │
│ ┌────────────────────────────────────────────────────────────────────────────┐   │
│ │ Email                     │ Role       │ Invite le     │ Actions          │   │
│ ├───────────────────────────┼────────────┼───────────────┼──────────────────┤   │
│ │ newuser@company.com       │ User       │ 28/01/2026    │ 🗑 Annuler       │   │
│ │ autre@company.com         │ Admin      │ 27/01/2026    │ 🗑 Annuler       │   │
│ └────────────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

**Dialog d'invitation** :
```text
┌────────────────────────────────────────────┐
│ Inviter un utilisateur                     │
├────────────────────────────────────────────┤
│                                            │
│ Email: [________________________]          │
│                                            │
│ Role:                                      │
│   ○ Utilisateur (acces standard)           │
│   ○ Administrateur (gestion complete)      │
│                                            │
│            [Annuler]  [Inviter]            │
└────────────────────────────────────────────┘
```

---

### Partie 4 : Menu utilisateur en haut a droite

**Fichier : `src/components/Topbar.tsx`**

Remplacer l'avatar simple par un dropdown :

| Element | Detail |
|---------|--------|
| Affichage | Cercle avec initiales (ex: "JD" pour Jean Dupont) |
| Au clic | Dropdown menu avec options |
| Options | Parametres (Admin Data), Deconnexion |

**Interface** :
```text
┌─────────────────────────────────────┐
│  [🔍 Recherche...]    [🌙] [JD ▼]  │
└─────────────────────────────────────┘
                              ↓
                        ┌────────────────────┐
                        │ jean@company.com   │
                        │ Administrateur     │
                        ├────────────────────┤
                        │ ⚙️ Admin / Users   │
                        ├────────────────────┤
                        │ 🚪 Deconnexion     │
                        └────────────────────┘
```

**Implementation** :
```typescript
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Calculer les initiales
const getInitials = (email: string) => {
  const parts = email.split('@')[0].split('.');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return email.substring(0, 2).toUpperCase();
};
```

---

### Partie 5 : Restriction Admin Data aux admins

**Fichier : `src/components/Sidebar.tsx`**

| Modification | Detail |
|--------------|--------|
| Recevoir `isAdmin` en prop | Depuis le context Auth |
| Masquer Admin Data | Si l'user n'est pas admin |

**Fichier : `src/pages/Index.tsx`**

| Modification | Detail |
|--------------|--------|
| Passer `isAdmin` au Sidebar | Depuis `useAuth()` |
| Passer `onNavigateAdmin` au Topbar | Pour le menu utilisateur |

---

### Resume des fichiers

| Fichier | Action |
|---------|--------|
| **Migration SQL** | Table `user_invitations` + fonctions |
| `src/contexts/AuthContext.tsx` | Ajouter `userRole`, `isAdmin`, verification |
| `src/pages/Auth.tsx` | Retirer inscription, login seulement |
| `src/components/DataAdminView.tsx` | Refonte complete - gestion users |
| `src/components/Topbar.tsx` | Menu utilisateur dropdown |
| `src/components/Sidebar.tsx` | Masquer Admin Data si non-admin |
| `src/pages/Index.tsx` | Passer props isAdmin + handlers |

---

### Securite

**Points importants** :

1. **RLS sur `user_invitations`** - Seuls les admins peuvent gerer
2. **Fonction SECURITY DEFINER** - `accept_invitation` s'execute avec les droits du createur
3. **Verification cote serveur** - Le role est verifie dans `user_roles`, pas en localStorage
4. **Pas de signup public** - L'onglet inscription est retire

**Premier admin** :
Pour creer le premier admin, il faudra :
1. S'inscrire normalement (page Auth actuelle)
2. Ajouter manuellement le role dans la base :
```sql
INSERT INTO user_roles (user_id, role) 
VALUES ('uuid-du-user', 'admin');
```

Ou creer un bouton temporaire visible uniquement s'il n'y a aucun admin.

---

### Hooks personnalises

**Fichier : `src/hooks/useUserManagement.ts` (Nouveau)**

```typescript
export function useUserManagement() {
  // Fetch users with roles
  const { data: usersWithRoles } = useQuery({
    queryKey: ['users-with-roles'],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('*');
      return data;
    }
  });
  
  // Fetch pending invitations
  const { data: pendingInvitations } = useQuery({
    queryKey: ['pending-invitations'],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('status', 'pending');
      return data;
    }
  });
  
  // Invite user
  const inviteUser = useMutation({...});
  
  // Update role
  const updateRole = useMutation({...});
  
  // Remove user
  const removeUser = useMutation({...});
  
  // Cancel invitation
  const cancelInvitation = useMutation({...});
  
  return { usersWithRoles, pendingInvitations, inviteUser, updateRole, removeUser, cancelInvitation };
}
```

---

### Flux d'invitation

```text
ADMIN                                    NOUVEL UTILISATEUR
  │                                              │
  ├─── Saisit email + role ────────────────────→│
  │                                              │
  ├─── INSERT user_invitations ─────────────────│
  │                                              │
  │                              ←───── Recoit l'email (hors app)
  │                                              │
  │                              ←───── Va sur /auth
  │                                              │
  │                              ←───── Se connecte (email/password)
  │                                              │
  │         ←───── supabase.auth.signUp ────────│
  │                                              │
  │         ←───── Trigger: accept_invitation ──│
  │                                              │
  │         ←───── INSERT user_roles ───────────│
  │                                              │
  │         ←───── Acces accorde ───────────────│
```

