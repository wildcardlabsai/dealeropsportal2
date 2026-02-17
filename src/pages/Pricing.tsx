import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, X, ArrowRight, ShieldCheck, Lock, Globe, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DemoRequestDialog } from "@/components/public/DemoRequestDialog";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: "easeOut" as const },
  }),
};

const plans = [
  {
    name: "Starter",
    monthly: 99,
    annual: 79,
    description: "For single-site dealers getting started",
    features: [
      "Up to 3 users",
      "Customer CRM",
      "Vehicle stock management",
      "Sale invoices & PDFs",
      "Basic warranties",
      "50 vehicle checks/month",
      "Email support",
    ],
    cta: "Start Free Trial",
    highlighted: false,
  },
  {
    name: "Professional",
    monthly: 125,
    annual: 99,
    description: "For growing dealerships that need more",
    features: [
      "Up to 10 users",
      "Everything in Starter",
      "Aftersales & complaints",
      "CRA Shield module",
      "Courtesy car tracking",
      "Leads pipeline CRM",
      "Review Booster",
      "200 vehicle checks/month",
      "Reports & KPIs",
      "Priority support",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Elite",
    monthly: 199,
    annual: 159,
    description: "For high-volume and multi-site dealers",
    features: [
      "Unlimited users",
      "Everything in Professional",
      "Unlimited vehicle checks",
      "Document storage",
      "Compliance centre",
      "Audit logging",
      "Dedicated account manager",
      "SLA support",
    ],
    cta: "Start Free Trial",
    highlighted: false,
  },
];

const comparisonFeatures = [
  { name: "Users", starter: "3", pro: "10", enterprise: "Unlimited" },
  { name: "Customer CRM", starter: true, pro: true, enterprise: true },
  { name: "Vehicle Stock", starter: true, pro: true, enterprise: true },
  { name: "Sale Invoices & PDFs", starter: true, pro: true, enterprise: true },
  { name: "Warranties", starter: "Basic", pro: true, enterprise: true },
  { name: "Vehicle Checks", starter: "50/mo", pro: "200/mo", enterprise: "Unlimited" },
  { name: "Aftersales & Complaints", starter: false, pro: true, enterprise: true },
  { name: "CRA Shield", starter: false, pro: true, enterprise: true },
  { name: "Courtesy Cars", starter: false, pro: true, enterprise: true },
  { name: "Leads Pipeline", starter: false, pro: true, enterprise: true },
  { name: "Review Booster", starter: false, pro: true, enterprise: true },
  { name: "Reports & KPIs", starter: false, pro: true, enterprise: true },
  { name: "Compliance Centre", starter: false, pro: false, enterprise: true },
  { name: "Document Storage", starter: false, pro: false, enterprise: true },
  { name: "Audit Logging", starter: false, pro: false, enterprise: true },
  { name: "Dedicated Account Manager", starter: false, pro: false, enterprise: true },
];

const faqs = [
  { q: "Is there a setup fee?", a: "No. All plans include free onboarding and setup assistance. We'll help you import your existing data at no extra cost." },
  { q: "Can I switch plans later?", a: "Yes — you can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle." },
  { q: "What happens after my trial?", a: "Your 14-day trial includes full Professional plan access. After that, choose the plan that fits your dealership. No automatic charges." },
  { q: "Do you offer discounts for multi-site groups?", a: "Yes — Enterprise pricing is custom and includes volume discounts. Contact us for a tailored quote." },
  { q: "How long is the contract?", a: "Monthly plans are rolling — cancel anytime with 30 days' notice. Annual plans are paid upfront with a 20% discount." },
  { q: "Is my data secure?", a: "Absolutely. All data is encrypted at rest and in transit, with row-level tenant isolation and full audit logging. We're GDPR compliant and UK-hosted." },
];

const trustBadges = [
  { icon: ShieldCheck, label: "GDPR Compliant" },
  { icon: Lock, label: "256-bit Encryption" },
  { icon: Globe, label: "UK-Based Support" },
  { icon: Award, label: "ISO 27001 Ready" },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              Simple, transparent{" "}
              <span className="text-gradient">pricing</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
              No hidden fees. No long contracts. Choose the plan that fits your dealership.
            </p>

            {/* Toggle */}
            <div className="inline-flex items-center gap-3 p-1 rounded-full border border-border bg-muted/50">
              <button
                onClick={() => setAnnual(false)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${!annual ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all relative ${annual ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Annual
                <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-success text-[10px] font-bold text-success-foreground">
                  -20%
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Plans */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className={`relative flex flex-col p-6 rounded-xl border ${
                  plan.highlighted
                    ? "border-primary/50 bg-card glow"
                    : "border-border/50 bg-card/50"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    Most Popular
                  </div>
                )}

                <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                <div className="mt-2 mb-1">
                  {plan.monthly ? (
                    <>
                      <span className="text-3xl font-bold text-foreground">
                        £{annual ? plan.annual : plan.monthly}
                      </span>
                      <span className="text-sm text-muted-foreground">/month</span>
                      {annual && (
                        <span className="ml-2 text-xs text-muted-foreground line-through">
                          £{plan.monthly}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-3xl font-bold text-foreground">Custom</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-6">{plan.description}</p>

                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link to={plan.cta === "Start Free Trial" ? "/login?mode=signup" : "/contact"}>
                  <Button
                    className={`w-full ${plan.highlighted ? "glow" : ""}`}
                    variant={plan.highlighted ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-8">
            All plans include a 14-day free trial. No credit card required to start.
          </p>
        </div>
      </section>

      {/* Trust badges */}
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

      {/* Feature Comparison */}
      <section className="py-16 border-t border-border/30">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-8">
            <Button
              variant="outline"
              onClick={() => setShowComparison(!showComparison)}
            >
              {showComparison ? "Hide" : "Compare all features"}
            </Button>
          </div>

          {showComparison && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="overflow-hidden"
            >
              <div className="rounded-xl border border-border/50 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      <th className="text-left p-3 font-medium text-foreground">Feature</th>
                      <th className="p-3 font-medium text-foreground text-center">Starter</th>
                      <th className="p-3 font-medium text-primary text-center">Professional</th>
                      <th className="p-3 font-medium text-foreground text-center">Elite</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonFeatures.map((f) => (
                      <tr key={f.name} className="border-b border-border/30">
                        <td className="p-3 text-foreground">{f.name}</td>
                        {[f.starter, f.pro, f.enterprise].map((val, idx) => (
                          <td key={idx} className="p-3 text-center">
                            {val === true ? (
                              <Check className="h-4 w-4 text-success mx-auto" />
                            ) : val === false ? (
                              <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                            ) : (
                              <span className="text-xs text-muted-foreground">{val}</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 border-t border-border/30">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-12">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-3xl font-bold mb-4">Frequently asked questions</h2>
              <p className="text-muted-foreground">Everything you need to know about our plans.</p>
            </motion.div>
          </div>

          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-border/50 rounded-xl px-4 bg-card/50">
                <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-border/30">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <div className="glass rounded-2xl p-12 glow">
              <h2 className="text-3xl font-bold mb-4">Not sure which plan?</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Talk to our team and we'll help you find the right fit for your dealership.
              </p>
              <Button size="lg" className="glow text-base px-8 h-12" onClick={() => setDemoOpen(true)}>
                Request a Demo <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <DemoRequestDialog open={demoOpen} onOpenChange={setDemoOpen} />
    </div>
  );
}
