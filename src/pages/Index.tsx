import { Link } from "react-router-dom";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import {
  Car, Users, Shield, FileText, Wrench, Star,
  BarChart3, ClipboardCheck, ArrowRight, CheckCircle2,
  Lock, Headphones, Globe, Zap, ChevronRight,
  ShieldCheck, Award, TrendingUp, Sparkles, Play
} from "lucide-react";
import dashboardPreview from "@/assets/dashboard-preview.png";

/* ─── hero feature carousel ─── */

const heroFeatures = [
  { icon: Car, title: "Vehicle Management", stat: "2,500+", statLabel: "vehicles tracked", desc: "Stock control, DVLA checks, MOT history", color: "from-blue-500/20 to-cyan-500/20" },
  { icon: Users, title: "Customer CRM", stat: "10k+", statLabel: "customer records", desc: "Profiles, comms logs, consent tracking", color: "from-violet-500/20 to-purple-500/20" },
  { icon: Wrench, title: "Aftersales", stat: "98%", statLabel: "SLA compliance", desc: "CRA guidance, case management, disputes", color: "from-amber-500/20 to-orange-500/20" },
  { icon: BarChart3, title: "Reports & KPIs", stat: "50k+", statLabel: "invoices generated", desc: "Staff performance & business insights", color: "from-emerald-500/20 to-green-500/20" },
];

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
  { step: "01", title: "Sign Up", description: "Create your account and tell us about your dealership. We'll have you set up in under 10 minutes.", icon: Sparkles },
  { step: "02", title: "Import Your Data", description: "Bring your existing stock, customers, and records across with our simple import tools.", icon: FileText },
  { step: "03", title: "Go Live", description: "Start managing your dealership from one unified dashboard — anywhere, any device.", icon: Play },
];

const testimonials = [
  { name: "James Hartley", role: "Director", dealership: "Hartley Motors, Leeds", quote: "DealerOps has completely transformed how we manage aftersales. What used to take hours now takes minutes.", initials: "JH" },
  { name: "Sarah Mitchell", role: "Operations Manager", dealership: "Mitchell Cars, Bristol", quote: "The compliance centre alone is worth it. We passed our FCA audit with zero findings thanks to the audit trail.", initials: "SM" },
  { name: "David Chen", role: "Owner", dealership: "Premier Autos, Manchester", quote: "We went from spreadsheets to DealerOps in a week. Best decision we've made for the business.", initials: "DC" },
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
    <div ref={ref} className="text-center p-6 rounded-xl border border-border/50 bg-card/30">
      <div className="text-3xl md:text-4xl font-bold text-foreground">
        {Number.isInteger(value) ? Math.floor(display) : display.toFixed(1)}
        <span className="text-primary">{suffix}</span>
      </div>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

/* ─── hero feature showcase ─── */

function HeroFeatureShowcase() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % heroFeatures.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const feat = heroFeatures[active];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.3 }}
      className="mt-16 max-w-4xl mx-auto"
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {heroFeatures.map((f, i) => (
          <button
            key={f.title}
            onClick={() => setActive(i)}
            className={`relative flex items-center gap-2 px-4 py-3 rounded-xl text-left text-xs font-medium transition-all duration-300 overflow-hidden ${
              i === active
                ? "text-primary border border-primary/40 shadow-lg shadow-primary/5"
                : "bg-card/50 text-muted-foreground border border-border/50 hover:border-border hover:text-foreground"
            }`}
          >
            {i === active && (
              <div className={`absolute inset-0 bg-gradient-to-br ${f.color}`} />
            )}
            <f.icon className="h-4 w-4 shrink-0 relative z-10" />
            <span className="relative z-10 truncate">{f.title}</span>
          </button>
        ))}
      </div>

      <div className={`relative rounded-2xl border border-border/50 p-8 md:p-10 min-h-[160px] overflow-hidden bg-gradient-to-br ${feat.color}`}>
        <div className="absolute top-0 left-0 right-0 h-1 bg-muted/20 rounded-full overflow-hidden">
          <motion.div
            key={active}
            className="h-full bg-primary rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 3.5, ease: "linear" }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-6"
          >
            <div className="h-16 w-16 rounded-2xl bg-background/50 backdrop-blur-sm flex items-center justify-center shrink-0 border border-border/30">
              <feat.icon className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-1">{feat.title}</h3>
              <p className="text-sm text-muted-foreground">{feat.desc}</p>
            </div>
            <div className="text-right shrink-0 bg-background/30 backdrop-blur-sm rounded-xl px-5 py-3 border border-border/20">
              <div className="text-2xl font-bold text-foreground">{feat.stat}</div>
              <p className="text-xs text-muted-foreground">{feat.statLabel}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ─── page ─── */

export default function Index() {
  return (
    <div>
      {/* ═══ Hero ═══ */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full bg-primary/5 blur-[200px]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-xs text-primary mb-8">
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
              <Link to="/login?mode=signup">
                <Button size="lg" className="glow text-base px-8 h-13 text-base font-semibold">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/features">
                <Button variant="outline" size="lg" className="text-base px-8 h-13">
                  See All Features
                </Button>
              </Link>
            </div>

            <p className="text-xs text-muted-foreground mt-4">No credit card required · 14-day free trial · Cancel anytime</p>

            {/* Social proof */}
            <div className="mt-8 inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-border/50 bg-card/30 backdrop-blur-sm">
              <div className="flex -space-x-2">
                {["JH", "SM", "DC", "AK"].map((initials) => (
                  <div key={initials} className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 border-2 border-background flex items-center justify-center text-[9px] font-bold text-primary">
                    {initials}
                  </div>
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                Trusted by <span className="text-foreground font-semibold">150+ UK dealers</span>
              </span>
            </div>
          </motion.div>

          <HeroFeatureShowcase />

          {/* Product screenshot */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-12 max-w-5xl mx-auto"
          >
            <div className="rounded-2xl border border-border/40 bg-card/30 overflow-hidden shadow-2xl shadow-primary/10">
              <img
                src={dashboardPreview}
                alt="DealerOps dashboard showing revenue, customers, vehicles, and leads overview"
                className="w-full h-auto"
                loading="lazy"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ Trust Badges ═══ */}
      <section className="py-8 border-t border-border/30 bg-gradient-to-r from-primary/[0.03] via-muted/30 to-primary/[0.03]">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12">
            {trustBadges.map((badge, i) => (
              <motion.div
                key={badge.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm"
              >
                <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center">
                  <badge.icon className="h-4.5 w-4.5 text-primary" />
                </div>
                <div>
                  <span className="text-xs font-bold text-foreground block">{badge.label}</span>
                  <span className="text-[10px] text-muted-foreground">Verified</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Stats ═══ */}
      <section className="py-20 border-t border-border/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {stats.map((stat) => (
              <AnimatedCounter key={stat.label} {...stat} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Benefits — alternating layout ═══ */}
      <section className="py-24 border-t border-border/30 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <span className="inline-block text-xs font-semibold text-primary uppercase tracking-widest mb-3">Why DealerOps</span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Why dealers choose us</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Everything you need to manage a modern dealership, without the complexity.
              </p>
            </motion.div>
          </div>

          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
                className="group p-6 rounded-2xl border border-border/50 bg-card/30 hover:bg-card/60 hover:border-primary/20 transition-all duration-500 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ How It Works ═══ */}
      <section className="py-24 border-t border-border/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <span className="inline-block text-xs font-semibold text-primary uppercase tracking-widest mb-3">Getting Started</span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Up and running in minutes</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Getting started with DealerOps is simple. No complex setup, no IT team needed.
              </p>
            </motion.div>
          </div>

          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-px bg-gradient-to-r from-primary/30 via-primary/50 to-primary/30" />
            
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
                <div className="relative inline-flex h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 items-center justify-center mb-5 border border-primary/20 mx-auto">
                  <s.icon className="h-7 w-7 text-primary" />
                  <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">{i + 1}</span>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{s.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Modules — bento-style ═══ */}
      <section className="py-24 border-t border-border/30 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <span className="inline-block text-xs font-semibold text-primary uppercase tracking-widest mb-3">Platform</span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything in one platform</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Powerful modules that work together to streamline your dealership operations.
              </p>
            </motion.div>
          </div>

          {/* Bento grid */}
          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {modules.map((mod, i) => (
              <motion.div
                key={mod.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className={`group relative p-6 rounded-2xl border transition-all duration-500 overflow-hidden ${
                  mod.featured
                    ? "border-primary/30 bg-gradient-to-br from-primary/10 to-primary/[0.02] hover:border-primary/50 sm:col-span-2 lg:col-span-2"
                    : "border-border/50 bg-card/30 hover:bg-card/60 hover:border-border"
                }`}
              >
                {mod.featured && (
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-semibold">
                    Core
                  </div>
                )}
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                  mod.featured ? "bg-primary/20 group-hover:bg-primary/30" : "bg-primary/10 group-hover:bg-primary/20"
                }`}>
                  <mod.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-foreground mb-2">{mod.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{mod.description}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link to="/features">
              <Button variant="outline" className="text-primary border-primary/30 hover:bg-primary/10">
                View all features <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ Testimonials — horizontal carousel ═══ */}
      <section className="py-24 border-t border-border/30 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <span className="inline-block text-xs font-semibold text-primary uppercase tracking-widest mb-3">Testimonials</span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Trusted by dealers across the UK</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Hear from dealerships already using DealerOps to run their businesses.
              </p>
            </motion.div>
          </div>

          {/* Infinite scroll carousel */}
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
            <motion.div
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="flex gap-6"
            >
              {[...testimonials, ...testimonials].map((t, i) => (
                <div
                  key={`${t.name}-${i}`}
                  className="relative shrink-0 w-[350px] p-6 rounded-2xl border border-border/50 bg-card/30"
                >
                  <div className="absolute -top-3 left-6 text-5xl text-primary/30 font-serif leading-none">"</div>
                  <div className="flex gap-0.5 mb-4 pt-3">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed mb-6 min-h-[60px]">{t.quote}</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-border/30">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}, {t.dealership}</p>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ Pricing Teaser ═══ */}
      <section className="py-20 border-t border-border/30 bg-gradient-to-b from-muted/10 to-transparent">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="inline-block text-xs font-semibold text-primary uppercase tracking-widest mb-3">Pricing</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-8">
              Plans from <span className="text-foreground font-semibold">£99/month</span>. No setup fees, no hidden costs, no long-term contracts.
            </p>
            <Link to="/pricing">
              <Button variant="outline" size="lg" className="h-12 px-8 border-primary/30 text-primary hover:bg-primary/10">
                View Pricing Plans
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══ Final CTA ═══ */}
      <section className="py-28 border-t border-border/30 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <div className="rounded-3xl p-12 md:p-16 border border-primary/20 bg-gradient-to-br from-primary/10 via-card/80 to-card/50 backdrop-blur-sm shadow-2xl shadow-primary/5">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to streamline your dealership?</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Join hundreds of UK dealers who've already made the switch. Start your free 14-day trial today.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/login?mode=signup">
                  <Button size="lg" className="glow h-13 px-8 text-base font-semibold">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg" className="h-13 px-8">
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
