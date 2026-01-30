import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface UserWithRole {
  id: string;
  user_id: string;
  role: "admin" | "user";
  created_at: string | null;
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

export function useUserManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch users with roles
  const { data: usersWithRoles, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users-with-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as UserWithRole[];
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

  // Remove user (delete their role)
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
    pendingInvitations: pendingInvitations || [],
    isLoading: isLoadingUsers || isLoadingInvitations,
    inviteUser,
    updateRole,
    removeUser,
    cancelInvitation,
  };
}
