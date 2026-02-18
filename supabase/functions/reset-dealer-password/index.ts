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

    const { dealer_id } = await req.json();
    if (!dealer_id) {
      return new Response(JSON.stringify({ error: "dealer_id is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the dealer admin user
    const { data: dealer } = await supabaseAdmin.from("dealers").select("*").eq("id", dealer_id).single();
    if (!dealer) throw new Error("Dealer not found");

    // Find the dealer admin profile
    const { data: adminProfile } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, profiles(id, first_name, last_name)")
      .eq("dealer_id", dealer_id)
      .eq("role", "dealer_admin")
      .limit(1)
      .single();

    if (!adminProfile) throw new Error("No admin user found for this dealer");

    // Get the admin's email from auth
    const { data: adminAuthUser } = await supabaseAdmin.auth.admin.getUserById(adminProfile.user_id);
    if (!adminAuthUser?.user?.email) throw new Error("Could not retrieve admin email");

    const adminEmail = adminAuthUser.user.email;
    const newPassword = crypto.randomUUID().slice(0, 12) + "Aa1!";

    // Update the password
    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(adminProfile.user_id, {
      password: newPassword,
    });
    if (updateErr) throw new Error(updateErr.message);

    // Build the email
    const profile = adminProfile.profiles as any;
    const firstName = profile?.first_name || "there";
    const emailBody = `
Password Reset – DealerOps
${"=".repeat(40)}

Hi ${firstName},

A Super Admin has reset your DealerOps password.

Your New Login Details:
-----------------------
Portal URL: https://dealerops.uk/login
Email: ${adminEmail}
Temporary Password: ${newPassword}

Please log in and change your password immediately via Settings > Change Password.

If you did not request this reset, please contact support@dealerops.uk immediately.

Best regards,
The DealerOps Team
Built by Wildcard Labs
    `.trim();

    let emailStatus = "simulated";
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey && resendKey !== "re_placeholder") {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "DealerOps <noreply@dealerops.uk>",
            to: [adminEmail],
            subject: "DealerOps – Your password has been reset",
            text: emailBody,
          }),
        });
        if (res.ok) emailStatus = "sent";
      } catch (_) { /* fall through */ }
    }

    await supabaseAdmin.from("email_outbox").insert({
      dealer_id,
      to_email: adminEmail,
      subject: "DealerOps – Your password has been reset",
      body_text: emailBody,
      status: emailStatus,
      sent_at: emailStatus === "sent" ? new Date().toISOString() : null,
    });

    await supabaseAdmin.from("audit_logs").insert({
      dealer_id,
      actor_user_id: caller.id,
      action_type: "PASSWORD_RESET",
      entity_type: "dealer",
      entity_id: dealer_id,
      summary: `Super admin reset password for ${dealer.name} admin (${adminEmail})`,
      actor_role: "SUPERADMIN",
    });

    return new Response(JSON.stringify({
      message: `Password reset and ${emailStatus === "sent" ? "emailed" : "simulated (email)"} to ${adminEmail}.`,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
