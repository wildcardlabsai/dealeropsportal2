import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import {
  Car, Users, Shield, FileText, Wrench, Star,
  BarChart3, ClipboardCheck, ArrowRight, CheckCircle2,
  Lock, Headphones, Globe, Zap, ChevronRight,
  ShieldCheck, Award, TrendingUp
} from "lucide-react";

/* ─── data ─── */

const modules = [
  { icon: Users, title: "Customer CRM", description: "Full customer profiles, communication logs, and consent tracking.", featured: true },
  { icon: Car, title: "Vehicle Management", description: "Stock control, DVLA checks, MOT history, and vehicle lifecycle.", featured: true },
  { icon: FileText, title: "Invoicing", description: "Professional sale invoices with PDF generation and payment tracking." },
  { icon: Shield, title: "Warranties", description: "Manage warranty policies, track claims, and generate certificates." },
  { icon: Wrench, title: "Aftersales", description: "Case management with CRA guidance, SLA tracking, and dispute tools.", featured: true },
  { icon: Star, title: "Review Booster", description: "Automated review requests to grow your Google and Trustpilot ratings." },
  { icon: BarChart3, title: "Reports & KPIs", description: "Staff performance, sales metrics, and exportable business insights." },
  { icon: ClipboardCheck, title: "Compliance Centre", description: "GDPR consent records, data retention, and full audit trail." },
];

const stats = [
  { value: 2500, suffix: "+", label: "Vehicles Managed" },
  { value: 150, suffix: "+", label: "Dealerships" },
  { value: 99.9, suffix: "%", label: "Uptime" },
  { value: 50, suffix: "k+", label: "Invoices Generated" },
];

const steps = [
  { step: "01", title: "Sign Up", description: "Create your account and tell us about your dealership. We'll have you set up in under 10 minutes." },
  { step: "02", title: "Import Your Data", description: "Bring your existing stock, customers, and records across with our simple import tools." },
  { step: "03", title: "Go Live", description: "Start managing your dealership from one unified dashboard — anywhere, any device." },
];

const testimonials = [
  { name: "James Hartley", role: "Director", dealership: "Hartley Motors, Leeds", quote: "DealerOps has completely transformed how we manage aftersales. What used to take hours now takes minutes." },
  { name: "Sarah Mitchell", role: "Operations Manager", dealership: "Mitchell Cars, Bristol", quote: "The compliance centre alone is worth it. We passed our FCA audit with zero findings thanks to the audit trail." },
  { name: "David Chen", role: "Owner", dealership: "Premier Autos, Manchester", quote: "We went from spreadsheets to DealerOps in a week. Best decision we've made for the business." },
];

const trustBadges = [
  { icon: ShieldCheck, label: "GDPR Compliant" },
  { icon: Lock, label: "256-bit Encryption" },
  { icon: Globe, label: "UK-Based Support" },
  { icon: Award, label: "ISO 27001 Ready" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: "easeOut" as const }
  }),
};

/* ─── animated counter ─── */

function AnimatedCounter({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(current * 10) / 10);
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl md:text-4xl font-bold text-foreground">
        {Number.isInteger(value) ? Math.floor(display) : display.toFixed(1)}
        <span className="text-primary">{suffix}</span>
      </div>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

/* ─── page ─── */

export default function Index() {
  return (
    <div>
      {/* ═══ Hero ═══ */}
      <section className="relative overflow-hidden py-28 md:py-40">
        {/* background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-[160px]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-muted/50 text-xs text-muted-foreground mb-8">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              Purpose-built for UK motor trade
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-6">
              Run your dealership{" "}
              <span className="text-gradient">with confidence</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              The all-in-one management platform for independent car dealers. 
              Customers, stock, aftersales, compliance — all in one place.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/contact">
                <Button size="lg" className="glow text-base px-8 h-12">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/features">
                <Button variant="outline" size="lg" className="text-base px-8 h-12">
                  See All Features
                </Button>
              </Link>
            </div>

            <p className="text-xs text-muted-foreground mt-4">No credit card required · 14-day free trial · Cancel anytime</p>
          </motion.div>
        </div>
      </section>

      {/* ═══ Trust Badges ═══ */}
      <section className="py-8 border-t border-border/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            {trustBadges.map((badge, i) => (
              <motion.div
                key={badge.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="flex items-center gap-2 text-muted-foreground"
              >
                <badge.icon className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium">{badge.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Stats ═══ */}
      <section className="py-16 border-t border-border/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            {stats.map((stat) => (
              <AnimatedCounter key={stat.label} {...stat} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Benefits ═══ */}
      <section className="py-20 border-t border-border/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Why dealers choose DealerOps</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Everything you need to manage a modern dealership, without the complexity.
              </p>
            </motion.div>
          </div>

          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Zap, title: "Built for UK Dealers", desc: "Purpose-built for independent UK motor trade with DVLA, DVSA, and vehicle data integrations." },
              { icon: Users, title: "Multi-Site Ready", desc: "Multi-site and multi-user with role-based access control across your entire operation." },
              { icon: Shield, title: "GDPR Compliant", desc: "Full audit logging, consent tracking, and data retention policies built in." },
              { icon: Globe, title: "Cloud-Based", desc: "Secure, accessible anywhere on any device. No installations needed." },
              { icon: TrendingUp, title: "No Lock-in", desc: "No long contracts — flexible monthly plans that grow with your business." },
              { icon: Headphones, title: "UK Support", desc: "Real human support from a UK-based team who understand the motor trade." },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="p-5 rounded-xl border border-border/50 bg-card/50 hover:bg-card hover:border-border transition-all duration-300"
              >
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <item.icon className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1.5">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ How It Works ═══ */}
      <section className="py-20 border-t border-border/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Up and running in minutes</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Getting started with DealerOps is simple. No complex setup, no IT team needed.
              </p>
            </motion.div>
          </div>

          <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <motion.div
                key={s.step}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="relative text-center"
              >
                <div className="text-5xl font-bold text-primary/10 mb-3">{s.step}</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
                {i < steps.length - 1 && (
                  <ChevronRight className="hidden md:block absolute top-8 -right-4 h-5 w-5 text-border" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Modules ═══ */}
      <section className="py-20 border-t border-border/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything in one platform</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Powerful modules that work together to streamline your dealership operations.
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {modules.map((mod, i) => (
              <motion.div
                key={mod.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className={`group p-5 rounded-xl border transition-all duration-300 ${
                  mod.featured
                    ? "border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50"
                    : "border-border/50 bg-card/50 hover:bg-card hover:border-border"
                }`}
              >
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center mb-4 transition-colors ${
                  mod.featured ? "bg-primary/20 group-hover:bg-primary/30" : "bg-primary/10 group-hover:bg-primary/20"
                }`}>
                  <mod.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-2">{mod.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{mod.description}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link to="/features">
              <Button variant="ghost" className="text-primary hover:text-primary/80">
                View all features <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ Testimonials ═══ */}
      <section className="py-20 border-t border-border/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Trusted by dealers across the UK</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Hear from dealerships already using DealerOps to run their businesses.
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="p-6 rounded-xl border border-border/50 bg-card/50"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-sm text-foreground leading-relaxed mb-5 italic">"{t.quote}"</p>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}, {t.dealership}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Pricing Teaser ═══ */}
      <section className="py-20 border-t border-border/30">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-8">
              Plans from <span className="text-foreground font-semibold">£49/month</span>. No setup fees, no hidden costs, no long-term contracts.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/pricing">
                <Button variant="outline" size="lg" className="h-12 px-8">
                  View Pricing Plans
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ Final CTA ═══ */}
      <section className="py-24 border-t border-border/30">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <div className="glass rounded-2xl p-12 glow">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to streamline your dealership?</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Join hundreds of UK dealers who've already made the switch. Start your free 14-day trial today.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/contact">
                  <Button size="lg" className="glow h-12 px-8 text-base">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg" className="h-12 px-8">
                    Dealer Login
                  </Button>
                </Link>
              </div>
              <p className="text-xs text-muted-foreground mt-5">No credit card required · Setup in under 10 minutes</p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
