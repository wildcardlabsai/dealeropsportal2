import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  console.log(`[SELF-SIGNUP] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { dealership_name, first_name, last_name, email, password, plan_id } = await req.json();

    if (!dealership_name || !first_name || !last_name || !email || !password) {
      return new Response(JSON.stringify({ error: "All fields are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (password.length < 8) {
      return new Response(JSON.stringify({ error: "Password must be at least 8 characters" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Starting signup", { email, dealership_name });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Rate limiting: check recent signups by email (last 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentEmailSignups } = await supabaseAdmin
      .from("dealer_onboarding_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "SELF_SIGNUP")
      .gte("created_at", oneHourAgo)
      .contains("payload_json", { email });

    if (recentEmailSignups && recentEmailSignups >= 3) {
      logStep("Rate limited (email)", { email });
      return new Response(JSON.stringify({ error: "Too many signup attempts. Please try again later." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limiting: check recent signups by IP (last 1 hour)
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
    if (clientIP !== "unknown") {
      const { count: recentIPSignups } = await supabaseAdmin
        .from("dealer_onboarding_events")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "SELF_SIGNUP")
        .gte("created_at", oneHourAgo)
        .contains("payload_json", { ip: clientIP });

      if (recentIPSignups && recentIPSignups >= 5) {
        logStep("Rate limited (IP)", { clientIP });
        return new Response(JSON.stringify({ error: "Too many signup attempts from this location. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Check if email already exists (efficient lookup via filter)
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers({ filter: `email.eq.${email}` });
    const emailExists = existingUsers?.users?.some(u => u.email === email);
    if (emailExists) {
      return new Response(JSON.stringify({ error: "An account with this email already exists. Please sign in instead." }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Create dealer with trial status
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    const { data: dealer, error: dealerErr } = await supabaseAdmin.from("dealers").insert({
      name: dealership_name,
      legal_name: dealership_name,
      email,
      status: "trial",
      is_active: true,
      trial_ends_at: trialEndsAt,
    }).select().single();

    if (dealerErr) throw new Error(`Failed to create dealer: ${dealerErr.message}`);
    logStep("Dealer created", { dealerId: dealer.id });

    // 2. Create auth user
    const { data: authUser, error: userErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (userErr) {
      // Rollback dealer
      await supabaseAdmin.from("dealers").delete().eq("id", dealer.id);
      throw new Error(`Failed to create user: ${userErr.message}`);
    }
    logStep("Auth user created", { userId: authUser.user.id });

    // 3. Set up profile
    await supabaseAdmin.from("profiles").upsert({
      id: authUser.user.id,
      first_name,
      last_name,
      dealer_id: dealer.id,
    });

    // 4. Assign dealer_admin role
    await supabaseAdmin.from("user_roles").insert({
      user_id: authUser.user.id,
      role: "dealer_admin",
      dealer_id: dealer.id,
    });

    // 5. Create dealer preferences defaults
    await supabaseAdmin.from("dealer_preferences").insert({ dealer_id: dealer.id });

    // 6. Create trial subscription — use Professional plan by default for trial
    // Look up the Professional plan, or use provided plan_id
    let trialPlanId = plan_id;
    if (!trialPlanId) {
      const { data: proPlan } = await supabaseAdmin
        .from("plans")
        .select("id")
        .eq("name", "Professional")
        .single();
      trialPlanId = proPlan?.id;
    }

    if (trialPlanId) {
      await supabaseAdmin.from("dealer_subscriptions").insert({
        dealer_id: dealer.id,
        plan_id: trialPlanId,
        status: "trial",
        start_date: new Date().toISOString().split("T")[0],
        next_review_date: trialEndsAt.split("T")[0],
        notes: "14-day free trial",
      });

      // Also set the plan on the dealer
      await supabaseAdmin.from("dealers").update({ plan_id: trialPlanId }).eq("id", dealer.id);
    }

    // 7. Log onboarding event (include IP for rate limiting)
    await supabaseAdmin.from("dealer_onboarding_events").insert({
      dealer_id: dealer.id,
      event_type: "SELF_SIGNUP",
      payload_json: { email, plan: "trial", trial_ends_at: trialEndsAt, ip: clientIP },
    });

    // 8. Audit log
    await supabaseAdmin.from("audit_logs").insert({
      dealer_id: dealer.id,
      actor_user_id: authUser.user.id,
      action_type: "SELF_SIGNUP",
      entity_type: "dealer",
      entity_id: dealer.id,
      summary: `Self-service signup: ${dealership_name} (${email})`,
      actor_role: "dealer_admin",
    });

    // 9. Send welcome email with login details
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (RESEND_API_KEY) {
      const loginUrl = "https://dealeropsportal.lovable.app/login";
      const welcomeHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0a0a1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;background:#6d28d9;border-radius:12px;padding:12px 16px;">
        <span style="color:#fff;font-weight:800;font-size:20px;">D</span>
      </div>
      <h1 style="color:#fff;margin:16px 0 0;font-size:24px;">Dealer<span style="color:#6d28d9;">Ops</span></h1>
    </div>
    <div style="background:#111127;border:1px solid #1e1e3a;border-radius:16px;padding:40px 32px;text-align:center;">
      <h2 style="color:#fff;font-size:22px;margin:0 0 8px;">Welcome to DealerOps, ${first_name}!</h2>
      <p style="color:#9ca3af;font-size:14px;line-height:1.6;margin:0 0 24px;">
        Your 14-day free trial is now active for <strong style="color:#fff;">${dealership_name}</strong>. Here are your login details:
      </p>
      <div style="background:#0a0a1a;border-radius:12px;padding:24px;margin:24px 0;text-align:left;">
        <p style="color:#6d28d9;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0 0 16px;">Your Login Details</p>
        <table style="width:100%;" cellpadding="0" cellspacing="0">
          <tr><td style="padding:8px 0;color:#9ca3af;font-size:13px;width:80px;">Email:</td><td style="padding:8px 0;color:#fff;font-size:13px;font-weight:600;">${email}</td></tr>
          <tr><td style="padding:8px 0;color:#9ca3af;font-size:13px;">Password:</td><td style="padding:8px 0;color:#fff;font-size:13px;font-weight:600;">The password you set during signup</td></tr>
        </table>
      </div>
      <a href="${loginUrl}" style="display:inline-block;background:#6d28d9;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:600;font-size:14px;margin-top:8px;">Log In to DealerOps</a>
      <p style="color:#6b7280;font-size:12px;margin:24px 0 0;">
        Your trial ends on ${new Date(trialEndsAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}. No credit card required.
      </p>
    </div>
    <p style="text-align:center;color:#4b5563;font-size:11px;margin-top:32px;">© ${new Date().getFullYear()} DealerOps. All rights reserved.</p>
  </div>
</body>
</html>`;

      try {
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
          body: JSON.stringify({
            from: "DealerOps <onboarding@resend.dev>",
            to: [email],
            subject: `Welcome to DealerOps – Your 14-day trial is active!`,
            html: welcomeHtml,
          }),
        });
        const emailResBody = await emailRes.json();
        logStep("Resend API response", { status: emailRes.status, body: emailResBody });
        if (!emailRes.ok) {
          logStep("Welcome email rejected by Resend", { status: emailRes.status, error: emailResBody });
        } else {
          logStep("Welcome email sent", { email });
        }
      } catch (emailErr: any) {
        logStep("Welcome email failed (non-blocking)", { error: emailErr.message });
      }
    }

    logStep("Signup complete", { dealerId: dealer.id, userId: authUser.user.id });

    return new Response(JSON.stringify({
      message: "Account created successfully",
      dealer_id: dealer.id,
      user_id: authUser.user.id,
      trial_ends_at: trialEndsAt,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    logStep("ERROR", { message: err.message });
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
