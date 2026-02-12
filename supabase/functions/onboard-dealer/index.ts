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

    // RESEND mode
    if (body.resend_dealer_id) {
      const { data: dealer } = await supabaseAdmin.from("dealers").select("*").eq("id", body.resend_dealer_id).single();
      if (!dealer) throw new Error("Dealer not found");

      const emailBody = buildWelcomeEmail(dealer.name, dealer.email || "", "portal.dealerops.uk", null, true);

      await supabaseAdmin.from("email_outbox").insert({
        dealer_id: dealer.id,
        to_email: dealer.email || "",
        subject: "Welcome to DealerOps – Your login details",
        body_text: emailBody,
        status: "simulated",
      });

      await supabaseAdmin.from("dealer_onboarding_events").insert({
        dealer_id: dealer.id,
        created_by_superadmin_user_id: caller.id,
        event_type: "WELCOME_EMAIL_SENT",
        payload_json: { resend: true },
      });

      return new Response(JSON.stringify({ message: "Welcome email resent (simulated)" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // CREATE mode
    const { legal_name, trading_name, email, phone, address_line1, address_line2, city, postcode,
      fca_number, ico_number, vat_number, company_number,
      admin_first_name, admin_last_name, admin_email, created_by } = body;

    if (!legal_name || !email || !admin_first_name || !admin_last_name) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Create dealer record
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
      status: "active",
      is_active: true,
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

    // 6. Log onboarding events
    await supabaseAdmin.from("dealer_onboarding_events").insert({
      dealer_id: dealer.id,
      created_by_superadmin_user_id: created_by || caller.id,
      event_type: "DEALER_CREATED",
      payload_json: { admin_email: adminUserEmail },
    });

    // 7. Generate password reset link
    let resetLink: string | null = null;
    try {
      const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email: adminUserEmail,
      });
      resetLink = linkData?.properties?.action_link || null;
    } catch (_) {
      // If link generation fails, fall back to temp password
    }

    // 8. Send welcome email (simulated)
    const emailBody = buildWelcomeEmail(
      trading_name || legal_name,
      adminUserEmail,
      "portal.dealerops.uk",
      resetLink || `Temporary password: ${tempPassword}`,
      false,
    );

    let emailStatus = "simulated";
    // Try real email via Resend if key exists
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey && resendKey !== "re_placeholder") {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "DealerOps <noreply@dealerops.uk>",
            to: [adminUserEmail],
            subject: "Welcome to DealerOps – Your login details",
            text: emailBody,
          }),
        });
        if (res.ok) emailStatus = "sent";
      } catch (_) { /* fall through to simulated */ }
    }

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
  credentialInfo: string | null,
  isResend: boolean,
): string {
  return `
Welcome to DealerOps!
${"=".repeat(40)}

Hi there,

${isResend ? "This is a reminder with your login details for DealerOps." : `We're excited to welcome ${dealerName} to DealerOps – your all-in-one dealership management platform.`}

Your Login Details:
-------------------
Portal URL: https://${loginUrl}
Login Email: ${loginEmail}
${credentialInfo ? credentialInfo : "Please use the 'Forgot Password' link to set your password."}

Getting Started:
----------------
1. Log in at https://${loginUrl}
2. Add your team members under Settings > Team
3. Add your first customer and vehicle
4. Run a vehicle check
5. Create your first invoice

If you have any issues, reply to this email or use the Support tab in the platform. We can also arrange free training for your team.

Best regards,
The DealerOps Team
Built by Wildcard Labs

---
This email was sent by DealerOps. If you did not expect this email, please contact support@dealerops.uk.
`.trim();
}
