import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;

    const { data: profile } = await supabase
      .from("profiles")
      .select("dealer_id")
      .eq("id", userId)
      .single();

    if (!profile?.dealer_id) {
      return new Response(JSON.stringify({ error: "No dealer associated with this user" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dealerId = profile.dealer_id;

    const { messages } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Invalid messages" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Fetch comprehensive dealer data (parallel) ---
    const [
      dealerRes,
      leadsRes,
      customersRes,
      vehiclesRes,
      invoicesRes,
      warrantiesRes,
      tasksRes,
      aftersalesCasesRes,
      aftersalesRes,
      complaintsRes,
      dsrRes,
      handoversRes,
      courtesyCarsRes,
      courtesyLoansRes,
      vehicleChecksRes,
      supportTicketsRes,
    ] = await Promise.all([
      supabase.from("dealers").select("name, status, trial_ends_at").eq("id", dealerId).single(),

      supabase.from("leads").select("id, first_name, last_name, email, phone, stage, status, source, vehicle_interest_text, created_at, updated_at, notes, lead_number")
        .eq("dealer_id", dealerId).order("created_at", { ascending: false }).limit(200),

      supabase.from("customers").select("id, first_name, last_name, email, phone, city, postcode, created_at, consent_marketing")
        .eq("dealer_id", dealerId).eq("is_deleted", false).order("created_at", { ascending: false }).limit(200),

      supabase.from("vehicles").select("id, vrm, make, model, year, colour, mileage, fuel_type, transmission, status, purchase_price, sale_price, stock_number, created_at, first_registered_date")
        .eq("dealer_id", dealerId).order("created_at", { ascending: false }).limit(200),

      supabase.from("invoices").select("id, invoice_number, status, subtotal, vat_amount, total, due_date, paid_at, created_at, customer_id, vehicle_id, sale_type")
        .eq("dealer_id", dealerId).order("created_at", { ascending: false }).limit(200),

      supabase.from("warranties").select("id, warranty_number, status, provider, coverage_type, start_date, end_date, cost, created_at, vehicle_id, customer_id")
        .eq("dealer_id", dealerId).order("created_at", { ascending: false }).limit(200),

      supabase.from("tasks").select("id, title, description, status, priority, due_date, assigned_to_user_id, created_at")
        .eq("dealer_id", dealerId).order("created_at", { ascending: false }).limit(200),

      supabase.from("aftersales_cases").select("id, case_number, status, priority, issue_category, issue_subcategory, summary, description, complaint_date, resolved_at, closed_at, cost_estimate, goodwill_amount, outcome, sla_target_hours, created_at, vehicle_id, customer_id")
        .eq("dealer_id", dealerId).order("created_at", { ascending: false }).limit(200),

      supabase.from("aftersales").select("id, subject, status, case_type, description, resolution, resolved_at, created_at, vehicle_id, customer_id")
        .eq("dealer_id", dealerId).order("created_at", { ascending: false }).limit(200),

      supabase.from("complaints").select("id, complaint_ref, status, category, channel, customer_name, description, received_at, resolution_at, resolution_summary, goodwill_amount, created_at")
        .eq("dealer_id", dealerId).order("created_at", { ascending: false }).limit(100),

      supabase.from("data_subject_requests").select("id, request_number, request_type, status, requester_name, received_at, due_at, created_at")
        .eq("dealer_id", dealerId).order("created_at", { ascending: false }).limit(100),

      supabase.from("handovers").select("id, handover_number, status, scheduled_delivery_at, delivered_at, created_at, vehicle_id, customer_id")
        .eq("dealer_id", dealerId).order("created_at", { ascending: false }).limit(200),

      supabase.from("courtesy_cars").select("id, vrm, make, model, status, current_mileage, created_at")
        .eq("dealer_id", dealerId).limit(50),

      supabase.from("courtesy_loans").select("id, status, customer_name, loan_start_at, expected_return_at, actual_return_at, loan_reason, created_at")
        .eq("dealer_id", dealerId).order("created_at", { ascending: false }).limit(100),

      supabase.from("vehicle_checks").select("id, vrm, status, dvla_status, dvsa_status, created_at")
        .eq("dealer_id", dealerId).order("created_at", { ascending: false }).limit(100),

      supabase.from("support_tickets").select("id, ticket_number, subject, status, priority, created_at, resolved_at")
        .eq("dealer_id", dealerId).order("created_at", { ascending: false }).limit(100),
    ]);

    const dealer = dealerRes.data;
    let trialInfo = "No active trial";
    if (dealer?.status === "trial" && dealer?.trial_ends_at) {
      const trialEnd = new Date(dealer.trial_ends_at);
      const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      trialInfo = daysLeft > 0 ? `Trial active — ${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining` : "Trial expired";
    } else if (dealer?.status === "active") {
      trialInfo = "Subscribed (active)";
    }

    const leads = leadsRes.data ?? [];
    const customers = customersRes.data ?? [];
    const vehicles = vehiclesRes.data ?? [];
    const invoices = invoicesRes.data ?? [];
    const warranties = warrantiesRes.data ?? [];
    const tasks = tasksRes.data ?? [];
    const aftersalesCases = aftersalesCasesRes.data ?? [];
    const aftersales = aftersalesRes.data ?? [];
    const complaints = complaintsRes.data ?? [];
    const dsrs = dsrRes.data ?? [];
    const handovers = handoversRes.data ?? [];
    const courtesyCars = courtesyCarsRes.data ?? [];
    const courtesyLoans = courtesyLoansRes.data ?? [];
    const vehicleChecks = vehicleChecksRes.data ?? [];
    const supportTickets = supportTicketsRes.data ?? [];

    // Compute summaries
    const now = new Date();
    const overdueTasks = tasks.filter(t => ["todo", "in_progress"].includes(t.status) && t.due_date && new Date(t.due_date) < now).length;
    const openLeads = leads.filter(l => ["new", "contacted", "viewing", "negotiating"].includes(l.stage ?? l.status)).length;
    const soldLeads = leads.filter(l => (l.stage ?? l.status) === "sold");
    const activeWarranties = warranties.filter(w => w.status === "active").length;
    const openAftersalesCases = aftersalesCases.filter(c => !["closed", "resolved"].includes(c.status)).length;
    const openComplaints = complaints.filter(c => !["resolved", "closed"].includes(c.status)).length;
    const openDSRs = dsrs.filter(d => !["completed", "rejected"].includes(d.status)).length;

    // Sales by month
    const salesByMonth: Record<string, number> = {};
    for (const lead of soldLeads) {
      const month = lead.updated_at?.slice(0, 7) ?? lead.created_at?.slice(0, 7);
      if (month) salesByMonth[month] = (salesByMonth[month] ?? 0) + 1;
    }

    // Invoice revenue by month
    const revenueByMonth: Record<string, number> = {};
    let totalRevenue = 0;
    let paidRevenue = 0;
    for (const inv of invoices) {
      const amt = inv.total ?? 0;
      totalRevenue += amt;
      if (inv.status === "paid") {
        paidRevenue += amt;
        const month = (inv.paid_at ?? inv.created_at)?.slice(0, 7);
        if (month) revenueByMonth[month] = (revenueByMonth[month] ?? 0) + amt;
      }
    }

    // Aftersales issue categories
    const issueCategoryCounts: Record<string, number> = {};
    for (const c of [...aftersalesCases, ...aftersales]) {
      const cat = (c as any).issue_category ?? (c as any).case_type ?? "uncategorised";
      issueCategoryCounts[cat] = (issueCategoryCounts[cat] ?? 0) + 1;
    }

    // Vehicle stock summary
    const stockSummary: Record<string, number> = {};
    for (const v of vehicles) {
      stockSummary[v.status] = (stockSummary[v.status] ?? 0) + 1;
    }

    const systemPrompt = `You are DealerOps AI, an intelligent assistant embedded in the DealerOps platform for a UK motor dealership.
You have FULL READ ACCESS to the dealer's live data. You can and should answer all questions about the business using the data provided below.

Dealer: ${dealer?.name ?? "Unknown"}
Subscription Status: ${trialInfo}
Data snapshot as of: ${new Date().toLocaleString("en-GB")}

=== SUMMARY STATISTICS ===
- Total Customers: ${customers.length}
- Total Vehicles in System: ${vehicles.length}
- Vehicle Stock Breakdown: ${JSON.stringify(stockSummary)}
- Open Leads: ${openLeads} (of ${leads.length} total)
- Sold Leads: ${soldLeads.length}
- Sales by Month: ${JSON.stringify(salesByMonth)}
- Active Warranties: ${activeWarranties} (of ${warranties.length} total)
- Overdue Tasks: ${overdueTasks} (of ${tasks.length} total)
- Open Aftersales Cases: ${openAftersalesCases} (of ${aftersalesCases.length + aftersales.length} total)
- Aftersales Issue Categories: ${JSON.stringify(issueCategoryCounts)}
- Open Complaints: ${openComplaints} (of ${complaints.length} total)
- Open DSRs: ${openDSRs}
- Total Invoices: ${invoices.length}
- Total Revenue (all invoices): £${totalRevenue.toFixed(2)}
- Paid Revenue: £${paidRevenue.toFixed(2)}
- Revenue by Month (paid): ${JSON.stringify(revenueByMonth)}
- Handovers: ${handovers.length}
- Courtesy Cars: ${courtesyCars.length}
- Active Courtesy Loans: ${courtesyLoans.filter(l => l.status === "active").length}
- Vehicle Checks: ${vehicleChecks.length}
- Support Tickets: ${supportTickets.length}

=== LEADS DATA (${leads.length} records) ===
${JSON.stringify(leads.map(l => ({ name: `${l.first_name} ${l.last_name}`, stage: l.stage, status: l.status, source: l.source, vehicle_interest: l.vehicle_interest_text, created: l.created_at?.slice(0, 10), lead_number: l.lead_number })))}

=== CUSTOMERS DATA (${customers.length} records) ===
${JSON.stringify(customers.map(c => ({ name: `${c.first_name} ${c.last_name}`, email: c.email, phone: c.phone, city: c.city, created: c.created_at?.slice(0, 10) })))}

=== VEHICLES DATA (${vehicles.length} records) ===
${JSON.stringify(vehicles.map(v => ({ vrm: v.vrm, make: v.make, model: v.model, year: v.year, mileage: v.mileage, fuel: v.fuel_type, status: v.status, purchase_price: v.purchase_price, sale_price: v.sale_price, created: v.created_at?.slice(0, 10) })))}

=== INVOICES DATA (${invoices.length} records) ===
${JSON.stringify(invoices.map(i => ({ number: i.invoice_number, status: i.status, total: i.total, vat: i.vat_amount, due: i.due_date, paid: i.paid_at?.slice(0, 10), created: i.created_at?.slice(0, 10), sale_type: i.sale_type })))}

=== WARRANTIES DATA (${warranties.length} records) ===
${JSON.stringify(warranties.map(w => ({ number: w.warranty_number, status: w.status, provider: w.provider, coverage: w.coverage_type, start: w.start_date, end: w.end_date, cost: w.cost })))}

=== TASKS DATA (${tasks.length} records) ===
${JSON.stringify(tasks.map(t => ({ title: t.title, status: t.status, priority: t.priority, due: t.due_date, created: t.created_at?.slice(0, 10) })))}

=== AFTERSALES CASES (${aftersalesCases.length} records) ===
${JSON.stringify(aftersalesCases.map(c => ({ number: c.case_number, status: c.status, priority: c.priority, category: c.issue_category, subcategory: c.issue_subcategory, summary: c.summary, outcome: c.outcome, cost_estimate: c.cost_estimate, goodwill: c.goodwill_amount, complaint_date: c.complaint_date, resolved: c.resolved_at?.slice(0, 10) })))}

=== AFTERSALES (legacy, ${aftersales.length} records) ===
${JSON.stringify(aftersales.map(a => ({ subject: a.subject, status: a.status, type: a.case_type, resolution: a.resolution, resolved: a.resolved_at?.slice(0, 10), created: a.created_at?.slice(0, 10) })))}

=== COMPLAINTS (${complaints.length} records) ===
${JSON.stringify(complaints.map(c => ({ ref: c.complaint_ref, status: c.status, category: c.category, channel: c.channel, customer: c.customer_name, received: c.received_at?.slice(0, 10), resolved: c.resolution_at?.slice(0, 10), goodwill: c.goodwill_amount })))}

=== HANDOVERS (${handovers.length} records) ===
${JSON.stringify(handovers.map(h => ({ number: h.handover_number, status: h.status, scheduled: h.scheduled_delivery_at?.slice(0, 10), delivered: h.delivered_at?.slice(0, 10) })))}

=== COURTESY CARS (${courtesyCars.length} records) ===
${JSON.stringify(courtesyCars.map(c => ({ vrm: c.vrm, make: c.make, model: c.model, status: c.status, mileage: c.current_mileage })))}

=== COURTESY LOANS (${courtesyLoans.length} records) ===
${JSON.stringify(courtesyLoans.map(l => ({ customer: l.customer_name, status: l.status, start: l.loan_start_at?.slice(0, 10), expected_return: l.expected_return_at?.slice(0, 10), actual_return: l.actual_return_at?.slice(0, 10), reason: l.loan_reason })))}

=== SUPPORT TICKETS (${supportTickets.length} records) ===
${JSON.stringify(supportTickets.map(t => ({ number: t.ticket_number, subject: t.subject, status: t.status, priority: t.priority, created: t.created_at?.slice(0, 10) })))}

Your capabilities:
- Answer ANY question about the dealer's data using the full dataset above
- Calculate totals, averages, trends, busiest months, most common issues, etc.
- Provide UK regulatory guidance: FCA Consumer Duty, GDPR, Consumer Rights Act 2015
- Explain CRA Shield scores, risk ratings, and recommended next steps
- Help staff navigate the DealerOps platform
- Give daily briefings and operational summaries

Platform navigation guide:
- Leads: /app/leads | Customers: /app/customers | Vehicles: /app/vehicles
- Handovers: /app/handovers | Warranties: /app/warranties
- Aftersales Cases: /app/aftersales/cases | CRA Shield: /app/cra
- Invoices: /app/invoices | Compliance Centre: /app/compliance
- Tasks: /app/tasks | Reviews: /app/reviews | Reports: /app/reports
- Settings: /app/settings | Billing: /app/billing

Rules:
- You have FULL access to the data above. DO NOT say you cannot access data.
- Analyse the data directly to answer questions about sales, revenue, trends, issues, etc.
- You do NOT modify any records — read and explain only
- Be concise, professional, and helpful
- Always use British English
- When quoting regulation, cite the source (e.g. "Under the Consumer Rights Act 2015, section 9...")
- If data is genuinely not available in the snapshot, say so clearly`;

    // --- Stream from Lovable AI ---
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit reached. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage credits exhausted. Please contact your administrator." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(aiResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("dealer-ai-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
