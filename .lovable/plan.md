

# Public Pages Design Improvement Plan

After reviewing all six public pages, here's what I'd recommend upgrading. The homepage was recently redesigned to a high standard -- these pages should now match that level of polish, depth, and conversion focus.

---

## 1. Features Page (`/features`)

**Current state:** A simple heading + 2-column grid of 14 feature cards. Feels flat and monotonous -- every feature looks identical.

**Proposed improvements:**
- Add a hero section with a tagline badge (like the homepage) and stronger copy
- Group features into categories (e.g. "Sales & CRM", "Aftersales & Compliance", "Operations & Reporting") with section headings
- Highlight 3-4 key features with larger, more detailed cards (icon, title, 3-4 bullet points) while keeping secondary features in a compact grid
- Add a bottom CTA section ("Ready to see it in action? Start your free trial")
- Add staggered `fadeUp` animations consistent with the homepage style

---

## 2. Pricing Page (`/pricing`)

**Current state:** Clean 3-column layout with Starter/Professional/Enterprise. Functional but lacks depth.

**Proposed improvements:**
- Add a toggle for monthly vs annual pricing (with a "Save 20%" badge on annual)
- Add a FAQ/accordion section below the cards addressing common objections (e.g. "Can I switch plans?", "Is there a setup fee?", "What happens after my trial?")
- Add a "Compare all features" expandable table showing tick/cross per plan
- Improve the pricing teaser on the homepage to match (currently says "from £49" but Starter is £99 -- fix this inconsistency)
- Add a "Not sure? Talk to us" CTA at the bottom linking to the demo dialog
- Add trust badges row (same as homepage)

---

## 3. Contact Page (`/contact`)

**Current state:** Basic form that doesn't actually save data (just shows a toast). No contact details shown.

**Proposed improvements:**
- Actually submit form data to the `contact_leads` table (currently it does nothing)
- Add a two-column layout: form on the right, company info on the left (email address, phone, business hours, registered address)
- Add a "Prefer a quick demo?" button that opens the existing `DemoRequestDialog`
- Add expected response time ("We typically respond within 4 business hours")
- Trigger the auto-responder email on submission (same as demo requests)

---

## 4. Security Page (`/security`)

**Current state:** Heading + 6 cards in a 2-column grid. Reads more like a checklist than a trust-building page.

**Proposed improvements:**
- Add a hero section with a shield/lock visual motif and stronger headline (e.g. "Your data, locked down")
- Add a "Certifications & Standards" row with badge-style items (GDPR, ICO registered, ISO 27001 ready, UK data centres)
- Add a "How we protect your data" section with a simple 3-step visual flow (Encrypt > Isolate > Audit)
- Add a "Questions about security?" CTA at the bottom linking to contact
- Use the glass card styling from the homepage for visual consistency

---

## 5. Support Page (`/support`)

**Current state:** 4 cards and a "Contact Us" button. Very thin -- feels like a placeholder.

**Proposed improvements:**
- Add SLA comparison table by plan tier (response times, channels, dedicated support)
- Add an "Onboarding process" section with a 3-step timeline (Setup call > Data import > Go live)
- Add a "Common questions" FAQ accordion section
- Add contact details (support email, operating hours)
- Add a "Need help now?" CTA that opens the demo dialog or links to contact

---

## 6. Footer

**Current state:** Functional but basic. Legal links are placeholder text (not actual links).

**Proposed improvements:**
- Add social media icon links (placeholder hrefs for now)
- Make Privacy Policy and Terms of Service actual route links (create simple placeholder pages)
- Add a mini newsletter signup or "Request a demo" CTA in the footer
- Add a tagline under the logo ("Purpose-built for UK motor trade")

---

## 7. Login Page

**Current state:** Clean and functional. The dev quick-login buttons are visible -- these should be hidden in production but are fine for now.

**Proposed improvements:**
- Minor: add a subtle background pattern or gradient to match the homepage aesthetic
- Add a small "What is DealerOps?" link for visitors who land directly on the login page

---

## Technical Details

- All pages will use the same `fadeUp` animation variants and `motion` patterns from the homepage for consistency
- New FAQ sections will use the existing Radix `Accordion` component
- The Contact form will be wired to insert into `contact_leads` and invoke the `send-demo-confirmation` edge function
- The pricing inconsistency (homepage says "from £49" but cheapest plan is £99) will be corrected
- No new dependencies needed -- everything uses existing `framer-motion`, `lucide-react`, and Radix UI components
- Estimated files to create/modify: 7-8 files

