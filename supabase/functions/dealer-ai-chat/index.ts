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
    // --- Auth ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Service role client for data fetching ---
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify user identity using the service role client
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;

    // --- Resolve dealer_id from profile ---
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

    // --- Parse request body ---
    const { messages } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Invalid messages" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Fetch dealer snapshot (parallel) ---
    const now = new Date().toISOString();

    const [
      leadsRes,
      warrantiesRes,
      tasksRes,
      aftersalesCasesRes,
      complaintsRes,
      dsrRes,
      dealerRes,
    ] = await Promise.all([
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("dealer_id", dealerId)
        .in("status", ["new", "contacted", "qualified"]),

      supabase
        .from("warranties")
        .select("id", { count: "exact", head: true })
        .eq("dealer_id", dealerId)
        .eq("status", "active"),

      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("dealer_id", dealerId)
        .eq("status", "open")
        .lt("due_date", now),

      supabase
        .from("aftersales_cases")
        .select("id", { count: "exact", head: true })
        .eq("dealer_id", dealerId)
        .not("status", "in", '("closed","resolved")'),

      supabase
        .from("complaints")
        .select("id", { count: "exact", head: true })
        .eq("dealer_id", dealerId)
        .not("status", "in", '("resolved","closed")'),

      supabase
        .from("data_subject_requests")
        .select("id", { count: "exact", head: true })
        .eq("dealer_id", dealerId)
        .not("status", "in", '("completed","rejected")'),

      supabase
        .from("dealers")
        .select("name, status, trial_ends_at")
        .eq("id", dealerId)
        .single(),
    ]);

    const openLeads = leadsRes.count ?? 0;
    const activeWarranties = warrantiesRes.count ?? 0;
    const overdueTasks = tasksRes.count ?? 0;
    const openAftersalesCases = aftersalesCasesRes.count ?? 0;
    const openComplaints = complaintsRes.count ?? 0;
    const openDSRs = dsrRes.count ?? 0;

    const dealer = dealerRes.data;
    let trialInfo = "No active trial";
    if (dealer?.status === "trial" && dealer?.trial_ends_at) {
      const trialEnd = new Date(dealer.trial_ends_at);
      const daysLeft = Math.max(
        0,
        Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      );
      trialInfo = daysLeft > 0
        ? `Trial active — ${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining`
        : "Trial expired";
    } else if (dealer?.status === "active") {
      trialInfo = "Subscribed (active)";
    }

    // --- Build system prompt ---
    const systemPrompt = `You are DealerOps AI, an intelligent assistant embedded in the DealerOps platform for a UK motor dealership.

Dealer: ${dealer?.name ?? "Unknown"}
Current snapshot (live data as of ${new Date().toLocaleString("en-GB")}):
- Open Leads: ${openLeads}
- Active Warranties: ${activeWarranties}
- Overdue Tasks: ${overdueTasks}
- Open Aftersales Cases: ${openAftersalesCases}
- Open Complaints: ${openComplaints}
- Open Data Subject Requests (DSRs): ${openDSRs}
- Subscription Status: ${trialInfo}

Your capabilities:
- Answer questions about the dealer's data (leads, warranties, tasks, aftersales, compliance)
- Provide UK regulatory guidance: FCA Consumer Duty, GDPR, Consumer Rights Act 2015
- Explain CRA Shield scores, risk ratings, and recommended next steps
- Help staff navigate the DealerOps platform
- Give daily briefings and operational summaries
- Answer general UK motor dealership business questions

Platform navigation guide:
- Leads: /app/leads
- Customers: /app/customers
- Vehicles: /app/vehicles
- Handovers: /app/handovers
- Warranties: /app/warranties
- Aftersales Cases: /app/aftersales/cases
- CRA Shield: /app/cra
- Invoices: /app/invoices
- Compliance Centre: /app/compliance
- Tasks: /app/tasks
- Reviews: /app/reviews
- Reports: /app/reports
- Settings: /app/settings
- Billing: /app/billing

Rules:
- You do NOT modify any records — read and explain only
- Be concise, professional, and helpful
- Always use British English
- When quoting regulation, be accurate and cite the source (e.g. "Under the Consumer Rights Act 2015, section 9...")
- If you don't know something, say so clearly rather than guessing`;

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
