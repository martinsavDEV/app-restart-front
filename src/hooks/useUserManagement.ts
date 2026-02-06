import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface UserWithRole {
  id: string;
  user_id: string;
  role: "admin" | "user";
  created_at: string | null;
  email?: string;
  display_name?: string;
}

interface UserInvitation {
  id: string;
  email: string;
  role: "admin" | "user";
  invited_by: string | null;
  invited_at: string;
  accepted_at: string | null;
  status: "pending" | "accepted" | "expired";
}

interface PendingUser {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  created_at: string;
}

export function useUserManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch users with roles (join with profiles for email/name)
  const { data: usersWithRoles, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users-with-roles"],
    queryFn: async () => {
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Fetch profiles for these users to get emails
      const userIds = roles.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email, display_name")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return roles.map(role => ({
        ...role,
        email: profileMap.get(role.user_id)?.email,
        display_name: profileMap.get(role.user_id)?.display_name,
      })) as UserWithRole[];
    },
  });

  // Fetch pending users (profiles without roles)
  const { data: pendingUsers, isLoading: isLoadingPending } = useQuery({
    queryKey: ["pending-users"],
    queryFn: async () => {
      // Get all profiles
      const { data: profiles, error: profError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (profError) throw profError;

      // Get all user_ids that have roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id");
      if (rolesError) throw rolesError;

      const approvedUserIds = new Set(roles.map(r => r.user_id));

      // Filter profiles that don't have a role
      return (profiles || [])
        .filter(p => !approvedUserIds.has(p.user_id))
        .map(p => ({
          id: p.id,
          user_id: p.user_id,
          email: p.email,
          display_name: p.display_name,
          created_at: p.created_at,
        })) as PendingUser[];
    },
  });

  // Fetch pending invitations
  const { data: pendingInvitations, isLoading: isLoadingInvitations } = useQuery({
    queryKey: ["pending-invitations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_invitations")
        .select("*")
        .eq("status", "pending")
        .order("invited_at", { ascending: false });
      if (error) throw error;
      return data as UserInvitation[];
    },
  });

  // Approve a pending user (create their role)
  const approveUser = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "user" }) => {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-users"] });
      queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
      toast({ title: "Utilisateur approuvé", description: "L'utilisateur peut maintenant accéder à l'application." });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  // Reject a pending user (delete their profile - they'll need to re-register)
  const rejectUser = useMutation({
    mutationFn: async (profileId: string) => {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", profileId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-users"] });
      toast({ title: "Inscription refusée" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  // Invite user
  const inviteUser = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: "admin" | "user" }) => {
      const { error } = await supabase.from("user_invitations").insert({
        email: email.toLowerCase().trim(),
        role,
        invited_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-invitations"] });
      toast({ title: "Invitation envoyée", description: "L'utilisateur peut maintenant se connecter." });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message.includes("duplicate") 
          ? "Cet email a déjà été invité" 
          : error.message,
        variant: "destructive",
      });
    },
  });

  // Update role
  const updateRole = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: "admin" | "user" }) => {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
      toast({ title: "Rôle mis à jour" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  // Remove user
  const removeUser = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
      toast({ title: "Accès retiré", description: "L'utilisateur ne pourra plus se connecter." });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  // Cancel invitation
  const cancelInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from("user_invitations")
        .delete()
        .eq("id", invitationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-invitations"] });
      toast({ title: "Invitation annulée" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  return {
    usersWithRoles: usersWithRoles || [],
    pendingUsers: pendingUsers || [],
    pendingInvitations: pendingInvitations || [],
    isLoading: isLoadingUsers || isLoadingInvitations || isLoadingPending,
    inviteUser,
    approveUser,
    rejectUser,
    updateRole,
    removeUser,
    cancelInvitation,
  };
}
