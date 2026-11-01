import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") ?? "*";
const allowedHostnames = (Deno.env.get("TURNSTILE_ALLOWED_HOSTNAMES") ?? "")
  .split(",")
  .map((hostname) => hostname.trim().toLowerCase())
  .filter(Boolean);

function response(
  body: Record<string, string>,
  status: number,
  origin: string,
) {
  const headers = new Headers({
    "Access-Control-Allow-Headers": "apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
    Vary: "Origin",
  });
  headers.set(
    "Access-Control-Allow-Origin",
    allowedOrigin === "*" ? "*" : origin,
  );
  return new Response(JSON.stringify(body), { status, headers });
}

Deno.serve(async (request) => {
  const origin = request.headers.get("origin") ?? "";
  if (allowedOrigin !== "*" && origin !== allowedOrigin) {
    return response({ error: "Origin tidak diizinkan." }, 403, allowedOrigin);
  }

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Headers": "apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Origin": allowedOrigin === "*" ? "*" : origin,
        Vary: "Origin",
      },
    });
  }

  if (request.method !== "POST") {
    return response({ error: "Metode tidak diizinkan." }, 405, origin);
  }

  const turnstileSecret = Deno.env.get("TURNSTILE_SECRET_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  let serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!serviceRoleKey) {
    try {
      const secretKeys = JSON.parse(
        Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}",
      );
      serviceRoleKey = typeof secretKeys.default === "string"
        ? secretKeys.default
        : "";
    } catch (error) {
      console.error("Secret key Supabase tidak dapat dibaca:", error);
    }
  }
  if (
    !turnstileSecret || !supabaseUrl || !serviceRoleKey ||
    allowedHostnames.length === 0
  ) {
    console.error("Konfigurasi secret atau hostname Edge Function belum lengkap.");
    return response(
      { error: "Server belum dikonfigurasi. Hubungi pemilik web." },
      500,
      origin,
    );
  }

  let payload: {
    name?: unknown;
    age?: unknown;
    captchaToken?: unknown;
    consent?: unknown;
  };
  try {
    payload = await request.json();
  } catch {
    return response({ error: "Data permintaan tidak valid." }, 400, origin);
  }

  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const age = payload.age;
  const captchaToken =
    typeof payload.captchaToken === "string" ? payload.captchaToken : "";

  if (
    name.length < 1 || name.length > 50 ||
    /[\u0000-\u001f\u007f]/.test(name) ||
    typeof age !== "number" || !Number.isInteger(age) || age < 1 || age > 120 ||
    captchaToken.length < 1 || captchaToken.length > 2048 ||
    payload.consent !== true
  ) {
    return response(
      { error: "Nama, umur, persetujuan, atau token verifikasi tidak valid." },
      400,
      origin,
    );
  }

  let verificationResponse: Response;
  try {
    verificationResponse = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: turnstileSecret,
          response: captchaToken,
        }),
      },
    );
  } catch (error) {
    console.error("Tidak dapat menghubungi verifikasi Turnstile:", error);
    return response(
      { error: "Verifikasi keamanan gagal dihubungi. Coba lagi." },
      502,
      origin,
    );
  }

  if (!verificationResponse.ok) {
    console.error("Turnstile verification endpoint returned an error.");
    return response(
      { error: "Verifikasi keamanan sedang bermasalah. Coba lagi." },
      502,
      origin,
    );
  }

  let verification: {
    success?: boolean;
    action?: string;
    hostname?: string;
  };
  try {
    verification = await verificationResponse.json();
  } catch (error) {
    console.error("Respons verifikasi Turnstile tidak valid:", error);
    return response(
      { error: "Respons verifikasi keamanan tidak valid. Coba lagi." },
      502,
      origin,
    );
  }
  const hostname = typeof verification.hostname === "string"
    ? verification.hostname.toLowerCase()
    : "";
  if (
    verification.success !== true ||
    verification.action !== "birthday_submit" ||
    !allowedHostnames.includes(hostname)
  ) {
    return response(
      { error: "Verifikasi gagal atau kedaluwarsa. Selesaikan CAPTCHA lagi." },
      403,
      origin,
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await supabase.from("birthday_uses").insert({
    name,
    age,
    consent_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Insert birthday_uses gagal:", error.message);
    return response(
      { error: "Data gagal disimpan. Coba lagi atau hubungi pemilik web." },
      500,
      origin,
    );
  }

  return response({ success: "Data berhasil disimpan." }, 201, origin);
});
