import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } }, auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: { user: caller } } = await userClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Invalid user" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify super_admin
    const { data: roles } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", caller.id);
    if (!roles?.some(r => r.role === "super_admin")) {
      return new Response(JSON.stringify({ error: "Insufficient permissions" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();

    // RESEND mode — generates a new temp password and emails it
    if (body.resend_dealer_id) {
      console.log("[RESEND] Starting resend for dealer:", body.resend_dealer_id);

      const { data: dealer, error: dealerFetchErr } = await supabaseAdmin.from("dealers").select("*").eq("id", body.resend_dealer_id).single();
      if (dealerFetchErr) throw new Error(`Dealer fetch error: ${dealerFetchErr.message}`);
      if (!dealer) throw new Error("Dealer not found");
      console.log("[RESEND] Dealer found:", dealer.name);

      // Find dealer admin user_id
      const { data: adminRole, error: adminRoleErr } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .eq("dealer_id", dealer.id)
        .eq("role", "dealer_admin")
        .limit(1)
        .single();

      if (adminRoleErr) throw new Error(`Admin role lookup error: ${adminRoleErr.message}`);
      if (!adminRole) throw new Error("No dealer_admin user found for this dealer");
      console.log("[RESEND] Admin user_id:", adminRole.user_id);

      // Get the admin's actual login email from auth
      const { data: adminAuthData, error: authLookupErr } = await supabaseAdmin.auth.admin.getUserById(adminRole.user_id);
      if (authLookupErr) throw new Error(`Auth user lookup error: ${authLookupErr.message}`);
      if (!adminAuthData?.user?.email) throw new Error("Could not retrieve admin email from auth");
      const toEmail = adminAuthData.user.email;
      console.log("[RESEND] Sending to email:", toEmail);

      // Generate new temp password and reset it
      const resendPassword = crypto.randomUUID().slice(0, 16) + "Aa1!";
      const { error: pwUpdateErr } = await supabaseAdmin.auth.admin.updateUserById(adminRole.user_id, { password: resendPassword });
      if (pwUpdateErr) throw new Error(`Password update error: ${pwUpdateErr.message}`);
      console.log("[RESEND] Password updated successfully");

      const emailBody = buildWelcomeEmail(dealer.name, toEmail, "dealerops.uk/login", resendPassword, dealer.status === "trial", dealer.trial_ends_at);

      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (!resendKey) throw new Error("RESEND_API_KEY secret is not configured");

      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "DealerOps <noreply@dealerops.uk>",
          to: [toEmail],
          subject: "Welcome to DealerOps – Your login details",
          text: emailBody,
        }),
      });

      if (!resendRes.ok) {
        const errBody = await resendRes.text();
        throw new Error(`Resend API error ${resendRes.status}: ${errBody}`);
      }
      console.log("[RESEND] Email sent successfully via Resend");

      // Log to email_outbox (non-fatal if it fails)
      const { error: outboxErr } = await supabaseAdmin.from("email_outbox").insert({
        dealer_id: dealer.id,
        to_email: toEmail,
        subject: "Welcome to DealerOps – Your login details",
        body_text: emailBody,
        status: "sent",
        sent_at: new Date().toISOString(),
      });
      if (outboxErr) console.warn("[RESEND] email_outbox insert warning:", outboxErr.message);

      // Log onboarding event (non-fatal if it fails)
      const { error: eventErr } = await supabaseAdmin.from("dealer_onboarding_events").insert({
        dealer_id: dealer.id,
        created_by_superadmin_user_id: caller.id,
        event_type: "WELCOME_EMAIL_SENT",
        payload_json: { resend: true, status: "sent" },
      });
      if (eventErr) console.warn("[RESEND] onboarding_event insert warning:", eventErr.message);

      return new Response(JSON.stringify({ message: `Welcome email sent with new temporary password to ${toEmail}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // CREATE mode
    const { legal_name, trading_name, email, phone, address_line1, address_line2, city, postcode,
      fca_number, ico_number, vat_number, company_number,
      admin_first_name, admin_last_name, admin_email, created_by,
      package_type } = body; // package_type: "active" | "trial"

    if (!legal_name || !email || !admin_first_name || !admin_last_name) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Create dealer record
    const isTrial = package_type === "trial";
    const trialEndsAt = isTrial ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() : null;

    const { data: dealer, error: dealerErr } = await supabaseAdmin.from("dealers").insert({
      name: trading_name || legal_name,
      legal_name,
      trading_name: trading_name || null,
      email,
      phone: phone || null,
      address_line1: address_line1 || null,
      address_line2: address_line2 || null,
      city: city || null,
      postcode: postcode || null,
      fca_number: fca_number || null,
      ico_number: ico_number || null,
      vat_number: vat_number || null,
      company_number: company_number || null,
      status: isTrial ? "trial" : "active",
      is_active: true,
      trial_ends_at: trialEndsAt,
    }).select().single();

    if (dealerErr) throw new Error(dealerErr.message);

    // 2. Create admin user
    const adminUserEmail = admin_email || email;
    const tempPassword = crypto.randomUUID().slice(0, 16) + "Aa1!";

    const { data: adminUser, error: userErr } = await supabaseAdmin.auth.admin.createUser({
      email: adminUserEmail,
      password: tempPassword,
      email_confirm: true,
    });

    if (userErr) throw new Error(userErr.message);

    // 3. Create profile
    await supabaseAdmin.from("profiles").upsert({
      id: adminUser.user.id,
      first_name: admin_first_name,
      last_name: admin_last_name,
      dealer_id: dealer.id,
    });

    // 4. Create role
    await supabaseAdmin.from("user_roles").insert({
      user_id: adminUser.user.id,
      role: "dealer_admin",
      dealer_id: dealer.id,
    });

    // 5. Create dealer_preferences defaults
    await supabaseAdmin.from("dealer_preferences").insert({ dealer_id: dealer.id });

    // 5b. Create trial subscription if trial package selected
    if (isTrial) {
      const { data: proPlan } = await supabaseAdmin
        .from("plans")
        .select("id")
        .eq("name", "Professional")
        .single();
      const trialPlanId = proPlan?.id;
      if (trialPlanId) {
        await supabaseAdmin.from("dealer_subscriptions").insert({
          dealer_id: dealer.id,
          plan_id: trialPlanId,
          status: "trial",
          start_date: new Date().toISOString().split("T")[0],
          next_review_date: trialEndsAt!.split("T")[0],
          notes: "14-day free trial (manually onboarded)",
        });
        await supabaseAdmin.from("dealers").update({ plan_id: trialPlanId }).eq("id", dealer.id);
      }
    }

    // 6. Log onboarding events
    await supabaseAdmin.from("dealer_onboarding_events").insert({
      dealer_id: dealer.id,
      created_by_superadmin_user_id: created_by || caller.id,
      event_type: "DEALER_CREATED",
      payload_json: { admin_email: adminUserEmail, package_type: isTrial ? "trial" : "active", trial_ends_at: trialEndsAt },
    });

    // 7. Send welcome email with temp password directly
    const emailBody = buildWelcomeEmail(
      trading_name || legal_name,
      adminUserEmail,
      "dealerops.uk/login",
      tempPassword,
      isTrial,
      trialEndsAt,
    );

    let emailStatus = "simulated";
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY secret is not configured");

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "DealerOps <noreply@dealerops.uk>",
        to: [adminUserEmail],
        subject: "Welcome to DealerOps – Your login details",
        text: emailBody,
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      throw new Error(`Resend API error ${resendRes.status}: ${errBody}`);
    }
    emailStatus = "sent";

    await supabaseAdmin.from("email_outbox").insert({
      dealer_id: dealer.id,
      to_email: adminUserEmail,
      subject: "Welcome to DealerOps – Your login details",
      body_text: emailBody,
      status: emailStatus,
      sent_at: emailStatus === "sent" ? new Date().toISOString() : null,
    });

    await supabaseAdmin.from("dealer_onboarding_events").insert({
      dealer_id: dealer.id,
      created_by_superadmin_user_id: created_by || caller.id,
      event_type: "WELCOME_EMAIL_SENT",
      payload_json: { email: adminUserEmail, status: emailStatus },
    });

    // 9. Audit log
    await supabaseAdmin.from("audit_logs").insert({
      dealer_id: dealer.id,
      actor_user_id: created_by || caller.id,
      action_type: "DEALER_CREATED",
      entity_type: "dealer",
      entity_id: dealer.id,
      summary: `Dealer ${legal_name} onboarded with admin ${adminUserEmail}`,
      actor_role: "SUPERADMIN",
    });

    return new Response(JSON.stringify({
      message: `Dealer "${trading_name || legal_name}" created. Welcome email ${emailStatus === "sent" ? "sent" : "simulated"} to ${adminUserEmail}.`,
      dealer_id: dealer.id,
      admin_user_id: adminUser.user.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildWelcomeEmail(
  dealerName: string,
  loginEmail: string,
  loginUrl: string,
  tempPassword: string | null,
  isTrial: boolean,
  trialEndsAt: string | null,
): string {
  const trialNote = isTrial && trialEndsAt
    ? `\nTrial Period:\n-------------\nYour 14-day free trial ends on ${new Date(trialEndsAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.\nTo continue using DealerOps after the trial, please upgrade to a full plan via Settings > Billing.\n`
    : "";

  return `
Welcome to DealerOps!
${"=".repeat(40)}

Hi there,

We're excited to welcome ${dealerName} to DealerOps – your all-in-one dealership management platform.

Your Login Details:
-------------------
Portal URL: https://${loginUrl}
Login Email: ${loginEmail}
Temporary Password: ${tempPassword || "(contact support)"}

IMPORTANT: Please log in and change your password immediately via Settings > Change Password.
${trialNote}
Getting Started:
----------------
1. Log in at https://${loginUrl}
2. Change your password via Settings > Change Password
3. Add your team members under Settings > Team
4. Add your first customer and vehicle
5. Run a vehicle check
6. Create your first invoice

If you have any issues, reply to this email or use the Support tab in the platform. We can also arrange free training for your team.

Best regards,
The DealerOps Team
Built by Wildcard Labs

---
This email was sent by DealerOps. If you did not expect this email, please contact support@dealerops.uk.
`.trim();
}
