import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const results: string[] = [];

  // Create admin account
  const { data: adminUser, error: adminErr } = await supabaseAdmin.auth.admin.createUser({
    email: "admin@dealerops.dev",
    password: "admin123",
    email_confirm: true,
  });

  if (adminErr) {
    results.push(`Admin: ${adminErr.message}`);
  } else {
    results.push(`Admin created: ${adminUser.user.id}`);

    // Create profile + role for admin
    // First get or create a dealer
    const { data: dealer } = await supabaseAdmin
      .from("dealers")
      .select("id")
      .limit(1)
      .single();

    let dealerId = dealer?.id;
    if (!dealerId) {
      const { data: newDealer } = await supabaseAdmin
        .from("dealers")
        .insert({ name: "Dev Dealership", status: "active" })
        .select("id")
        .single();
      dealerId = newDealer?.id;
    }

    if (dealerId) {
      await supabaseAdmin.from("profiles").upsert({
        id: adminUser.user.id,
        first_name: "Dev",
        last_name: "Admin",
        dealer_id: dealerId,
      });

      await supabaseAdmin.from("user_roles").upsert({
        user_id: adminUser.user.id,
        role: "dealer_admin",
        dealer_id: dealerId,
      }, { onConflict: "user_id,role" });

      // Also add super_admin role
      await supabaseAdmin.from("user_roles").insert({
        user_id: adminUser.user.id,
        role: "super_admin",
        dealer_id: dealerId,
      });
    }
  }

  // Create regular user account
  const { data: regularUser, error: userErr } = await supabaseAdmin.auth.admin.createUser({
    email: "user@dealerops.dev",
    password: "user1234",
    email_confirm: true,
  });

  if (userErr) {
    results.push(`User: ${userErr.message}`);
  } else {
    results.push(`User created: ${regularUser.user.id}`);

    const { data: dealer } = await supabaseAdmin
      .from("dealers")
      .select("id")
      .limit(1)
      .single();

    if (dealer?.id) {
      await supabaseAdmin.from("profiles").upsert({
        id: regularUser.user.id,
        first_name: "Dev",
        last_name: "User",
        dealer_id: dealer.id,
      });

      await supabaseAdmin.from("user_roles").upsert({
        user_id: regularUser.user.id,
        role: "dealer_user",
        dealer_id: dealer.id,
      }, { onConflict: "user_id,role" });
    }
  }

  return new Response(JSON.stringify({ results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
