import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { User, Building2, Mail, Phone, Send, CheckCircle2 } from "lucide-react";

interface DemoRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DemoRequestDialog({ open, onOpenChange }: DemoRequestDialogProps) {
  const [loading, setLoading] = useState(false);
  const [stockSize, setStockSize] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const { error } = await supabase.from("contact_leads").insert({
        first_name: data.get("fullName") as string,
        last_name: "",
        email: data.get("email") as string,
        phone: data.get("mobile") as string,
        dealership_name: data.get("dealership") as string,
        message: `Demo request - Stock size: ${stockSize}`,
      });

      if (error) throw error;
      toast.success("Demo request sent! We'll be in touch shortly.");
      form.reset();
      setStockSize("");
      onOpenChange(false);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] p-0 overflow-hidden border-border/50 bg-background gap-0">
        <DialogTitle className="sr-only">Request a Demo</DialogTitle>
        <div className="grid grid-cols-1 md:grid-cols-5">
          {/* Left panel */}
          <div className="md:col-span-2 bg-primary p-8 md:p-10 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 right-5 text-[200px] font-black leading-none text-primary-foreground/20 select-none">+</div>
            </div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-black text-primary-foreground leading-tight tracking-tight uppercase mb-4">
                Start Your<br />Trial<br />Today
              </h2>
              <p className="text-xs font-bold text-primary-foreground/70 uppercase tracking-widest mb-8">
                14-day Pro Access Included
              </p>
              <div className="space-y-5">
                {[
                  "Full CRA Shield Module Access",
                  "Unlimited Lead CRM Pipeline",
                  "Real-Time Stock Feeds",
                ].map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary-foreground/80 shrink-0 mt-0.5" />
                    <span className="text-xs font-bold text-primary-foreground/90 uppercase tracking-wide">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-10 pt-6 border-t border-primary-foreground/20">
                <p className="text-[10px] font-bold text-primary-foreground/60 uppercase tracking-[0.2em]">
                  Joining 200+ Top UK Dealers
                </p>
              </div>
            </div>
          </div>

          {/* Right panel - form */}
          <div className="md:col-span-3 p-8 md:p-10">
            <h3 className="text-xl font-black uppercase tracking-tight mb-1">
              Secure Your Account
            </h3>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-8">
              Setup takes less than 60 seconds
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Full Name
                  </Label>
                  <div className="relative mt-1.5">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      name="fullName"
                      placeholder="John Smith"
                      required
                      className="pl-10 bg-muted/50 border-border/50 h-12"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Dealership
                  </Label>
                  <div className="relative mt-1.5">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      name="dealership"
                      placeholder="Dealer Name"
                      className="pl-10 bg-muted/50 border-border/50 h-12"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Email
                  </Label>
                  <div className="relative mt-1.5">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      name="email"
                      type="email"
                      placeholder="name@company.co"
                      required
                      className="pl-10 bg-muted/50 border-border/50 h-12"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Mobile
                  </Label>
                  <div className="relative mt-1.5">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      name="mobile"
                      placeholder="07xxx xxxxxx"
                      className="pl-10 bg-muted/50 border-border/50 h-12"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Stock Size
                </Label>
                <Select value={stockSize} onValueChange={setStockSize}>
                  <SelectTrigger className="mt-1.5 bg-muted/50 border-border/50 h-12">
                    <SelectValue placeholder="Select stock size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1 - 10 Vehicles</SelectItem>
                    <SelectItem value="11-25">11 - 25 Vehicles</SelectItem>
                    <SelectItem value="26-50">26 - 50 Vehicles</SelectItem>
                    <SelectItem value="51-100">51 - 100 Vehicles</SelectItem>
                    <SelectItem value="100+">100+ Vehicles</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="w-full h-14 text-sm font-bold uppercase tracking-[0.15em] glow"
              >
                {loading ? "Sending..." : "Authorize 14-Day Trial"}
                <Send className="ml-2 h-4 w-4" />
              </Button>

              <p className="text-[10px] text-muted-foreground text-center uppercase tracking-widest">
                No credit card required for trial
              </p>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
