import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, ArrowLeft, Car, Shield, BarChart3, CheckCircle2 } from "lucide-react";
import doLogo from "@/assets/dologo.png";

type Mode = "login" | "signup" | "reset";

const sellingPoints = [
  { icon: Car, text: "Vehicle stock, CRM & invoicing in one place" },
  { icon: Shield, text: "GDPR-compliant with full audit trail" },
  { icon: BarChart3, text: "KPIs, reports & staff performance" },
  { icon: CheckCircle2, text: "14-day free trial, no credit card" },
];

export default function Login() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>(initialMode);

  // Signup fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dealershipName, setDealershipName] = useState("");

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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("self-signup", {
        body: { dealership_name: dealershipName, first_name: firstName, last_name: lastName, email, password },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        toast.success("Account created! Please sign in.");
        setMode("login");
      } else {
        toast.success("Welcome to DealerOps! Your 14-day trial has started.");
        navigate("/app");
      }
    } catch (err: any) {
      toast.error(err.message || "Signup failed");
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

  const titles: Record<Mode, { title: string; subtitle: string }> = {
    login: { title: "Dealer Login", subtitle: "Sign in to your DealerOps account" },
    signup: { title: "Start Free Trial", subtitle: "14 days free · No credit card required" },
    reset: { title: "Reset Password", subtitle: "Enter your email to receive a reset link" },
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex relative">
      {/* Left brand panel - hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/8 blur-[150px]" />
        
        <div className="relative z-10 p-12 max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 mb-10">
            <img src={doLogo} alt="DealerOps logo" className="h-12 w-12 object-contain" />
            <span className="text-2xl font-bold text-foreground">
              Dealer<span className="text-primary">Ops</span>
            </span>
          </Link>

          <h2 className="text-2xl font-bold text-foreground mb-3">
            The dealership platform built for the UK motor trade
          </h2>
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
            Everything you need to manage customers, stock, compliance, and aftersales — from one dashboard.
          </p>

          <div className="space-y-4">
            {sellingPoints.map((point) => (
              <div key={point.text} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <point.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-foreground">{point.text}</span>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-border/30">
            <p className="text-xs text-muted-foreground italic">
              "DealerOps has completely transformed how we manage aftersales. What used to take hours now takes minutes."
            </p>
            <p className="text-xs text-muted-foreground mt-2 font-medium">— James Hartley, Hartley Motors</p>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center py-20 px-4">
        <div className="absolute inset-0 lg:hidden bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] lg:hidden" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm relative z-10"
        >
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6 lg:hidden">
              <img src={doLogo} alt="DealerOps logo" className="h-10 w-10 object-contain" />
            </Link>
            <h1 className="text-2xl font-bold">{titles[mode].title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{titles[mode].subtitle}</p>
          </div>

          <form
            onSubmit={mode === "login" ? handleLogin : mode === "signup" ? handleSignup : handleReset}
            className="space-y-4 p-6 rounded-xl border border-border/50 bg-card/50"
          >
            {mode === "signup" && (
              <>
                <div>
                  <Label htmlFor="dealership" className="text-xs">Dealership Name</Label>
                  <Input id="dealership" value={dealershipName} onChange={(e) => setDealershipName(e.target.value)} required className="mt-1" placeholder="Your Motors Ltd" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="firstName" className="text-xs">First Name</Label>
                    <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-xs">Last Name</Label>
                    <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="mt-1" />
                  </div>
                </div>
              </>
            )}

            <div>
              <Label htmlFor="email" className="text-xs">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1" placeholder="you@dealership.co.uk" />
            </div>

            {(mode === "login" || mode === "signup") && (
              <div>
                <Label htmlFor="password" className="text-xs">Password</Label>
                <div className="relative mt-1">
                  <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} placeholder={mode === "signup" ? "Min. 8 characters" : undefined} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {mode === "signup" && (
              <div>
                <Label htmlFor="confirmPassword" className="text-xs">Confirm Password</Label>
                <div className="relative mt-1">
                  <Input id="confirmPassword" type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} placeholder="Re-enter your password" />
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-destructive mt-1">Passwords do not match</p>
                )}
              </div>
            )}

            <Button type="submit" className="w-full glow" disabled={loading}>
              {loading ? "Please wait..." : mode === "login" ? "Sign In" : mode === "signup" ? "Create Account & Start Trial" : "Send Reset Link"}
            </Button>

            {mode === "login" && (
              <div className="text-center">
                <button type="button" onClick={() => setMode("reset")} className="text-xs text-primary hover:underline">Forgot password?</button>
              </div>
            )}

            {mode !== "login" && (
              <div className="text-center">
                <button type="button" onClick={() => setMode("login")} className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                  <ArrowLeft size={12} /> Back to login
                </button>
              </div>
            )}
          </form>

          <div className="text-center mt-4 space-y-1">
            {mode === "login" ? (
              <p className="text-[10px] text-muted-foreground">
                No account?{" "}
                <button onClick={() => setMode("signup")} className="text-primary hover:underline">Start a free 14-day trial</button>
              </p>
            ) : mode === "signup" ? (
              <p className="text-[10px] text-muted-foreground">
                Already have an account?{" "}
                <button onClick={() => setMode("login")} className="text-primary hover:underline">Sign in</button>
              </p>
            ) : null}
            <p className="text-[10px]">
              <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">What is DealerOps?</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
