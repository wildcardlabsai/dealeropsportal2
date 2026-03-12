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
    // IMPORTANT: Set up onAuthStateChange FIRST to handle subsequent auth events,
    // but do NOT set loading=false here to avoid race conditions.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Record login events to audit_logs for health dashboard tracking
      if (event === "SIGNED_IN" && session?.user) {
        const userId = session.user.id;
        // Use setTimeout to avoid Supabase auth deadlock
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

    // getSession restores from storage — only set loading=false AFTER this resolves
    // to ensure auth.uid() is available for RLS policies
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
