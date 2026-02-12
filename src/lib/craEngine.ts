/**
 * CRA Shield Decision Engine
 * Deterministic, rule-based, explainable risk assessment.
 * NOT legal advice — decision support only.
 */

export interface CRAInputs {
  sale_date: string;
  issue_reported_date: string;
  sale_type: string;
  fault_category: string;
  fault_description: string;
  vehicle_drivable: boolean;
  warning_lights_present: boolean;
  customer_usage: string;
  pdi_present: boolean;
  handover_acknowledgement_signed: boolean;
  pre_delivery_photos_present: boolean;
  diagnostic_report_present: boolean;
  service_history_present: boolean;
  warranty_active: boolean;
  mileage_at_sale?: number | null;
  mileage_at_issue?: number | null;
  vehicle_make?: string | null;
  vehicle_model?: string | null;
  vehicle_registration?: string | null;
}

export interface CRAOutputs {
  days_since_sale: number;
  time_window: "within_30_days" | "30_days_to_6_months" | "over_6_months";
  risk_rating: "green" | "amber" | "red";
  risk_reasons: string[];
  recommended_next_steps: string[];
  evidence_checklist: string[];
  customer_response_standard: string;
  customer_response_firm: string;
  customer_response_deescalation: string;
}

function daysBetween(a: string, b: string): number {
  const d1 = new Date(a);
  const d2 = new Date(b);
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

function classifyWindow(days: number): CRAOutputs["time_window"] {
  if (days <= 30) return "within_30_days";
  if (days <= 182) return "30_days_to_6_months";
  return "over_6_months";
}

const SAFETY_FAULTS = ["brakes", "steering"];

export function runCRAEngine(inputs: CRAInputs): CRAOutputs {
  const days = daysBetween(inputs.sale_date, inputs.issue_reported_date);
  const window = classifyWindow(days);
  const reasons: string[] = [];
  let score = 0; // 0 = amber baseline; positive → red; negative → green

  // ── Risk escalation (toward RED) ──
  if (window === "within_30_days" && !inputs.vehicle_drivable) {
    score += 2;
    reasons.push("Vehicle not drivable within 30 days of sale — high CRA exposure.");
  }
  if (window === "within_30_days" && inputs.warning_lights_present) {
    score += 2;
    reasons.push("Warning lights present within 30 days — short-term right to reject applies.");
  }
  if (!inputs.handover_acknowledgement_signed) {
    score += 1;
    reasons.push("Handover acknowledgement not signed — weakens dealer defence.");
  }
  if (!inputs.pdi_present) {
    score += 1;
    reasons.push("No PDI record — cannot demonstrate pre-sale inspection.");
  }
  const missingEvidence = [
    !inputs.pre_delivery_photos_present && "pre-delivery photos",
    !inputs.diagnostic_report_present && "diagnostic report",
    !inputs.service_history_present && "service history",
  ].filter(Boolean) as string[];
  if (missingEvidence.length >= 2) {
    score += 1;
    reasons.push(`Multiple evidence items missing: ${missingEvidence.join(", ")}.`);
  }
  if (SAFETY_FAULTS.includes(inputs.fault_category)) {
    score += 2;
    reasons.push(`Safety-related fault (${inputs.fault_category}) — increased regulatory and CRA exposure.`);
  }
  if (window === "within_30_days") {
    score += 1;
    reasons.push("Within 30-day short-term right to reject window.");
  }

  // ── Risk de-escalation (toward GREEN) ──
  if (window === "over_6_months") {
    score -= 2;
    reasons.push("Over 6 months since sale — burden of proof shifts to consumer.");
  }
  if (inputs.fault_category === "wear_and_tear") {
    score -= 2;
    reasons.push("Fault categorised as wear and tear — generally not a CRA issue.");
  }
  if (inputs.pdi_present && inputs.handover_acknowledgement_signed && inputs.pre_delivery_photos_present) {
    score -= 1;
    reasons.push("Strong evidence position (PDI + handover + photos).");
  }
  if (inputs.diagnostic_report_present && inputs.fault_category === "wear_and_tear") {
    score -= 1;
    reasons.push("Diagnostic confirms wear/consumable issue.");
  }

  // ── Final rating ──
  let risk_rating: CRAOutputs["risk_rating"];
  if (score >= 3) risk_rating = "red";
  else if (score <= -2) risk_rating = "green";
  else risk_rating = "amber";

  // ── Next steps ──
  const steps: string[] = [
    "Acknowledge the complaint in writing within 24 hours.",
    "Book a diagnostic inspection at the earliest opportunity.",
  ];
  if (window === "within_30_days") {
    steps.push("⚠️ Within 30-day window — prioritise rapid response and documentation.");
    steps.push("Ensure all pre-sale evidence (PDI, photos, handover) is collated immediately.");
  }
  if (window === "30_days_to_6_months") {
    steps.push("Focus on a reasonable repair pathway with documented diagnostic findings.");
    steps.push("Diagnostic-led decision-making — obtain independent report if needed.");
  }
  if (window === "over_6_months") {
    steps.push("Request evidence from customer that fault was present at point of sale.");
    steps.push("Consider usage patterns and normal wear in your assessment.");
  }
  if (inputs.sale_type === "distance") {
    steps.push("📋 Distance sale — review 14-day cancellation right compliance.");
    steps.push("Ensure all required pre-contract information was provided.");
  }
  if (SAFETY_FAULTS.includes(inputs.fault_category)) {
    steps.push("🚨 Safety-related fault — advise customer against continued use if appropriate.");
    steps.push("Arrange immediate safety inspection and document findings.");
  }

  // ── Evidence checklist ──
  const checklist: string[] = [];
  if (!inputs.pdi_present) checklist.push("Obtain or locate PDI record.");
  if (!inputs.handover_acknowledgement_signed) checklist.push("Locate signed handover acknowledgement.");
  if (!inputs.pre_delivery_photos_present) checklist.push("Collect pre-delivery vehicle photos.");
  if (!inputs.diagnostic_report_present) checklist.push("Commission diagnostic report.");
  if (!inputs.service_history_present) checklist.push("Obtain vehicle service history.");
  if (checklist.length === 0) checklist.push("All key evidence items present — strong defensive position.");

  // ── Response templates ──
  const vehicleRef = [inputs.vehicle_registration, inputs.vehicle_make, inputs.vehicle_model].filter(Boolean).join(" ") || "your vehicle";

  const customer_response_standard = `Dear Customer,\n\nThank you for contacting us regarding ${vehicleRef}. We take all complaints seriously and are committed to resolving this matter fairly.\n\nWe have logged your complaint and would like to arrange a diagnostic inspection at the earliest opportunity. Please contact us to arrange a convenient time.\n\nKind regards`;

  const customer_response_firm = `Dear Customer,\n\nThank you for your correspondence regarding ${vehicleRef}.\n\nWe have reviewed your complaint carefully. In accordance with the Consumer Rights Act 2015, we are arranging a diagnostic inspection to establish the nature and cause of the reported fault.\n\nWe would appreciate your cooperation in making the vehicle available for inspection. Please note that the outcome of the diagnostic assessment will inform the appropriate resolution pathway.\n\nKind regards`;

  const customer_response_deescalation = `Dear Customer,\n\nThank you for getting in touch about ${vehicleRef}. We completely understand your frustration and want to assure you that resolving this is our priority.\n\nWe'd like to start by arranging a thorough inspection of your vehicle so we can fully understand the issue. We'll keep you informed at every step and work with you to find a fair resolution.\n\nPlease don't hesitate to call us directly if you'd like to discuss anything — we're here to help.\n\nKind regards`;

  return {
    days_since_sale: days,
    time_window: window,
    risk_rating,
    risk_reasons: reasons,
    recommended_next_steps: steps,
    evidence_checklist: checklist,
    customer_response_standard,
    customer_response_firm,
    customer_response_deescalation,
  };
}
