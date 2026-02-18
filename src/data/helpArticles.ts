export interface HelpArticle {
  id: string;
  title: string;
  module: string;
  moduleIcon: string;
  summary: string;
  content: string; // markdown-ish plain text with \n\n for paragraphs
  tags: string[];
}

export const helpModules = [
  { key: "customers", label: "Customers & CRM", icon: "Users" },
  { key: "vehicles", label: "Vehicles & Stock", icon: "Car" },
  { key: "invoices", label: "Invoicing", icon: "FileText" },
  { key: "leads", label: "Leads", icon: "Target" },
  { key: "aftersales", label: "Aftersales", icon: "Wrench" },
  { key: "cra", label: "CRA Shield", icon: "ShieldAlert" },
  { key: "handovers", label: "Handovers", icon: "PackageCheck" },
  { key: "warranties", label: "Warranties", icon: "Shield" },
  { key: "compliance", label: "Compliance Centre", icon: "ShieldCheck" },
  { key: "courtesy", label: "Courtesy Cars", icon: "CarFront" },
  { key: "checks", label: "Vehicle Checks", icon: "Search" },
  { key: "reviews", label: "Review Booster", icon: "Star" },
  { key: "team", label: "Team & KPIs", icon: "Users" },
  { key: "billing", label: "Billing & Plans", icon: "CreditCard" },
];

export const helpArticles: HelpArticle[] = [
  // ── CUSTOMERS ──────────────────────────────────────────────────────────────
  {
    id: "customers-overview",
    title: "Managing Customers",
    module: "customers",
    moduleIcon: "Users",
    summary: "How to add, view, and manage customer records in DealerOps.",
    tags: ["customers", "crm", "contact"],
    content: `Customers are the foundation of DealerOps. Every invoice, vehicle sale, aftersales case, and handover is linked to a customer record.

**Adding a customer**
Go to Customers → New Customer. Fill in the name, contact details, and address. Marketing consent can be captured at this point and is stored for GDPR purposes.

**Customer profile**
Each customer has a full profile page showing their purchase history, linked vehicles, active warranties, aftersales cases, and communication history. Use the profile as the single source of truth for everything related to that customer.

**Soft delete**
Deleting a customer marks them as deleted but retains all their historical records. This is intentional to preserve audit trail integrity. Deleted customers are hidden from lists.

**Preferred contact method**
You can record how a customer prefers to be contacted (phone, email, post). This is shown on their profile as a quick reference.`,
  },
  {
    id: "customers-consent",
    title: "GDPR Consent & Marketing",
    module: "customers",
    moduleIcon: "Users",
    summary: "How marketing consent is captured, stored, and respected.",
    tags: ["gdpr", "consent", "marketing", "customers"],
    content: `DealerOps stores marketing consent at the point of customer creation or when consent is explicitly captured.

**Capturing consent**
When adding a customer, you can tick the marketing consent checkbox. This records the exact date and time consent was given, as required by UK GDPR.

**Withdrawing consent**
If a customer withdraws consent, update their record immediately. The withdrawal date is stored separately from the original consent date.

**Data Subject Requests (DSRs)**
If a customer makes a Subject Access Request or Right to Erasure request, handle it via Compliance Centre → DSR. DealerOps tracks the 30-day statutory deadline automatically.

**Data retention**
Your data retention period is set in Settings → Compliance. The default is 36 months. Records older than this are flagged for review.`,
  },

  // ── VEHICLES ───────────────────────────────────────────────────────────────
  {
    id: "vehicles-overview",
    title: "Managing Stock & Vehicles",
    module: "vehicles",
    moduleIcon: "Car",
    summary: "Adding vehicles to stock, running checks, and tracking ownership.",
    tags: ["vehicles", "stock", "vrm", "vin"],
    content: `Vehicles sit at the core of your dealership's operations. DealerOps lets you track every vehicle from acquisition to sale.

**Adding a vehicle**
Go to Vehicles → New Vehicle. Enter the VRM and use the VRM Lookup to auto-fill make, model, colour, and registration data from the DVLA and DVSA databases.

**Stock status**
Vehicles can be marked as: In Stock, Reserved, Sold, or Pending. This status updates automatically when an invoice is raised.

**Linking a customer**
A vehicle can be linked to a customer from the vehicle profile (Ownership tab), or when creating a vehicle from a customer's profile page.

**MOT history**
The Vehicle Check feature pulls MOT history, advisory notices, and mileage anomalies directly from the DVSA. Run a check from the vehicle profile or via the Vehicle Checks module.

**Part-exchange**
When creating an invoice, you can record a part-exchange vehicle using the VRM Lookup to auto-populate its details.`,
  },

  // ── INVOICES ───────────────────────────────────────────────────────────────
  {
    id: "invoices-overview",
    title: "Creating & Managing Invoices",
    module: "invoices",
    moduleIcon: "FileText",
    summary: "Raise invoices, record part-exchanges, and track payment status.",
    tags: ["invoices", "payment", "vat", "part-exchange"],
    content: `DealerOps invoices cover vehicle sales, service work, and any other chargeable item.

**Creating an invoice**
Go to Invoices → New Invoice. Select the customer and vehicle, add line items, and apply VAT as required. Invoice numbers are generated automatically per dealer.

**Part-exchange**
Use the Part-Exchange section and the VRM Lookup to auto-fill the PX vehicle's details. Enter the agreed PX value and it is deducted from the balance due.

**Payment status**
Invoices move through: Draft → Sent → Paid → Cancelled. Update the status when payment is received.

**Review Booster trigger**
In Settings → Preferences, you can set invoices to automatically trigger a review request when marked as Paid. The review request is sent via the Review Booster module.

**PDF export**
Each invoice can be downloaded as a PDF. The header uses your dealership logo, brand colour, and bank details as set in Settings → Branding.`,
  },

  // ── LEADS ──────────────────────────────────────────────────────────────────
  {
    id: "leads-overview",
    title: "Managing Leads",
    module: "leads",
    moduleIcon: "Target",
    summary: "Track enquiries from first contact through to sale.",
    tags: ["leads", "enquiries", "pipeline", "conversion"],
    content: `Leads represent prospective customers who have expressed interest in a vehicle or service.

**Creating a lead**
Go to Leads → New Lead. Record the source (walk-in, phone, website, referral), the vehicle of interest, and the customer's contact details.

**Lead statuses**
Leads progress through: New → Contacted → Qualified → Proposal → Won → Lost. Update the status after each interaction.

**Converting a lead**
When a lead converts, create an Invoice from the lead profile. The customer and vehicle details carry across automatically.

**Lost leads**
Always record a reason when marking a lead as Lost. This feeds into the Reports module so you can identify patterns (price, timing, competitor lost to, etc.).`,
  },

  // ── AFTERSALES ─────────────────────────────────────────────────────────────
  {
    id: "aftersales-overview",
    title: "Aftersales Cases",
    module: "aftersales",
    moduleIcon: "Wrench",
    summary: "Log, track, and resolve post-sale complaints and warranty issues.",
    tags: ["aftersales", "complaint", "warranty", "sla"],
    content: `The Aftersales module is where you manage post-sale issues — complaints, warranty claims, mechanical faults, and goodwill gestures.

**Opening a case**
Go to Aftersales → New Case. Link the case to a customer and vehicle, select the issue category, set the priority, and record the initial description.

**SLA tracking**
Each case has an SLA target (default 72 hours for first response, configurable in Settings). The case list shows cases that are approaching or have breached their SLA in amber/red.

**Case updates**
Log every customer contact, internal note, or status change as a case update. This creates a full audit trail of how the case was handled.

**Escalation to CRA Shield**
If a customer is asserting their rights under the Consumer Rights Act 2015, escalate the case to CRA Shield using the button on the case detail page.

**Resolution**
When resolved, record the resolution notes and outcome (resolved, goodwill, rejection, etc.). The case is then closed and retained for audit purposes.`,
  },
  {
    id: "aftersales-sla",
    title: "Aftersales SLA & Priority",
    module: "aftersales",
    moduleIcon: "Wrench",
    summary: "How SLA targets and priority levels work in aftersales cases.",
    tags: ["sla", "priority", "aftersales", "response time"],
    content: `SLA (Service Level Agreement) targets help ensure customers receive timely responses to post-sale complaints.

**Default SLA**
The default first-response SLA is 72 hours. This can be changed in Settings → Preferences → Aftersales First Response SLA.

**Priority levels**
Cases are assigned a priority of Low, Medium, or High. High-priority cases (e.g. a customer without a roadworthy vehicle) should be escalated and responded to within 24 hours.

**SLA indicators**
The aftersales list uses colour coding: green (within SLA), amber (approaching breach), red (breached).

**FCA complaints**
If a complaint involves a regulated product (e.g. finance), it must be resolved within 8 weeks under FCA rules. Use the Compliance Centre → Complaints tab to track these separately.`,
  },

  // ── CRA SHIELD ─────────────────────────────────────────────────────────────
  {
    id: "cra-overview",
    title: "CRA Shield Overview",
    module: "cra",
    moduleIcon: "ShieldAlert",
    summary: "How CRA Shield works and when to use it.",
    tags: ["cra", "consumer rights act", "rejection", "30 day", "6 month"],
    content: `CRA Shield helps you assess and respond to claims made under the Consumer Rights Act 2015 (CRA). It guides you through a structured assessment and generates appropriate customer responses.

**When to use CRA Shield**
Use it whenever a customer is claiming a right under the CRA — short-term right to reject (30 days), repair or replacement (6 months), or long-term right to reject (after 6 months). Do NOT use it for general aftersales complaints.

**Time windows**
The CRA operates in three time windows:
- 0–30 days: Customer has a short-term right to reject the goods and receive a full refund.
- 30 days–6 months: The fault is presumed to have been present at sale. The dealer gets one opportunity to repair.
- After 6 months: The burden of proof shifts to the customer to prove the fault was present at sale.

**Risk rating**
CRA Shield outputs a risk rating (Low, Medium, High) based on the information entered — days since sale, fault type, evidence available, mileage, and more. A higher risk means the customer's claim is stronger.

**Customer responses**
CRA Shield generates three draft customer responses: Standard (factual), De-escalation (conciliatory), and Firm (assertive). Choose the tone appropriate to the situation.

**Evidence checklist**
Review the evidence checklist before responding. Having a signed PDI, service history, pre-delivery photos, and a diagnostic report significantly strengthens your position.`,
  },
  {
    id: "cra-risk-rating",
    title: "Understanding CRA Risk Ratings",
    module: "cra",
    moduleIcon: "ShieldAlert",
    summary: "What the Low / Medium / High risk rating means and how it is calculated.",
    tags: ["cra", "risk", "risk rating", "assessment"],
    content: `The risk rating is CRA Shield's assessment of how strong the customer's legal claim is likely to be. It does not constitute legal advice.

**Low risk**
The customer's claim is unlikely to succeed. Typically: fault reported after 6 months, vehicle has high mileage since sale, customer has modified the vehicle, or there is no evidence of an inherent fault.

**Medium risk**
The claim has some merit but is not clear-cut. Typically: fault reported in the 30-day to 6-month window, mixed evidence, or a borderline fault category.

**High risk**
The customer's claim is likely to succeed. Typically: fault within 30 days, clear evidence of an inherent defect, no PDI or pre-delivery photos, mileage anomalies.

**What affects the rating**
Days since sale, sale type (business/private), fault category, diagnostic report presence, mileage at sale vs issue, PDI completeness, and whether warning lights were present at handover.

**Important note**
A high risk rating does not mean you must accept the rejection. It means you should seek legal advice before refusing. Documenting everything clearly (via the evidence checklist) is always the best course of action.`,
  },

  // ── HANDOVERS ──────────────────────────────────────────────────────────────
  {
    id: "handovers-overview",
    title: "Vehicle Handovers",
    module: "handovers",
    moduleIcon: "PackageCheck",
    summary: "Creating and completing a vehicle handover with or without a customer signature.",
    tags: ["handover", "signature", "checklist", "delivery"],
    content: `The Handover module lets you document the formal delivery of a vehicle to a customer, ensuring all checks are completed and the customer has been informed of key information.

**Creating a handover**
Go to Handovers → New Handover. Link the customer, vehicle, and invoice. Set the handover date and assign a staff member.

**Checklist**
The handover checklist covers: documents provided (V5, warranty, service history), condition walkround, key handover, fuel level, tyre condition, and more. Use "Select All" to mark all items at once.

**Customer signature**
The customer can sign digitally on-screen using the signature pad. A signed handover is the strongest evidence that the vehicle was delivered in agreed condition.

**Complete without signature**
For internal handovers, fleet deliveries, or remote transactions where signing in person isn't possible, use "Complete (No Sig)" to finalise the handover record without a signature. This is noted in the record.

**Why handovers matter for CRA**
A signed handover acknowledgement is listed in the CRA Shield evidence checklist. It is one of the strongest pieces of evidence that the vehicle was delivered as described and that the customer had the opportunity to inspect it.`,
  },

  // ── WARRANTIES ─────────────────────────────────────────────────────────────
  {
    id: "warranties-overview",
    title: "Managing Warranties",
    module: "warranties",
    moduleIcon: "Shield",
    summary: "Adding and tracking warranty cover for vehicles you sell.",
    tags: ["warranty", "cover", "duration", "claim"],
    content: `Warranties track the cover provided to customers on vehicles purchased from your dealership.

**Adding a warranty**
Go to Warranties → New Warranty. Link to the customer and vehicle, set the start and end dates, and record the warranty type (dealer, third-party, manufacturer).

**Warranty duration**
Enter the duration in months. DealerOps will show a warning when a warranty is approaching or has passed its expiry date.

**Claims**
Log warranty claims against a warranty record. Each claim records the fault, parts, labour cost, and resolution. This feeds into aftersales and CRA Shield assessments.

**Linking to aftersales**
When opening an aftersales case, you can link it to an active warranty. If a fault is covered under warranty, CRA Shield factors this into the risk rating.`,
  },

  // ── COMPLIANCE ─────────────────────────────────────────────────────────────
  {
    id: "compliance-overview",
    title: "Compliance Centre Overview",
    module: "compliance",
    moduleIcon: "ShieldCheck",
    summary: "What the Compliance Centre covers and how to use it effectively.",
    tags: ["compliance", "gdpr", "fca", "dsr", "complaint", "policy"],
    content: `The Compliance Centre is your hub for GDPR, FCA, and operational compliance. It is structured into separate tabs for each compliance area.

**Tabs overview**
- Policies: Store and version your compliance documents (privacy policy, data protection policy, complaints procedure, etc.)
- Complaints: Track formal complaints, especially those that may be regulated under FCA rules.
- DSR (Data Subject Requests): Manage Subject Access Requests and Right to Erasure requests within the 30-day deadline.
- Consents: View and manage GDPR marketing consents for all customers.
- Incidents: Log data breaches or compliance incidents for ICO reporting.
- Retention: Review records approaching or exceeding your data retention period.
- Audit: View the full compliance audit log.

**ICO registration**
Your ICO number is stored in Settings → Dealer Profile. Ensure it is kept up to date — it is displayed on documents and used for compliance reporting.

**FCA number**
If you sell regulated finance, your FCA number must be visible on all customer-facing documents. DealerOps includes it in invoice PDFs automatically once set in Settings.`,
  },
  {
    id: "compliance-dsr",
    title: "Data Subject Requests (DSR)",
    module: "compliance",
    moduleIcon: "ShieldCheck",
    summary: "How to handle Subject Access Requests and Right to Erasure within the 30-day deadline.",
    tags: ["dsr", "sar", "gdpr", "right to erasure", "subject access"],
    content: `Under UK GDPR, individuals have rights over their personal data. DealerOps helps you manage these requests within the statutory timeframe.

**Opening a DSR**
Go to Compliance → DSR → New Request. Record the requester's name, contact details, request type, and date received. The 30-day deadline is calculated automatically.

**Request types**
- Subject Access Request (SAR): The individual wants to see all data you hold on them.
- Right to Erasure: The individual wants their data deleted.
- Right to Rectification: The individual wants incorrect data corrected.
- Portability: The individual wants their data in a portable format.

**Identity verification**
Before fulfilling a DSR, verify the requester's identity. Record verification notes in the DSR record.

**Completing a DSR**
Update the status as you progress (New → In Progress → Completed). Record the outcome and any data exported or deleted.

**Breach of the deadline**
Failing to respond within 30 days is an ICO reportable failure. DealerOps highlights overdue DSRs in red on the DSR list.`,
  },
  {
    id: "compliance-incidents",
    title: "Logging Compliance Incidents",
    module: "compliance",
    moduleIcon: "ShieldCheck",
    summary: "How to log and manage data breaches and compliance incidents.",
    tags: ["incident", "data breach", "ico", "gdpr", "compliance"],
    content: `A compliance incident is any event that could compromise the security or privacy of personal data — including data breaches, accidental disclosures, or system failures.

**When to log an incident**
Log any incident where personal data may have been exposed, lost, or accessed without authorisation — even if you are not certain it constitutes a reportable breach.

**Severity levels**
- Low: Minor issue, no personal data exposed, no regulatory risk.
- Medium: Potential exposure, limited in scope, being investigated.
- High: Confirmed data breach with regulatory reporting likely required.

**ICO reporting**
Under UK GDPR, certain breaches must be reported to the ICO within 72 hours. A breach is reportable if it is likely to result in a risk to individuals' rights and freedoms. If in doubt, report.

**Actions taken**
Record all actions taken to contain and remediate the incident. This log is essential if the ICO investigates.`,
  },

  // ── COURTESY CARS ──────────────────────────────────────────────────────────
  {
    id: "courtesy-overview",
    title: "Courtesy Car Fleet",
    module: "courtesy",
    moduleIcon: "CarFront",
    summary: "Managing your courtesy car fleet and loan agreements.",
    tags: ["courtesy car", "loan", "fleet", "agreement"],
    content: `The Courtesy Car module tracks your fleet of loan vehicles and generates loan agreements for customers.

**Adding a courtesy car**
Go to Courtesy Cars → New Car. Enter the VRM and the system will auto-fill vehicle details. Set the car's status to Available.

**Creating a loan**
When a customer needs a courtesy car, create a new loan from the Courtesy Car list or the car's profile. Record the mileage out, fuel level, and any existing damage. The customer should sign the loan agreement.

**Loan agreement**
The loan agreement records the terms, the customer's driving licence check, insurance confirmation, and deposit amount. This protects you in the event of damage or late return.

**Returning a car**
When the car is returned, update the loan record with the mileage in, fuel level in, and any damage on return. The car's status is automatically set back to Available.

**Insurance**
Always confirm the customer's insurance covers a courtesy vehicle before handing over keys. Record confirmation in the loan record.`,
  },

  // ── VEHICLE CHECKS ─────────────────────────────────────────────────────────
  {
    id: "checks-overview",
    title: "Vehicle Checks (MOT & DVLA)",
    module: "checks",
    moduleIcon: "Search",
    summary: "Running DVLA and DVSA checks on vehicles to get MOT history and vehicle data.",
    tags: ["vehicle check", "mot", "dvla", "dvsa", "mileage", "advisory"],
    content: `Vehicle Checks connect to the DVLA and DVSA APIs to retrieve real-time data on any UK-registered vehicle.

**Running a check**
Go to Vehicle Checks → New Check and enter the VRM. DealerOps queries the DVLA for registration data (make, model, colour, fuel type, tax and MOT status) and the DVSA for full MOT history.

**What you get**
- Current tax and MOT status
- Date of first registration and year of manufacture
- Full MOT test history including failures, advisories, and mileage at each test
- Mileage anomaly detection (if mileage decreases between MOTs)

**Using checks in CRA cases**
Mileage anomalies and advisory history from vehicle checks can be attached to CRA Shield cases as evidence. A clean MOT history at sale strengthens your position.

**Check history**
All checks are saved and linked to the vehicle. You can re-run a check at any time to get the latest data.`,
  },

  // ── REVIEW BOOSTER ─────────────────────────────────────────────────────────
  {
    id: "reviews-overview",
    title: "Review Booster",
    module: "reviews",
    moduleIcon: "Star",
    summary: "Automatically request Google and other reviews from satisfied customers.",
    tags: ["reviews", "google", "review booster", "reputation"],
    content: `Review Booster helps you build your online reputation by making it easy to send review requests to customers after a sale or service.

**Setting up review platforms**
In Review Booster → Platforms, add your Google Business review link and any other platforms (Trustpilot, AutoTrader, etc.).

**Sending a review request**
You can send a request manually from a customer profile, or set DealerOps to send automatically when an invoice is marked as Paid (configured in Settings → Preferences).

**What customers receive**
An email with a direct link to leave a review on your chosen platform. The message is branded with your dealership name.

**Best practice**
Send the review request within 24–48 hours of handover while the experience is fresh. Only send to customers where the sale went smoothly — do not send to customers with open aftersales cases.`,
  },

  // ── TEAM & KPIs ────────────────────────────────────────────────────────────
  {
    id: "team-overview",
    title: "Team Management",
    module: "team",
    moduleIcon: "Users",
    summary: "Adding team members, assigning roles, and managing access.",
    tags: ["team", "users", "roles", "access", "permissions"],
    content: `Team Management lets you control who can access DealerOps and what they can do.

**Roles**
- Dealer Admin: Full access to all modules and settings. Can add/remove team members.
- Staff: Standard access to operational modules. Cannot access billing, compliance, or admin settings.

**Adding a team member**
Go to Settings → Team → Add Team Member. Enter their name and email. They will receive an email with a link to set their password and log in.

**Changing a role**
From Team Management, use the role dropdown next to a team member's name to change their role. The change takes effect immediately.

**Removing a team member**
Removing a team member revokes their access immediately. Their historical records (invoices raised, cases created, etc.) are retained.`,
  },
  {
    id: "kpis-overview",
    title: "Staff KPIs",
    module: "team",
    moduleIcon: "Users",
    summary: "How staff KPIs are tracked and what metrics are measured.",
    tags: ["kpis", "performance", "staff", "targets"],
    content: `The KPI module tracks individual staff performance against targets set by the dealer admin.

**KPI types**
KPIs can be set for: invoices raised, leads converted, handovers completed, aftersales cases resolved, customer satisfaction scores, and more.

**Setting targets**
Go to Staff KPIs → select a staff member → set monthly targets for each KPI category.

**Staff view**
Each team member can view their own KPIs via My KPIs in the sidebar. They can see their progress against target for the current month.

**Manager view**
Dealer admins can view all staff KPIs from the Staff KPIs dashboard, with a comparison view across team members.`,
  },

  // ── BILLING ────────────────────────────────────────────────────────────────
  {
    id: "billing-overview",
    title: "Billing & Plans",
    module: "billing",
    moduleIcon: "CreditCard",
    summary: "Understanding your subscription plan and managing billing.",
    tags: ["billing", "subscription", "plan", "upgrade", "trial"],
    content: `DealerOps is offered on a subscription basis. Your current plan is shown in the Billing section.

**Trial period**
New self-service accounts start on a 14-day free trial on the Professional plan. No credit card is required to start a trial.

**Upgrading or downgrading**
To change your plan, go to Billing and click Manage Subscription. Plan changes take effect at the next billing cycle.

**Plans**
- Starter: Core CRM, vehicles, invoicing, and basic reporting.
- Professional: Everything in Starter plus CRA Shield, Compliance Centre, Review Booster, and KPIs.
- Elite: Everything in Professional plus custom integrations, priority support, and advanced analytics.

**Invoices and receipts**
Your billing history and downloadable invoices are available in the Billing section.

**Cancellation**
You can cancel at any time from the Billing section. Your access continues until the end of the current billing period.`,
  },
];
