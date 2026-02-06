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
  signOut: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Use refs to avoid re-running the effect when navigate/toast change
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
          return true;
        }
      } catch {
        // Invitation not found or already accepted, that's fine
      }
    }

    // No role found - user is not authorized
    return false;
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Use setTimeout to avoid Supabase client deadlock
        setTimeout(async () => {
          const hasRole = await checkUserRole(session.user.id, session.user.email);
          
          if (!hasRole) {
            // User is not authorized
            setUserRole(null);
            await supabase.auth.signOut();
            toastRef.current({
              title: "Accès refusé",
              description: "Vous n'êtes pas autorisé à accéder à cette application. Contactez un administrateur.",
              variant: "destructive",
            });
            navigateRef.current("/auth");
          } else if (event === "SIGNED_IN") {
            navigateRef.current("/");
          }
          setIsLoading(false);
        }, 0);
      } else {
        setUserRole(null);
        setIsLoading(false);
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const hasRole = await checkUserRole(session.user.id, session.user.email);
        if (!hasRole) {
          setUserRole(null);
          await supabase.auth.signOut();
        }
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [checkUserRole]);

  const signOut = async () => {
    setUserRole(null);
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
