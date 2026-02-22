import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Users, Car, FileText, Shield, Wrench, Star, BarChart3,
  ClipboardCheck, MessageSquare, Briefcase, Bell, CarFront, Search, PenTool,
  ArrowRight, CheckCircle2, ImageIcon, ShieldAlert, PackageCheck, Target,
  FolderOpen, TrendingUp, UsersRound, ScrollText, LayoutDashboard, Bot
} from "lucide-react";
import dashboardPreview from "@/assets/dashboard-preview.png";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: "easeOut" as const },
  }),
};

function ImagePlaceholder({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-muted/20 p-8 min-h-[280px] text-muted-foreground">
      <ImageIcon className="h-10 w-10 mb-3 opacity-40" />
      <span className="text-xs text-center max-w-[200px] leading-relaxed">{label}</span>
    </div>
  );
}

const keyFeatures = [
  {
    icon: Users, title: "Customer CRM",
    description: "Complete customer profiles with contact details, communication logs, consent tracking, and linked vehicles.",
    bullets: ["Full timeline view with every interaction", "GDPR consent management built in", "Linked vehicles, invoices, and warranties", "Smart search and CSV export"],
    gradient: "from-blue-500/20 to-cyan-500/20",
    placeholder: "Product screenshot — CRM customer profile",
  },
  {
    icon: Wrench, title: "Aftersales & Complaints",
    description: "Case management with CRA guidance, SLA timers, and dispute resolution tools.",
    bullets: ["Consumer Rights Act decision engine", "Priority-based SLA tracking", "Evidence checklists and document uploads", "Dispute summary PDF generation"],
    gradient: "from-amber-500/20 to-orange-500/20",
    placeholder: "Product screenshot — Aftersales case detail",
  },
  {
    icon: Car, title: "Vehicle Stock Management",
    description: "Track your entire stock lifecycle from purchase to sale with real-time data checks.",
    bullets: ["DVLA, DVSA MOT & vehicle data checks", "Photos, documents, and status tracking", "CSV import/export and bulk actions", "Full ownership and mileage history"],
    gradient: "from-emerald-500/20 to-green-500/20",
    placeholder: "Product screenshot — Vehicle stock list",
  },
];

const categories = [
  {
    title: "Sales & CRM",
    description: "Win more deals and track every enquiry through to sale.",
    placeholder: "Product screenshot — Leads pipeline board",
    features: [
      { icon: Briefcase, title: "Leads Pipeline", description: "Visual pipeline board for managing enquiries, tracking conversion, and auto-creating follow-up tasks." },
      { icon: FileText, title: "Sale Invoices", description: "Professional invoices with line items, VAT, deposits, payment tracking, and PDF generation." },
      { icon: Search, title: "Vehicle Data Checks", description: "Real-time DVLA, DVSA MOT, tax status, advisories, and ownership data — all stored for audit." },
      { icon: PackageCheck, title: "Handovers", description: "Digital handover packs with checklists, photo capture, customer sign-off, and PDF generation." },
    ],
  },
  {
    title: "Aftersales & Legal",
    description: "Stay compliant and handle returns with confidence.",
    placeholder: "Product screenshot — CRA Shield assessment",
    features: [
      { icon: Wrench, title: "Aftersales & Complaints", description: "Full case management with SLA timers, priority routing, evidence uploads, and resolution tracking." },
      { icon: ShieldAlert, title: "CRA Shield", description: "Consumer Rights Act decision engine with risk ratings, time-window analysis, and recommended next steps." },
      { icon: Shield, title: "Warranties", description: "Manage internal and third-party warranties. Track expiry, costs, and generate certificates." },
    ],
  },
  {
    title: "Operations",
    description: "Run day-to-day operations smoothly with powerful tools.",
    placeholder: "Product screenshot — Courtesy car calendar",
    features: [
      { icon: CarFront, title: "Courtesy Cars", description: "Track loan vehicles with calendar view, agreements, fuel levels, damage records, and overdue alerts." },
      { icon: Target, title: "Tasks", description: "Task management with due dates, assignees, priority levels, and automatic reminders." },
      { icon: FolderOpen, title: "Documents", description: "Centralised document library with template generation for invoices, agreements, and certificates." },
      { icon: Star, title: "Review Booster", description: "Automated review request campaigns via email with template editor and tracking." },
    ],
  },
  {
    title: "Reporting & Team",
    description: "Data-driven insights and team performance tracking.",
    placeholder: "Product screenshot — KPI dashboard",
    features: [
      { icon: LayoutDashboard, title: "Dashboard", description: "Overview with live stats, recent activity, quick actions, and at-a-glance KPIs." },
      { icon: BarChart3, title: "Reports & KPIs", description: "Sales metrics, aftersales stats, date-filtered exportable reports, and trend analysis." },
      { icon: TrendingUp, title: "Staff KPIs", description: "Individual performance tracking with leaderboards, targets, and historical comparisons." },
      { icon: UsersRound, title: "Team Management", description: "Staff accounts, role-based access control, activity logs, and permission management." },
    ],
  },
  {
    title: "Compliance & Admin",
    description: "GDPR compliance, audit trails, and intelligent support.",
    placeholder: "Product screenshot — Compliance centre",
    features: [
      { icon: ClipboardCheck, title: "Compliance Centre", description: "GDPR consent records, data retention controls, customer data export, and right-to-erasure." },
      { icon: ScrollText, title: "Audit Log", description: "Full activity trail with user actions, timestamps, before/after data, and filterable search." },
      { icon: Bot, title: "Dealer AI Chat", description: "AI assistant trained on your dealership data to answer questions and draft responses." },
      { icon: MessageSquare, title: "Support Tickets", description: "In-app support ticketing with threaded messages, attachments, and priority-based routing." },
    ],
  },
];

export default function Features() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden py-16 md:py-20">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-xs text-primary mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              20+ integrated modules
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] mb-4">
              Every tool your dealership{" "}
              <span className="text-gradient">needs</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
              Comprehensive modules designed specifically for UK independent car dealers. No bolt-ons, no integrations to manage — it all works together.
            </p>
          </motion.div>

          {/* Hero placeholder image */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="max-w-5xl mx-auto mt-4"
          >
            <div className="rounded-2xl border border-border/40 bg-card/30 overflow-hidden shadow-2xl shadow-primary/10">
              <img
                src={dashboardPreview}
                alt="DealerOps dashboard showing revenue, customers, vehicles, and leads overview"
                className="w-full h-auto"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Key Features — larger cards with gradient backgrounds */}
      <section className="py-14 border-t border-border/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <span className="inline-block text-xs font-semibold text-primary uppercase tracking-widest mb-2">Core Platform</span>
              <h2 className="text-3xl md:text-4xl font-bold mb-3">Core modules</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">The three pillars that power your dealership operations.</p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {keyFeatures.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className={`relative rounded-2xl border border-primary/20 bg-gradient-to-br ${f.gradient} hover:border-primary/40 transition-all duration-500 overflow-hidden`}
              >
                <div className="p-7">
                  <div className="h-13 w-13 rounded-xl bg-background/50 backdrop-blur-sm flex items-center justify-center mb-4 border border-border/30">
                    <f.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{f.description}</p>
                  <ul className="space-y-2">
                    {f.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2.5 text-sm text-foreground">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="px-7 pb-7 pt-2">
                  <ImagePlaceholder label={f.placeholder} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categorised Features — alternating layout with image placeholders */}
      {categories.map((cat, catIdx) => {
        const isEven = catIdx % 2 === 0;
        return (
          <section key={cat.title} className={`py-14 border-t border-border/30 ${catIdx % 2 === 1 ? 'bg-muted/10' : ''}`}>
            <div className="container mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-8"
              >
                <span className="inline-block text-xs font-semibold text-primary uppercase tracking-widest mb-1">{`0${catIdx + 1}`}</span>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-1">{cat.title}</h2>
                <p className="text-sm text-muted-foreground">{cat.description}</p>
              </motion.div>

              <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 items-start`}>
                {/* Feature cards */}
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${!isEven ? 'lg:order-2' : ''}`}>
                  {cat.features.map((f, i) => (
                    <motion.div
                      key={f.title}
                      custom={i + catIdx * 4}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true }}
                      variants={fadeUp}
                      className="group flex gap-3 p-5 rounded-2xl border border-border/50 bg-card/30 hover:bg-card/60 hover:border-primary/20 transition-all duration-500 hover:shadow-lg hover:shadow-primary/5"
                    >
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                        <f.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground mb-1">{f.title}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Image placeholder */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className={`${!isEven ? 'lg:order-1' : ''}`}
                >
                  <ImagePlaceholder label={cat.placeholder} />
                </motion.div>
              </div>
            </div>
          </section>
        );
      })}

      {/* CTA */}
      <section className="py-16 border-t border-border/30 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <div className="rounded-3xl p-10 md:p-14 border border-primary/20 bg-gradient-to-br from-primary/10 via-card/80 to-card/50 backdrop-blur-sm shadow-2xl shadow-primary/5">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">Ready to see it in action?</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Start your free 14-day trial and explore every module with no commitment.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/login?mode=signup">
                  <Button size="lg" className="glow text-base px-8 h-13 font-semibold">
                    Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/pricing">
                  <Button variant="outline" size="lg" className="text-base px-8 h-13">
                    View Pricing
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
