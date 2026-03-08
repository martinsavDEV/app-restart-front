import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "admin" | "user";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: AppRole | null;
  isAdmin: boolean;
  isPendingApproval: boolean;
  signOut: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [isPendingApproval, setIsPendingApproval] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkUserRole = useCallback(async (userId: string, userEmail: string | undefined) => {
    // First check if user already has a role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (roleData) {
      setUserRole(roleData.role as AppRole);
      setIsPendingApproval(false);
      return true;
    }

    // Try to accept pending invitation
    if (userEmail) {
      try {
        await supabase.rpc("accept_invitation", {
          _user_id: userId,
          _email: userEmail,
        });

        // Re-check role after accepting invitation
        const { data: newRoleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle();

        if (newRoleData) {
          setUserRole(newRoleData.role as AppRole);
          setIsPendingApproval(false);
          return true;
        }
      } catch {
        // Invitation not found or already accepted
      }
    }

    // No role found - user is pending approval
    setIsPendingApproval(true);
    return false;
  }, []);

  const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
  const SESSION_TIMESTAMP_KEY = "app_last_active";

  const checkSessionExpiry = useCallback(async (): Promise<boolean> => {
    const lastActive = localStorage.getItem(SESSION_TIMESTAMP_KEY);
    if (lastActive) {
      const elapsed = Date.now() - parseInt(lastActive, 10);
      if (elapsed > SESSION_MAX_AGE_MS) {
        localStorage.removeItem(SESSION_TIMESTAMP_KEY);
        await supabase.auth.signOut();
        return false; // session expired
      }
    }
    // Refresh timestamp on activity
    localStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());
    return true;
  }, [SESSION_MAX_AGE_MS]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const valid = await checkSessionExpiry();
        if (!valid) {
          setUserRole(null);
          setIsPendingApproval(false);
          setIsLoading(false);
          return;
        }

        setTimeout(async () => {
          const hasRole = await checkUserRole(session.user.id, session.user.email);
          
          if (!hasRole) {
            setUserRole(null);
          }
          setIsLoading(false);
        }, 0);
      } else {
        setUserRole(null);
        setIsPendingApproval(false);
        setIsLoading(false);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const valid = await checkSessionExpiry();
        if (!valid) {
          setIsLoading(false);
          return;
        }
        await checkUserRole(session.user.id, session.user.email);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [checkUserRole, checkSessionExpiry]);

  const signOut = async () => {
    setUserRole(null);
    setIsPendingApproval(false);
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userRole,
        isAdmin: userRole === "admin",
        isPendingApproval,
        signOut,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
