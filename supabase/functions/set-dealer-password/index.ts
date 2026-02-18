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

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: callerErr } = await userClient.auth.getUser(token);
    if (callerErr || !caller) {
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

    const { dealer_id, new_password, notify_dealer } = await req.json();

    if (!dealer_id || !new_password) {
      return new Response(JSON.stringify({ error: "dealer_id and new_password are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (new_password.length < 8) {
      return new Response(JSON.stringify({ error: "Password must be at least 8 characters" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get dealer
    const { data: dealer } = await supabaseAdmin.from("dealers").select("*").eq("id", dealer_id).single();
    if (!dealer) throw new Error("Dealer not found");

    // Get dealer admin
    const { data: adminRole, error: adminRoleErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("dealer_id", dealer_id)
      .eq("role", "dealer_admin")
      .limit(1)
      .single();
    if (adminRoleErr) throw new Error(`Admin role lookup error: ${adminRoleErr.message}`);
    if (!adminRole) throw new Error("No dealer_admin user found for this dealer");

    // Get admin email from auth
    const { data: adminAuthUser } = await supabaseAdmin.auth.admin.getUserById(adminRole.user_id);
    if (!adminAuthUser?.user?.email) throw new Error("Could not retrieve admin email");
    const adminEmail = adminAuthUser.user.email;

    // Set the password
    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(adminRole.user_id, {
      password: new_password,
    });
    if (updateErr) throw new Error(updateErr.message);

    // Optionally email the dealer
    if (notify_dealer) {
      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (!resendKey) throw new Error("RESEND_API_KEY secret is not configured");

      const profile = await supabaseAdmin.from("profiles").select("first_name").eq("id", adminRole.user_id).single();
      const firstName = profile?.data?.first_name || "there";

      const emailBody = `
Password Updated – DealerOps
${"=".repeat(40)}

Hi ${firstName},

A Super Admin has updated your DealerOps password.

Your New Login Details:
-----------------------
Portal URL: https://dealerops.uk/login
Email: ${adminEmail}
New Password: ${new_password}

Please log in and change your password via Settings > Change Password.

If you did not expect this change, please contact support@dealerops.uk immediately.

Best regards,
The DealerOps Team
Built by Wildcard Labs
      `.trim();

      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "DealerOps <noreply@dealerops.uk>",
          to: [adminEmail],
          subject: "DealerOps – Your password has been updated",
          text: emailBody,
        }),
      });

      if (!resendRes.ok) {
        const errBody = await resendRes.text();
        console.warn(`Email send failed: ${resendRes.status}: ${errBody}`);
        // Non-fatal — password still set
      } else {
        await supabaseAdmin.from("email_outbox").insert({
          dealer_id,
          to_email: adminEmail,
          subject: "DealerOps – Your password has been updated",
          body_text: emailBody,
          status: "sent",
          sent_at: new Date().toISOString(),
        });
      }
    }

    // Audit log
    await supabaseAdmin.from("audit_logs").insert({
      dealer_id,
      actor_user_id: caller.id,
      action_type: "PASSWORD_SET_BY_SUPERADMIN",
      entity_type: "dealer",
      entity_id: dealer_id,
      summary: `Super admin manually set password for ${dealer.name} admin (${adminEmail})${notify_dealer ? " — dealer notified by email" : ""}`,
      actor_role: "SUPERADMIN",
    });

    return new Response(JSON.stringify({
      message: `Password updated for ${dealer.name} (${adminEmail})${notify_dealer ? ". Dealer has been notified by email." : ". Dealer was not emailed."}`,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
