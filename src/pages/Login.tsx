import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "reset">("login");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Welcome back!");
      navigate("/app");
    }
    setLoading(false);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/app",
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Check your email for the reset link.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm mx-4"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">D</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold">
            {mode === "login" ? "Dealer Login" : "Reset Password"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "login"
              ? "Sign in to your DealerOps account"
              : "Enter your email to receive a reset link"}
          </p>
        </div>

        <form
          onSubmit={mode === "login" ? handleLogin : handleReset}
          className="space-y-4 p-6 rounded-xl border border-border/50 bg-card/50"
        >
          <div>
            <Label htmlFor="email" className="text-xs">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
              placeholder="you@dealership.co.uk"
            />
          </div>

          {mode === "login" && (
            <div>
              <Label htmlFor="password" className="text-xs">Password</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full glow" disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Send Reset Link"}
          </Button>

          <div className="text-center">
            {mode === "login" ? (
              <button
                type="button"
                onClick={() => setMode("reset")}
                className="text-xs text-primary hover:underline"
              >
                Forgot password?
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-xs text-primary hover:underline"
              >
                Back to login
              </button>
            )}
          </div>
        </form>

        {/* Dev quick-login */}
        <div className="mt-4 p-3 rounded-lg border border-dashed border-border/60 bg-muted/30">
          <p className="text-[10px] text-muted-foreground text-center mb-2 font-medium uppercase tracking-wider">Dev Quick Login</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                const { error } = await supabase.auth.signInWithPassword({
                  email: "admin@dealerops.dev",
                  password: "admin123",
                });
                if (error) toast.error(error.message);
                else navigate("/app");
                setLoading(false);
              }}
            >
              Admin Login
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                const { error } = await supabase.auth.signInWithPassword({
                  email: "user@dealerops.dev",
                  password: "user1234",
                });
                if (error) toast.error(error.message);
                else navigate("/app");
                setLoading(false);
              }}
            >
              User Login
            </Button>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground text-center mt-4">
          No account? DealerOps is invitation-only.{" "}
          <Link to="/contact" className="text-primary hover:underline">Request access</Link>
        </p>
      </motion.div>
    </div>
  );
}
