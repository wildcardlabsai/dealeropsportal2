import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// --- Helpers ---

async function fetchWithRetry(url: string, options: RequestInit, timeoutMs = 10000): Promise<Response> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      if (res.ok || res.status < 500) return res;
    } catch (e) {
      if (attempt === 1) throw e;
    }
  }
  throw new Error("Max retries reached");
}

function buildSummary(dvla: any, dvsa: any, gvd: any) {
  const now = new Date().toISOString();
  const summary: Record<string, any> = {};

  if (dvla) {
    summary.make = dvla.make || null;
    summary.model = dvla.model || null;
    summary.colour = dvla.colour || null;
    summary.fuelType = dvla.fuelType || null;
    summary.engineCapacity = dvla.engineCapacity || null;
    summary.yearOfManufacture = dvla.yearOfManufacture || null;
    summary.firstRegistrationDate = dvla.monthOfFirstRegistration || null;
    summary.taxed = dvla.taxStatus === "Taxed";
    summary.taxDueDate = dvla.taxDueDate || null;
    summary.motStatus = dvla.motStatus || null;
    summary.motExpiryDate = dvla.motExpiryDate || null;
    summary.vin = dvla.vin || null;
    summary.registrationNumber = dvla.registrationNumber || null;
  }

  if (dvsa && Array.isArray(dvsa) && dvsa.length > 0) {
    const latest = dvsa[0];
    summary.latestMotDate = latest.completedDate || null;
    summary.latestMotResult = latest.testResult || null;
    summary.latestMotMileage = latest.odometerValue ? Number(latest.odometerValue) : null;
    summary.motExpiryDate = latest.expiryDate || summary.motExpiryDate || null;
  }

  if (gvd) {
    summary.numberOfOwners = gvd.numberOfOwners || null;
    summary.bodyType = gvd.bodyType || null;
    summary.doors = gvd.doors || null;
    summary.seats = gvd.seats || null;
    summary.insuranceGroup = gvd.insuranceGroup || null;
  }

  summary.sourceTimestamps = { dvlaFetchedAt: now, dvsaFetchedAt: now, gvdFetchedAt: now };
  return summary;
}

// --- Provider calls ---

async function callDVLA(vrm: string): Promise<{ data: any; status: string }> {
  const key = Deno.env.get("DVLA_API_KEY");
  if (!key) {
    console.warn("DVLA_API_KEY not set – returning mock");
    return {
      status: "success",
      data: {
        registrationNumber: vrm, taxStatus: "Taxed", taxDueDate: "2026-08-01",
        motStatus: "Valid", motExpiryDate: "2026-11-15", make: "BMW", model: "320i",
        yearOfManufacture: 2021, engineCapacity: 1998, co2Emissions: 128,
        fuelType: "PETROL", colour: "BLACK", typeApproval: "M1",
        monthOfFirstRegistration: "2021-03", markedForExport: false,
        dateOfLastV5CIssued: "2024-06-12",
      },
    };
  }
  try {
    const res = await fetchWithRetry(
      "https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles",
      { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": key }, body: JSON.stringify({ registrationNumber: vrm }) },
    );
    if (res.ok) return { status: "success", data: await res.json() };
    console.error("DVLA error:", res.status);
    return { status: "failed", data: null };
  } catch (e) {
    console.error("DVLA fetch failed:", e);
    return { status: "failed", data: null };
  }
}

async function getDvsaAccessToken(): Promise<string | null> {
  const clientId = Deno.env.get("DVSA_CLIENT_ID");
  const clientSecret = Deno.env.get("DVSA_CLIENT_SECRET");
  const tokenUrl = Deno.env.get("DVSA_TOKEN_URL");
  const scope = Deno.env.get("DVSA_SCOPE_URL");
  if (!clientId || !clientSecret || !tokenUrl || !scope) return null;

  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: scope,
  });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    console.error("DVSA token error:", res.status, await res.text());
    return null;
  }
  const json = await res.json();
  return json.access_token || null;
}

async function callDVSA(vrm: string): Promise<{ data: any; status: string }> {
  const apiKey = Deno.env.get("DVSA_API_KEY");
  if (!apiKey) {
    console.warn("DVSA_API_KEY not set – returning mock");
    return {
      status: "success",
      data: [
        { completedDate: "2025-11-15", testResult: "PASSED", odometerValue: "42350", odometerUnit: "mi", expiryDate: "2026-11-15", rfrAndComments: [{ text: "Nearside front tyre worn close to legal limit (5.2.3 (e))", type: "ADVISORY" }] },
        { completedDate: "2024-11-10", testResult: "PASSED", odometerValue: "31200", odometerUnit: "mi", expiryDate: "2025-11-10", rfrAndComments: [] },
        { completedDate: "2023-11-08", testResult: "FAILED", odometerValue: "19800", odometerUnit: "mi", rfrAndComments: [{ text: "Offside rear brake pad worn below 1.5mm (1.1.13 (a) (ii))", type: "FAIL" }, { text: "Windscreen wiper blade deteriorated (3.4 (b) (ii))", type: "FAIL" }] },
      ],
    };
  }

  // Get OAuth2 access token
  const accessToken = await getDvsaAccessToken();

  try {
    const headers: Record<string, string> = {
      Accept: "application/json+v6",
      "x-api-key": apiKey,
    };
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const res = await fetchWithRetry(
      `https://beta.check-mot.service.gov.uk/trade/vehicles/mot-tests?registration=${vrm}`,
      { headers },
    );
    if (res.ok) {
      const json = await res.json();
      const tests = Array.isArray(json) && json.length > 0 ? (json[0].motTests || json[0]) : null;
      return { status: "success", data: tests };
    }
    console.error("DVSA error:", res.status, await res.text().catch(() => ""));
    return { status: "failed", data: null };
  } catch (e) {
    console.error("DVSA fetch failed:", e);
    return { status: "failed", data: null };
  }
}

async function callGVD(vrm: string): Promise<{ data: any; status: string }> {
  const key = Deno.env.get("GVD_API_KEY");
  if (!key) {
    console.warn("GVD_API_KEY not set – returning mock");
    return {
      status: "success",
      data: { numberOfOwners: 2, v5cCount: 3, plateChangeCount: 0, vehicleClass: "Car", bodyType: "Saloon", doors: 4, seats: 5, grossWeight: 1950, insuranceGroup: "28E" },
    };
  }
  try {
    const res = await fetchWithRetry(
      `https://api.globalvehicledata.com/v1/vehicle/${vrm}`,
      { headers: { Authorization: `Bearer ${key}`, Accept: "application/json" } },
    );
    if (res.ok) return { status: "success", data: await res.json() };
    console.error("GVD error:", res.status);
    return { status: "failed", data: null };
  } catch (e) {
    console.error("GVD fetch failed:", e);
    return { status: "failed", data: null };
  }
}

// --- Main ---

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Missing authorization" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { vrm, dealer_id, force_fresh } = await req.json();
    if (!vrm || !dealer_id) return new Response(JSON.stringify({ error: "VRM and dealer_id are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const cleanVrm = vrm.replace(/\s/g, "").toUpperCase();

    // Check cache (last 6 hours) unless force_fresh
    if (!force_fresh) {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
      const { data: cached } = await supabase
        .from("vehicle_checks")
        .select("*")
        .eq("dealer_id", dealer_id)
        .eq("vrm", cleanVrm)
        .eq("status", "success")
        .gte("created_at", sixHoursAgo)
        .order("created_at", { ascending: false })
        .limit(1);

      if (cached && cached.length > 0) {
        return new Response(JSON.stringify({ cached: true, check: cached[0] }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // Run all 3 providers in parallel
    const [dvlaResult, dvsaResult, gvdResult] = await Promise.all([
      callDVLA(cleanVrm),
      callDVSA(cleanVrm),
      callGVD(cleanVrm),
    ]);

    const statuses = [dvlaResult.status, dvsaResult.status, gvdResult.status];
    const overallStatus = statuses.every(s => s === "success") ? "success" : statuses.every(s => s === "failed") ? "failed" : "partial";

    const summaryData = buildSummary(dvlaResult.data, dvsaResult.data, gvdResult.data);

    const { data: inserted, error: insertError } = await supabase.from("vehicle_checks").insert({
      dealer_id,
      vrm: cleanVrm,
      created_by_user_id: user.id,
      status: overallStatus,
      dvla_status: dvlaResult.status,
      dvsa_status: dvsaResult.status,
      gvd_status: gvdResult.status,
      dvla_json: dvlaResult.data,
      dvsa_json: dvsaResult.data,
      gvd_json: gvdResult.data,
      summary_data: summaryData,
      cached_until: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    }).select().single();

    if (insertError) console.error("Insert failed:", insertError);

    return new Response(JSON.stringify({ cached: false, check: inserted }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Vehicle check error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
