import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import doLogo from "@/assets/dologo.png";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Features", to: "/features" },
  { label: "Pricing", to: "/pricing" },
  { label: "Security", to: "/security" },
  { label: "Help", to: "/help" },
  { label: "Contact", to: "/contact" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled
        ? "bg-background/95 backdrop-blur-md border-b border-border shadow-sm"
        : "bg-background/80 backdrop-blur-sm border-b border-transparent"
    }`}>
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={doLogo} alt="DealerOps logo" className="h-8 w-8 object-contain" />
          <span className="text-lg font-bold text-foreground">
            Dealer<span className="text-primary">Ops</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                location.pathname === link.to
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground font-medium">
              Log In
            </Button>
          </Link>
          <Link to="/login?mode=signup">
            <Button size="sm" className="font-semibold rounded-lg shadow-sm">
              Try For Free
            </Button>
          </Link>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-muted-foreground hover:text-foreground"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden border-t border-border bg-background"
          >
            <div className="p-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    location.pathname === link.to
                      ? "text-primary bg-primary/5"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 mt-2 border-t border-border space-y-2">
                <Link to="/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full text-muted-foreground">
                    Log In
                  </Button>
                </Link>
                <Link to="/login?mode=signup" onClick={() => setMobileOpen(false)}>
                  <Button size="sm" className="w-full">
                    Try For Free
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
