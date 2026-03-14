import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import {
  Car, Users, Shield, FileText, Wrench, Star,
  BarChart3, ClipboardCheck, ArrowRight, CheckCircle2,
  Headphones, Globe, Zap, ChevronRight
} from "lucide-react";
import dashboardPreview from "@/assets/dashboard-preview.png";

/* ─── data ─── */

const modules = [
  { icon: Car, title: "Vehicle Management", description: "Stock control, DVLA/MOT checks, vehicle lifecycle, and photo galleries." },
  { icon: Users, title: "Customer CRM", description: "Full profiles, communication logs, consent tracking, and GDPR tools." },
  { icon: FileText, title: "Invoicing", description: "Professional sale invoices with PDF generation and payment tracking." },
  { icon: Shield, title: "Warranties", description: "Manage policies, track claims, and generate warranty certificates." },
  { icon: Wrench, title: "Aftersales & CRA", description: "Case management with Consumer Rights Act guidance and SLA tracking." },
  { icon: Star, title: "Review Booster", description: "Automated review requests for Google and Trustpilot ratings." },
  { icon: BarChart3, title: "Reports & KPIs", description: "Staff performance, sales metrics, and exportable business insights." },
  { icon: ClipboardCheck, title: "Compliance Centre", description: "GDPR consent records, data retention, and full audit trail." },
];

const benefits = [
  { icon: Zap, title: "Purpose-Built for UK Trade", description: "Designed specifically for independent UK motor dealers with DVLA and DVSA integrations." },
  { icon: Users, title: "Multi-Site & Multi-User", description: "Role-based access control across your entire operation, however many sites you have." },
  { icon: Shield, title: "GDPR & FCA Compliant", description: "Full audit logging, consent tracking, and data retention policies included." },
  { icon: Globe, title: "Cloud-Based, Any Device", description: "Secure, accessible anywhere. No installations, no servers, no IT team needed." },
  { icon: Headphones, title: "UK-Based Support", description: "Real human support from a team who understand the motor trade." },
  { icon: BarChart3, title: "No Lock-In Contracts", description: "Flexible monthly plans that grow with your business. Cancel anytime." },
];

const testimonials = [
  { name: "James Hartley", role: "Director, Hartley Motors", quote: "DealerOps has completely transformed how we manage aftersales. What used to take hours now takes minutes.", initials: "JH" },
  { name: "Sarah Mitchell", role: "Ops Manager, Mitchell Cars", quote: "The compliance centre alone is worth it. We passed our FCA audit with zero findings thanks to the audit trail.", initials: "SM" },
  { name: "David Chen", role: "Owner, Premier Autos", quote: "We went from spreadsheets to DealerOps in a week. Best decision we've made for the business.", initials: "DC" },
];

const stats = [
  { value: 2500, suffix: "+", label: "Vehicles Managed" },
  { value: 150, suffix: "+", label: "Dealerships" },
  { value: 99.9, suffix: "%", label: "Uptime" },
  { value: 50, suffix: "k+", label: "Invoices Generated" },
];

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
      if (current >= value) { setDisplay(value); clearInterval(timer); }
      else { setDisplay(Math.floor(current * 10) / 10); }
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

/* ─── fade animation ─── */

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const }
  }),
};

/* ─── page ─── */

export default function Index() {
  return (
    <div>
      {/* ═══ Hero ═══ */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-primary/[0.04] blur-[120px] -translate-y-1/2 translate-x-1/3" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-14">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-sm font-medium text-primary mb-5">Dealership Management Software</p>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] text-foreground mb-6">
                The smarter way to run your dealership
              </h1>

              <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed">
                Modernise your stock management, sales, aftersales, compliance, and customer communications — all from one platform.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link to="/login?mode=signup">
                  <Button size="lg" className="h-12 px-7 text-base font-semibold shadow-md">
                    Try For Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/features">
                  <Button variant="outline" size="lg" className="h-12 px-7 text-base">
                    View Features
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <p className="text-xs text-muted-foreground mt-4">No credit card required · 14-day free trial · Cancel anytime</p>
            </motion.div>
          </div>

          {/* Product screenshot */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="max-w-5xl mx-auto"
          >
            <div className="rounded-xl border border-border bg-card shadow-xl overflow-hidden">
              <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border bg-muted/50">
                <div className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-warning/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-success/60" />
                <span className="ml-3 text-[11px] text-muted-foreground font-mono">app.dealerops.co.uk</span>
              </div>
              <img
                src={dashboardPreview}
                alt="DealerOps dashboard showing revenue, customers, vehicles, and leads overview"
                className="w-full h-auto"
                loading="eager"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ Social Proof Stats ═══ */}
      <section className="py-16 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            {stats.map((stat) => (
              <AnimatedCounter key={stat.label} {...stat} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Modules Grid ═══ */}
      <section className="py-20 bg-muted/30 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <p className="text-sm font-medium text-primary mb-2">All-in-One Platform</p>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Everything you need, in one place</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Powerful modules that work together to streamline every part of your dealership operations.
              </p>
            </motion.div>
          </div>

          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {modules.map((mod, i) => (
              <motion.div
                key={mod.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="group p-6 rounded-xl border border-border bg-background hover:border-primary/30 hover:shadow-md transition-all duration-300"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                  <mod.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-foreground mb-2">{mod.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{mod.description}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link to="/features">
              <Button variant="outline">
                View all features <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ Benefits ═══ */}
      <section className="py-20 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <p className="text-sm font-medium text-primary mb-2">Why DealerOps</p>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Built for the UK motor trade</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Not another generic CRM. DealerOps is purpose-built for how independent dealers actually work.
              </p>
            </motion.div>
          </div>

          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((item, i) => (
              <motion.div
                key={item.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="flex gap-4"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ How it Works ═══ */}
      <section className="py-20 bg-muted/30 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <p className="text-sm font-medium text-primary mb-2">Getting Started</p>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Up and running in minutes</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                No complex setup, no IT team needed. Start managing your dealership today.
              </p>
            </motion.div>
          </div>

          <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { step: "1", title: "Sign Up", desc: "Create your account and tell us about your dealership. Takes under 5 minutes." },
              { step: "2", title: "Import Data", desc: "Bring your existing stock, customers, and records across with simple import tools." },
              { step: "3", title: "Go Live", desc: "Start managing everything from one unified dashboard — anywhere, any device." },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="text-center"
              >
                <div className="inline-flex h-12 w-12 rounded-full bg-primary text-primary-foreground text-lg font-bold items-center justify-center mb-4">
                  {s.step}
                </div>
                <h3 className="text-base font-bold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Testimonials ═══ */}
      <section className="py-20 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <p className="text-sm font-medium text-primary mb-2">Testimonials</p>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Trusted by dealers across the UK</h2>
            </motion.div>
          </div>

          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="p-6 rounded-xl border border-border bg-background"
              >
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-sm text-foreground leading-relaxed mb-5">"{t.quote}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Pricing Teaser ═══ */}
      <section className="py-16 bg-muted/30 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">Simple, transparent pricing</h2>
            <p className="text-muted-foreground mb-6">
              Plans from <span className="text-foreground font-semibold">£99/month</span>. No setup fees, no hidden costs.
            </p>
            <Link to="/pricing">
              <Button variant="outline" size="lg">
                View Pricing <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══ Final CTA ═══ */}
      <section className="py-20 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Ready to get started?</h2>
            <p className="text-muted-foreground mb-8">
              Join hundreds of UK dealers who've already made the switch. Start your free 14-day trial today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/login?mode=signup">
                <Button size="lg" className="h-12 px-8 text-base font-semibold shadow-md">
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
            <p className="text-xs text-muted-foreground mt-4">No credit card required · Setup in under 10 minutes</p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
