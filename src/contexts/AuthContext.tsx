import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Record login events to audit_logs for health dashboard tracking
      if (event === "SIGNED_IN" && session?.user) {
        const userId = session.user.id;
        // Fetch dealer_id from profiles (use setTimeout to avoid Supabase auth deadlock)
        setTimeout(async () => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("dealer_id")
            .eq("id", userId)
            .single();
          if (profile?.dealer_id) {
            await supabase.from("audit_logs").insert({
              dealer_id: profile.dealer_id,
              actor_user_id: userId,
              action_type: "login",
              entity_type: "user",
              entity_id: userId,
              summary: "User logged in",
            });
          }
        }, 0);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
