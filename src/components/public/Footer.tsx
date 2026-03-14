import { Link } from "react-router-dom";
import doLogo from "@/assets/dologo.png";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      {/* CTA banner */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-foreground">Ready to modernise your dealership?</h3>
            <p className="text-sm text-muted-foreground mt-1">14-day free trial · No credit card required</p>
          </div>
          <Link to="/login?mode=signup">
            <Button className="font-semibold">
              Start Free Trial <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img src={doLogo} alt="DealerOps logo" className="h-7 w-7 object-contain" />
              <span className="text-lg font-bold text-foreground">
                Dealer<span className="text-primary">Ops</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              The complete dealer management system for UK independent car dealerships.
            </p>
          </div>

          {/* Platform */}
          <div className="md:col-span-2">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4">Platform</h4>
            <ul className="space-y-2.5">
              {["Features", "Pricing", "Security"].map((item) => (
                <li key={item}>
                  <Link to={`/${item.toLowerCase()}`} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="md:col-span-2">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4">Support</h4>
            <ul className="space-y-2.5">
              {[
                { label: "Knowledge Base", to: "/help" },
                { label: "Help Centre", to: "/support" },
                { label: "Contact", to: "/contact" },
              ].map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="md:col-span-2">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4">Legal</h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Get Started */}
          <div className="md:col-span-2">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4">Get Started</h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/login?mode=signup" className="text-sm text-primary hover:text-primary/80 font-medium transition-colors">
                  Start Free Trial
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Dealer Login
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © 2026 DealerOps. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/app" className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors">
              Admin
            </Link>
            <p className="text-xs text-muted-foreground">
              Built by <span className="text-foreground font-medium">Wildcard Labs</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
