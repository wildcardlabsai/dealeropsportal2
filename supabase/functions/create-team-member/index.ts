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
    // Verify the requesting user is a dealer_admin
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

    // Get the calling user
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

    // Check caller is dealer_admin or super_admin
    const { data: callerRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);
    
    const isAdmin = callerRoles?.some(r => r.role === "dealer_admin" || r.role === "super_admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Insufficient permissions" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { email, first_name, last_name, phone, role, dealer_id } = body;

    if (!email || !first_name || !last_name || !dealer_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller belongs to this dealer
    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("dealer_id")
      .eq("id", caller.id)
      .single();
    
    const isSuperAdmin = callerRoles?.some(r => r.role === "super_admin");
    if (!isSuperAdmin && callerProfile?.dealer_id !== dealer_id) {
      return new Response(JSON.stringify({ error: "Cannot create users for another dealer" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prevent creating super_admin
    if (role === "super_admin") {
      return new Response(JSON.stringify({ error: "Cannot create super admin users" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create the auth user with a temporary password
    const tempPassword = crypto.randomUUID().slice(0, 16) + "Aa1!";
    const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    });

    if (createErr) {
      return new Response(JSON.stringify({ error: createErr.message }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create profile
    await supabaseAdmin.from("profiles").upsert({
      id: newUser.user.id,
      first_name,
      last_name,
      phone: phone || null,
      dealer_id,
    });

    // Create role
    const userRole = role === "dealer_admin" ? "dealer_admin" : "dealer_user";
    await supabaseAdmin.from("user_roles").insert({
      user_id: newUser.user.id,
      role: userRole,
      dealer_id,
    });

    // Send password reset email so user can set their own password
    await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
    });

    // Audit log
    await supabaseAdmin.from("audit_logs").insert({
      dealer_id,
      actor_user_id: caller.id,
      action_type: "team_member_created",
      entity_type: "profile",
      entity_id: newUser.user.id,
      after_data: { email, first_name, last_name, role: userRole },
    });

    return new Response(JSON.stringify({
      message: `Team member ${first_name} ${last_name} created. They can log in with their email.`,
      user_id: newUser.user.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
