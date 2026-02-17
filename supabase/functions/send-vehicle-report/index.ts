import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("Email service not configured. Please add RESEND_API_KEY.");
    }

    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { to, vrm, reportHtml } = await req.json();
    if (!to || !vrm || !reportHtml) {
      throw new Error("Missing required fields: to, vrm, reportHtml");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to) || to.length > 255) {
      throw new Error("Invalid email address");
    }

    // Validate VRM length
    if (typeof vrm !== "string" || vrm.length > 20) {
      throw new Error("Invalid VRM");
    }

    // Sanitize HTML: strip script tags, event handlers, iframes, object/embed
    let sanitizedHtml = reportHtml;
    sanitizedHtml = sanitizedHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
    sanitizedHtml = sanitizedHtml.replace(/<iframe\b[^>]*>.*?<\/iframe>/gi, "");
    sanitizedHtml = sanitizedHtml.replace(/<object\b[^>]*>.*?<\/object>/gi, "");
    sanitizedHtml = sanitizedHtml.replace(/<embed\b[^>]*\/?>/gi, "");
    sanitizedHtml = sanitizedHtml.replace(/<link\b[^>]*>/gi, "");
    sanitizedHtml = sanitizedHtml.replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, "");
    sanitizedHtml = sanitizedHtml.replace(/javascript\s*:/gi, "");

    // Limit HTML size (max 500KB)
    if (sanitizedHtml.length > 512000) {
      throw new Error("Report content too large");
    }

    // Send via Resend
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: Deno.env.get("EMAIL_FROM") || "DealerOps <onboarding@resend.dev>",
        to: [to],
        subject: `Vehicle Check Report – ${vrm} | DealerOps`,
        html: sanitizedHtml,
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error("Resend error:", errText);
      throw new Error("Failed to send email");
    }

    const result = await emailRes.json();
    console.log("Email sent:", result.id, "to:", to, "vrm:", vrm);

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-vehicle-report error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
