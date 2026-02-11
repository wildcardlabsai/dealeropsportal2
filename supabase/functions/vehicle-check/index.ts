import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify the user's JWT
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { vrm, dealer_id } = await req.json();
    if (!vrm || !dealer_id) {
      return new Response(JSON.stringify({ error: "VRM and dealer_id are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleanVrm = vrm.replace(/\s/g, "").toUpperCase();
    let dvlaData = null;
    let dvsaData = null;
    let gvdData = null;

    // ---- DVLA API ----
    const DVLA_API_KEY = Deno.env.get("DVLA_API_KEY");
    if (DVLA_API_KEY) {
      try {
        const dvlaRes = await fetch(
          "https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": DVLA_API_KEY,
            },
            body: JSON.stringify({ registrationNumber: cleanVrm }),
          }
        );
        if (dvlaRes.ok) {
          dvlaData = await dvlaRes.json();
        } else {
          console.error(`DVLA API error: ${dvlaRes.status}`);
        }
      } catch (e) {
        console.error("DVLA fetch failed:", e);
      }
    } else {
      console.warn("DVLA_API_KEY not configured");
    }

    // ---- DVSA MOT API ----
    const DVSA_API_KEY = Deno.env.get("DVSA_API_KEY");
    if (DVSA_API_KEY) {
      try {
        const dvsaRes = await fetch(
          `https://beta.check-mot.service.gov.uk/trade/vehicles/mot-tests?registration=${cleanVrm}`,
          {
            headers: {
              Accept: "application/json+v6",
              "x-api-key": DVSA_API_KEY,
            },
          }
        );
        if (dvsaRes.ok) {
          const dvsaJson = await dvsaRes.json();
          // DVSA returns an array; extract MOT tests from the first result
          if (Array.isArray(dvsaJson) && dvsaJson.length > 0) {
            dvsaData = dvsaJson[0].motTests || dvsaJson[0];
          }
        } else {
          console.error(`DVSA API error: ${dvsaRes.status}`);
        }
      } catch (e) {
        console.error("DVSA fetch failed:", e);
      }
    } else {
      console.warn("DVSA_API_KEY not configured");
    }

    // ---- Global Vehicle Data (GVD) API ----
    const GVD_API_KEY = Deno.env.get("GVD_API_KEY");
    if (GVD_API_KEY) {
      try {
        const gvdRes = await fetch(
          `https://api.globalvehicledata.com/v1/vehicle/${cleanVrm}`,
          {
            headers: {
              Authorization: `Bearer ${GVD_API_KEY}`,
              Accept: "application/json",
            },
          }
        );
        if (gvdRes.ok) {
          gvdData = await gvdRes.json();
        } else {
          console.error(`GVD API error: ${gvdRes.status}`);
        }
      } catch (e) {
        console.error("GVD fetch failed:", e);
      }
    } else {
      console.warn("GVD_API_KEY not configured");
    }

    // Store the check in the database
    const { error: insertError } = await supabase.from("vehicle_checks").insert({
      dealer_id,
      vrm: cleanVrm,
      created_by_user_id: user.id,
      dvla_data: dvlaData,
      dvsa_data: dvsaData,
      gvd_data: gvdData,
    });

    if (insertError) {
      console.error("Failed to store check:", insertError);
    }

    return new Response(
      JSON.stringify({
        vrm: cleanVrm,
        dvla: dvlaData,
        dvsa: dvsaData,
        gvd: gvdData,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Vehicle check error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
