import { Link } from "react-router-dom";
import doLogo from "@/assets/dologo.png";

export function Footer() {
  return (
    <footer className="border-t border-border/30 bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img src={doLogo} alt="DealerOps logo" className="h-8 w-8 object-contain" />
              <span className="text-lg font-bold text-foreground">
                Dealer<span className="text-primary">Ops</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground mb-2">
              The complete dealer management system for UK independent car dealerships.
            </p>
            <p className="text-xs text-muted-foreground">
              Purpose-built for UK motor trade.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Platform</h4>
            <ul className="space-y-2">
              {["Features", "Pricing", "Security"].map((item) => (
                <li key={item}>
                  <Link to={`/${item.toLowerCase()}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Support</h4>
            <ul className="space-y-2">
              {[
                { label: "Knowledge Base", to: "/help" },
                { label: "Help Centre", to: "/support" },
                { label: "Contact", to: "/contact" },
              ].map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © 2026 DealerOps. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/app" className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">
              Admin Panel
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
