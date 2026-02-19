import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const DEMO_EMAIL = "demo@dealerops.uk";
    const DEMO_PASSWORD = "Demo123456";
    const ELITE_PLAN_ID = "c5df6e93-e933-421a-865c-6317558c567c";

    const now = new Date();
    const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();
    const daysAhead = (d: number) => new Date(now.getTime() + d * 86400000).toISOString();

    // --- 1. Create or find dealer ---
    let dealerId: string;
    let adminUserId: string;

    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u: any) => u.email === DEMO_EMAIL);

    if (existingUser) {
      await supabase.auth.admin.updateUserById(existingUser.id, { password: DEMO_PASSWORD });
      adminUserId = existingUser.id;
      const { data: profile } = await supabase.from("profiles").select("dealer_id").eq("id", adminUserId).single();
      dealerId = profile?.dealer_id;
    } else {
      const { data: dealer, error: dealerErr } = await supabase.from("dealers").insert({
        name: "Demo Motors Ltd",
        legal_name: "Demo Motors Ltd",
        trading_name: "Demo Motors",
        email: DEMO_EMAIL,
        phone: "01234 567890",
        address_line1: "123 Motor Way",
        city: "Birmingham",
        postcode: "B1 1AA",
        fca_number: "FCA123456",
        ico_number: "ICO123456",
        vat_number: "GB123456789",
        company_number: "12345678",
        status: "active",
        is_active: true,
        trial_ends_at: null,
        plan_id: ELITE_PLAN_ID,
      }).select().single();
      if (dealerErr) throw new Error("Dealer: " + dealerErr.message);
      dealerId = dealer.id;

      const { data: adminUser, error: userErr } = await supabase.auth.admin.createUser({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        email_confirm: true,
      });
      if (userErr) throw new Error("User: " + userErr.message);
      adminUserId = adminUser.user.id;

      await supabase.from("profiles").upsert({ id: adminUserId, first_name: "Demo", last_name: "Admin", dealer_id: dealerId });
      await supabase.from("user_roles").insert({ user_id: adminUserId, role: "dealer_admin", dealer_id: dealerId });
      await supabase.from("dealer_preferences").insert({ dealer_id: dealerId });
      await supabase.from("dealer_subscriptions").insert({
        dealer_id: dealerId, plan_id: ELITE_PLAN_ID, status: "active",
        start_date: now.toISOString().split("T")[0],
      });
    }

    // --- 2. Wipe existing demo data ---
    await supabase.from("tasks").delete().eq("dealer_id", dealerId);
    await supabase.from("complaints").delete().eq("dealer_id", dealerId);
    await supabase.from("support_tickets").delete().eq("dealer_id", dealerId);
    await supabase.from("aftersales").delete().eq("dealer_id", dealerId);
    await supabase.from("courtesy_loans").delete().eq("dealer_id", dealerId);
    await supabase.from("courtesy_cars").delete().eq("dealer_id", dealerId);
    await supabase.from("warranties").delete().eq("dealer_id", dealerId);
    await supabase.from("invoices").delete().eq("dealer_id", dealerId);
    await supabase.from("handovers").delete().eq("dealer_id", dealerId);
    await supabase.from("leads").delete().eq("dealer_id", dealerId);
    await supabase.from("vehicle_checks").delete().eq("dealer_id", dealerId);
    await supabase.from("vehicles").delete().eq("dealer_id", dealerId);
    await supabase.from("customers").delete().eq("dealer_id", dealerId);

    // --- 3. Customers ---
    const { data: customers, error: custErr } = await supabase.from("customers").insert([
      { dealer_id: dealerId, first_name: "James", last_name: "Wilson", email: "james.wilson@demo.com", phone: "07700 900001", postcode: "B2 4QA", city: "Birmingham", consent_marketing: true },
      { dealer_id: dealerId, first_name: "Sarah", last_name: "Thompson", email: "sarah.thompson@demo.com", phone: "07700 900002", postcode: "CV1 2AB", city: "Coventry", consent_marketing: false },
      { dealer_id: dealerId, first_name: "Michael", last_name: "Patel", email: "m.patel@demo.com", phone: "07700 900003", postcode: "B15 2TT", city: "Birmingham", consent_marketing: true },
      { dealer_id: dealerId, first_name: "Emma", last_name: "Clarke", email: "emma.clarke@demo.com", phone: "07700 900004", postcode: "WV1 1QQ", city: "Wolverhampton", consent_marketing: true },
      { dealer_id: dealerId, first_name: "David", last_name: "Harris", email: "d.harris@demo.com", phone: "07700 900005", postcode: "LE1 1AA", city: "Leicester", consent_marketing: false },
      { dealer_id: dealerId, first_name: "Laura", last_name: "Robinson", email: "l.robinson@demo.com", phone: "07700 900006", postcode: "NG1 5FJ", city: "Nottingham", consent_marketing: true },
      { dealer_id: dealerId, first_name: "Tom", last_name: "Baker", email: "tom.baker@demo.com", phone: "07700 900007", postcode: "DE1 2AA", city: "Derby", consent_marketing: false },
      { dealer_id: dealerId, first_name: "Priya", last_name: "Sharma", email: "priya.sharma@demo.com", phone: "07700 900008", postcode: "B3 2AA", city: "Birmingham", consent_marketing: true },
      { dealer_id: dealerId, first_name: "Andrew", last_name: "Johnson", email: "a.johnson@demo.com", phone: "07700 900009", postcode: "OX1 1AA", city: "Oxford", consent_marketing: true },
      { dealer_id: dealerId, first_name: "Claire", last_name: "Evans", email: "claire.evans@demo.com", phone: "07700 900010", postcode: "MK1 1AA", city: "Milton Keynes", consent_marketing: false },
    ]).select();
    if (custErr) throw new Error("Customers: " + custErr.message);

    const c = customers!;

    // --- 4. Vehicles ---
    const { data: vehicles, error: vehErr } = await supabase.from("vehicles").insert([
      { dealer_id: dealerId, vrm: "BK21XYZ", make: "Ford", model: "Focus", year: 2021, colour: "Midnight Blue", mileage: 28500, advertised_price: 14995, status: "in_stock", fuel_type: "petrol", transmission: "manual" },
      { dealer_id: dealerId, vrm: "GH19ABC", make: "Volkswagen", model: "Golf", year: 2019, colour: "Silver", mileage: 45000, advertised_price: 13500, status: "sold", fuel_type: "diesel", transmission: "manual", customer_id: c[1].id },
      { dealer_id: dealerId, vrm: "YR22DEF", make: "BMW", model: "3 Series", year: 2022, colour: "Black", mileage: 12000, advertised_price: 28995, status: "in_stock", fuel_type: "petrol", transmission: "automatic" },
      { dealer_id: dealerId, vrm: "PL70GHI", make: "Mercedes", model: "A-Class", year: 2020, colour: "White", mileage: 32000, advertised_price: 22500, status: "in_stock", fuel_type: "petrol", transmission: "automatic", customer_id: c[2].id },
      { dealer_id: dealerId, vrm: "RX18JKL", make: "Audi", model: "A3", year: 2018, colour: "Red", mileage: 62000, advertised_price: 10995, status: "reserved", fuel_type: "diesel", transmission: "manual" },
      { dealer_id: dealerId, vrm: "TW23MNO", make: "Toyota", model: "Yaris", year: 2023, colour: "White", mileage: 4500, advertised_price: 17995, status: "in_stock", fuel_type: "hybrid", transmission: "automatic" },
      { dealer_id: dealerId, vrm: "CE20PQR", make: "Vauxhall", model: "Astra", year: 2020, colour: "Grey", mileage: 38000, advertised_price: 11495, status: "sold", fuel_type: "petrol", transmission: "manual", customer_id: c[3].id },
      { dealer_id: dealerId, vrm: "HN69STU", make: "Honda", model: "Civic", year: 2019, colour: "Blue", mileage: 51000, advertised_price: 12995, status: "in_stock", fuel_type: "petrol", transmission: "manual" },
      { dealer_id: dealerId, vrm: "DF21VWX", make: "Nissan", model: "Qashqai", year: 2021, colour: "Bronze", mileage: 22000, advertised_price: 19495, status: "in_stock", fuel_type: "petrol", transmission: "automatic", customer_id: c[4].id },
      { dealer_id: dealerId, vrm: "SG72YZA", make: "Kia", model: "Sportage", year: 2022, colour: "Dark Green", mileage: 15000, advertised_price: 23995, status: "in_stock", fuel_type: "hybrid", transmission: "automatic" },
      { dealer_id: dealerId, vrm: "MJ17BCD", make: "Renault", model: "Clio", year: 2017, colour: "Orange", mileage: 74000, advertised_price: 7495, status: "sold", fuel_type: "petrol", transmission: "manual", customer_id: c[5].id },
      { dealer_id: dealerId, vrm: "LP20EFG", make: "Peugeot", model: "208", year: 2020, colour: "Silver", mileage: 29000, advertised_price: 11995, status: "in_stock", fuel_type: "petrol", transmission: "manual" },
    ]).select();
    if (vehErr) throw new Error("Vehicles: " + vehErr.message);

    const v = vehicles!;

    // --- 5. Leads ---
    const { error: leadErr } = await supabase.from("leads").insert([
      { dealer_id: dealerId, first_name: "Oliver", last_name: "Martin", email: "oliver.martin@demo.com", phone: "07800 100001", stage: "new", source: "autotrader", vehicle_interest_text: "Ford Focus", created_at: daysAgo(1) },
      { dealer_id: dealerId, first_name: "Charlotte", last_name: "White", email: "charlotte.white@demo.com", phone: "07800 100002", stage: "contacted", source: "website", vehicle_interest_text: "BMW 3 Series", vehicle_id: v[2].id, created_at: daysAgo(3) },
      { dealer_id: dealerId, first_name: "Harry", last_name: "Taylor", email: "harry.taylor@demo.com", phone: "07800 100003", stage: "appointment_set", source: "phone", vehicle_interest_text: "VW Golf", created_at: daysAgo(5) },
      { dealer_id: dealerId, first_name: "Sophia", last_name: "Brown", email: "sophia.brown@demo.com", phone: "07800 100004", stage: "test_drive", source: "walk_in", vehicle_interest_text: "Kia Sportage", vehicle_id: v[9].id, created_at: daysAgo(7) },
      { dealer_id: dealerId, first_name: "Liam", last_name: "Davies", email: "liam.davies@demo.com", phone: "07800 100005", stage: "finance", source: "referral", vehicle_interest_text: "Audi A3", created_at: daysAgo(9) },
      { dealer_id: dealerId, first_name: "Amelia", last_name: "Wilson", email: "amelia.wilson@demo.com", phone: "07800 100006", stage: "negotiating", source: "facebook", vehicle_interest_text: "Toyota Yaris", vehicle_id: v[5].id, created_at: daysAgo(12) },
      { dealer_id: dealerId, first_name: "Noah", last_name: "Moore", email: "noah.moore@demo.com", phone: "07800 100007", stage: "reserved", source: "autotrader", vehicle_interest_text: "Nissan Qashqai", vehicle_id: v[8].id, created_at: daysAgo(14) },
      { dealer_id: dealerId, first_name: "Isla", last_name: "Jackson", email: "isla.jackson@demo.com", phone: "07800 100008", stage: "sold", source: "website", vehicle_interest_text: "Vauxhall Astra", vehicle_id: v[6].id, customer_id: c[3].id, created_at: daysAgo(20) },
      { dealer_id: dealerId, first_name: "Jack", last_name: "Thomas", email: "jack.thomas@demo.com", phone: "07800 100009", stage: "lost", source: "ebay", vehicle_interest_text: "Peugeot 208", created_at: daysAgo(25) },
      { dealer_id: dealerId, first_name: "Lily", last_name: "Anderson", email: "lily.anderson@demo.com", phone: "07800 100010", stage: "contacted", source: "phone", vehicle_interest_text: "Mercedes A-Class", vehicle_id: v[3].id, created_at: daysAgo(2) },
      { dealer_id: dealerId, first_name: "George", last_name: "Clark", email: "george.clark@demo.com", phone: "07800 100011", stage: "new", source: "autotrader", vehicle_interest_text: "Honda Civic", created_at: daysAgo(0) },
      { dealer_id: dealerId, first_name: "Grace", last_name: "Lewis", email: "grace.lewis@demo.com", phone: "07800 100012", stage: "test_drive", source: "walk_in", vehicle_interest_text: "BMW 3 Series", created_at: daysAgo(6) },
    ]);
    if (leadErr) throw new Error("Leads: " + leadErr.message);

    // --- 6. Handovers (columns: mileage_at_handover, keys_count, scheduled_delivery_at, delivered_at, staff_user_id) ---
    const { error: hoErr } = await supabase.from("handovers").insert([
      {
        dealer_id: dealerId, vehicle_id: v[1].id, customer_id: c[1].id,
        status: "completed", fuel_level: "full", keys_count: 2,
        mileage_at_handover: 45000,
        scheduled_delivery_at: daysAgo(15),
        delivered_at: daysAgo(15),
        notes: "Customer very happy with vehicle condition. All docs signed.",
        staff_user_id: adminUserId, salesman_name: "Demo Admin",
      },
      {
        dealer_id: dealerId, vehicle_id: v[6].id, customer_id: c[3].id,
        status: "completed", fuel_level: "three_quarter", keys_count: 1,
        mileage_at_handover: 38000,
        scheduled_delivery_at: daysAgo(8),
        delivered_at: daysAgo(8),
        notes: "All paperwork signed. MOT certificate handed over.",
        staff_user_id: adminUserId, salesman_name: "Demo Admin",
      },
      {
        dealer_id: dealerId, vehicle_id: v[0].id, customer_id: c[0].id,
        status: "scheduled", fuel_level: "full", keys_count: 2,
        mileage_at_handover: 28500,
        scheduled_delivery_at: daysAhead(2),
        notes: "PDI booked for tomorrow. Handover on Thursday.",
        staff_user_id: adminUserId, salesman_name: "Demo Admin",
      },
    ]);
    if (hoErr) throw new Error("Handovers: " + hoErr.message);

    // --- 7. Invoices (columns: subtotal, vat_amount, total) ---
    const { error: invErr } = await supabase.from("invoices").insert([
      {
        dealer_id: dealerId, customer_id: c[1].id, vehicle_id: v[1].id,
        status: "paid", subtotal: 11250, vat_amount: 2250, total: 13500,
        due_date: daysAgo(10).split("T")[0], paid_at: daysAgo(8),
        notes: "Full payment received. VW Golf sale.", created_by_user_id: adminUserId,
      },
      {
        dealer_id: dealerId, customer_id: c[3].id, vehicle_id: v[6].id,
        status: "paid", subtotal: 9580, vat_amount: 1916, total: 11496,
        due_date: daysAgo(5).split("T")[0], paid_at: daysAgo(3),
        notes: "Vauxhall Astra sale - finance settlement.", created_by_user_id: adminUserId,
      },
      {
        dealer_id: dealerId, customer_id: c[0].id, vehicle_id: v[0].id,
        status: "draft", subtotal: 12496, vat_amount: 2499, total: 14995,
        due_date: daysAhead(7).split("T")[0],
        notes: "Pending handover completion.", created_by_user_id: adminUserId,
      },
      {
        dealer_id: dealerId, customer_id: c[4].id, vehicle_id: v[8].id,
        status: "sent", subtotal: 16246, vat_amount: 3249, total: 19495,
        due_date: daysAhead(14).split("T")[0],
        notes: "Finance approved. Awaiting deposit.", created_by_user_id: adminUserId,
      },
      {
        dealer_id: dealerId, customer_id: c[5].id,
        status: "overdue", subtotal: 7083, vat_amount: 1417, total: 8500,
        due_date: daysAgo(14).split("T")[0],
        notes: "Part exchange balance outstanding.", created_by_user_id: adminUserId,
      },
    ]);
    if (invErr) throw new Error("Invoices: " + invErr.message);

    // --- 8. Warranties ---
    const { error: warErr } = await supabase.from("warranties").insert([
      {
        dealer_id: dealerId, vehicle_id: v[1].id, customer_id: c[1].id,
        warranty_type: "dealer", start_date: daysAgo(15).split("T")[0],
        end_date: daysAhead(350).split("T")[0], duration_months: 12,
        status: "active", provider: "AutoProtect", cost: 399,
        notes: "12-month dealer warranty included in sale.", created_by_user_id: adminUserId,
      },
      {
        dealer_id: dealerId, vehicle_id: v[6].id, customer_id: c[3].id,
        warranty_type: "manufacturer", start_date: daysAgo(8).split("T")[0],
        end_date: daysAhead(700).split("T")[0], duration_months: 24,
        status: "active", provider: "Vauxhall", cost: 0,
        notes: "Remaining manufacturer warranty transferred.", created_by_user_id: adminUserId,
      },
      {
        dealer_id: dealerId, vehicle_id: v[10].id, customer_id: c[5].id,
        warranty_type: "dealer", start_date: daysAgo(200).split("T")[0],
        end_date: daysAgo(20).split("T")[0], duration_months: 6,
        status: "expired", provider: "WMS Group", cost: 299, created_by_user_id: adminUserId,
      },
    ]);
    if (warErr) throw new Error("Warranties: " + warErr.message);

    // --- 9. Aftersales ---
    const { error: asErr } = await supabase.from("aftersales").insert([
      {
        dealer_id: dealerId, customer_id: c[1].id, vehicle_id: v[1].id,
        subject: "Engine warning light after purchase",
        description: "Customer called 3 days after purchase reporting intermittent engine warning light. Vehicle booked in for diagnostic.",
        case_type: "complaint", status: "in_progress", assigned_to: adminUserId,
        created_by_user_id: adminUserId,
      },
      {
        dealer_id: dealerId, customer_id: c[3].id, vehicle_id: v[6].id,
        subject: "Rear wiper blade replacement",
        description: "Customer requested rear wiper blade replacement as goodwill gesture.",
        case_type: "goodwill", status: "resolved", assigned_to: adminUserId,
        created_by_user_id: adminUserId,
        resolution: "Replaced rear wiper blade at no cost. Customer satisfied.",
        resolved_at: daysAgo(3),
      },
      {
        dealer_id: dealerId, customer_id: c[0].id, vehicle_id: v[0].id,
        subject: "Pre-delivery inspection query",
        description: "Customer asking about PDI status ahead of Thursday handover.",
        case_type: "other", status: "open", assigned_to: adminUserId,
        created_by_user_id: adminUserId,
      },
    ]);
    if (asErr) throw new Error("Aftersales: " + asErr.message);

    // --- 10. Tasks ---
    const { error: taskErr } = await supabase.from("tasks").insert([
      {
        dealer_id: dealerId, title: "Call Oliver Martin about Ford Focus test drive",
        description: "Oliver enquired via AutoTrader. Follow up to book a test drive.",
        status: "todo", priority: "high", due_date: daysAhead(1),
        related_customer_id: c[0].id, created_by_user_id: adminUserId,
      },
      {
        dealer_id: dealerId, title: "Prepare handover pack for James Wilson",
        description: "Ford Focus handover scheduled Thursday. Prepare V5, service history, warranty docs.",
        status: "in_progress", priority: "high", due_date: daysAhead(2),
        related_customer_id: c[0].id, related_vehicle_id: v[0].id,
        created_by_user_id: adminUserId,
      },
      {
        dealer_id: dealerId, title: "Chase overdue invoice – Laura Robinson",
        description: "Invoice overdue 14 days. Contact customer to arrange payment.",
        status: "todo", priority: "high", due_date: now.toISOString(),
        related_customer_id: c[5].id, created_by_user_id: adminUserId,
      },
      {
        dealer_id: dealerId, title: "Book diagnostic for VW Golf engine light",
        description: "Sarah Thompson complaint. Book in with workshop for full diagnostic scan.",
        status: "todo", priority: "medium", due_date: daysAhead(1),
        related_customer_id: c[1].id, related_vehicle_id: v[1].id,
        created_by_user_id: adminUserId,
      },
      {
        dealer_id: dealerId, title: "Reduce Audi A3 asking price by £500",
        description: "Vehicle has been on forecourt 45 days. Reduce to attract more interest.",
        status: "todo", priority: "low", due_date: daysAhead(3),
        related_vehicle_id: v[4].id, created_by_user_id: adminUserId,
      },
      {
        dealer_id: dealerId, title: "Send Google review request to Sarah Thompson",
        description: "VW Golf sale completed. Send review request link by email.",
        status: "done", priority: "medium", completed_at: daysAgo(2),
        related_customer_id: c[1].id, created_by_user_id: adminUserId,
      },
    ]);
    if (taskErr) throw new Error("Tasks: " + taskErr.message);

    // --- 11. Courtesy Cars ---
    const { data: cCars, error: ccErr } = await supabase.from("courtesy_cars").insert([
      { dealer_id: dealerId, vrm: "DM20CTY", make: "Ford", model: "Fiesta", status: "available", current_mileage: 18000, notes: "Clean and ready. Full tank." },
      { dealer_id: dealerId, vrm: "DM21CTY", make: "Vauxhall", model: "Corsa", status: "on_loan", current_customer_id: c[1].id, current_mileage: 34000, loaned_at: daysAgo(3), expected_return: daysAhead(4), notes: "Loaned while VW Golf is in for diagnostic." },
    ]).select();
    if (ccErr) throw new Error("Courtesy cars: " + ccErr.message);

    // --- 12. Vehicle Checks (vrm-only, correct columns) ---
    const { error: vcErr } = await supabase.from("vehicle_checks").insert([
      { dealer_id: dealerId, vrm: "BK21XYZ", status: "success", created_by_user_id: adminUserId },
      { dealer_id: dealerId, vrm: "YR22DEF", status: "success", created_by_user_id: adminUserId },
      { dealer_id: dealerId, vrm: "RX18JKL", status: "partial", created_by_user_id: adminUserId },
    ]);
    if (vcErr) throw new Error("Vehicle checks: " + vcErr.message);

    // --- 13. Support Tickets ---
    const { error: stErr } = await supabase.from("support_tickets").insert([
      {
        dealer_id: dealerId, subject: "How do I export customer data for GDPR review?",
        category: "question", priority: "medium", status: "open",
        created_by_user_id: adminUserId,
      },
      {
        dealer_id: dealerId, subject: "Invoice PDF missing logo",
        category: "bug", priority: "high", status: "in_progress",
        created_by_user_id: adminUserId,
      },
    ]);
    if (stErr) throw new Error("Support tickets: " + stErr.message);

    // --- 14. Complaints ---
    const { error: compErr } = await supabase.from("complaints").insert([
      {
        dealer_id: dealerId, customer_name: "Sarah Thompson", customer_id: c[1].id,
        description: "Customer unhappy about engine warning light appearing 3 days post-purchase. Requesting investigation.",
        category: "vehicle_quality", channel: "phone", status: "open",
        received_at: daysAgo(5),
      },
      {
        dealer_id: dealerId, customer_name: "David Harris",
        description: "Customer complained about lengthy wait for part-exchange valuation.",
        category: "service", channel: "email", status: "resolved",
        resolution_summary: "Apologised and offered £100 service voucher. Customer accepted.",
        resolution_at: daysAgo(2), received_at: daysAgo(10),
      },
    ]);
    if (compErr) throw new Error("Complaints: " + compErr.message);

    return new Response(JSON.stringify({
      success: true,
      message: "Demo account seeded successfully!",
      login: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
      dealer_id: dealerId,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: any) {
    console.error("Seed error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
