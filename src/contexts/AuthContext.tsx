import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

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
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const navigateRef = useRef(navigate);
  const toastRef = useRef(toast);
  useEffect(() => { navigateRef.current = navigate; }, [navigate]);
  useEffect(() => { toastRef.current = toast; }, [toast]);

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

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setTimeout(async () => {
          const hasRole = await checkUserRole(session.user.id, session.user.email);
          
          if (!hasRole) {
            // User is pending approval - keep them signed in but show pending state
            setUserRole(null);
          } else if (event === "SIGNED_IN") {
            navigateRef.current("/");
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
        await checkUserRole(session.user.id, session.user.email);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [checkUserRole]);

  const signOut = async () => {
    setUserRole(null);
    setIsPendingApproval(false);
    await supabase.auth.signOut();
    navigate("/auth");
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
