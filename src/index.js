const encoder = new TextEncoder();

async function hmac(secret, value) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...extraHeaders }
  });
}

async function verifySession(request, secret) {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/aswin_private=([^;]+)/);
  if (!match || !secret) return false;
  const [payload, signature] = match[1].split(".");
  if (!payload || !signature) return false;
  const expected = await hmac(secret, payload);
  if (signature !== expected) return false;
  try {
    const data = JSON.parse(atob(payload.replaceAll("-", "+").replaceAll("_", "/")));
    return Number(data.exp) > Date.now();
  } catch {
    return false;
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/self-hosted/login" && request.method === "POST") {
      if (!env.SELF_HOSTED_PASSWORD) {
        return json({ ok: false, code: "NOT_CONFIGURED", message: "The private area is not configured yet." }, 503);
      }

      let body;
      try { body = await request.json(); } catch { return json({ ok: false }, 400); }
      const password = typeof body?.password === "string" ? body.password : "";
      if (!password || password.length > 256) return json({ ok: false, message: "Invalid password." }, 400);

      // Constant-time-ish comparison by hashing both strings before comparing fixed-length digests.
      const supplied = await crypto.subtle.digest("SHA-256", encoder.encode(password));
      const expected = await crypto.subtle.digest("SHA-256", encoder.encode(env.SELF_HOSTED_PASSWORD));
      const a = new Uint8Array(supplied);
      const b = new Uint8Array(expected);
      let diff = 0;
      for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
      if (diff !== 0) return json({ ok: false, message: "That password didn't work." }, 401);

      const exp = Date.now() + 30 * 60 * 1000;
      const payload = btoa(JSON.stringify({ exp }))
        .replaceAll("+", "-")
        .replaceAll("/", "_")
        .replaceAll("=", "");
      const signature = await hmac(env.SELF_HOSTED_PASSWORD, payload);
      return json(
        { ok: true },
        200,
        { "Set-Cookie": `aswin_private=${payload}.${signature}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=1800` }
      );
    }

    if (url.pathname === "/api/self-hosted/status" && request.method === "GET") {
      return json({ configured: Boolean(env.SELF_HOSTED_PASSWORD), authenticated: await verifySession(request, env.SELF_HOSTED_PASSWORD) });
    }

    if (url.pathname === "/api/self-hosted/projects" && request.method === "GET") {
      if (!(await verifySession(request, env.SELF_HOSTED_PASSWORD))) return json({ ok: false, message: "Unauthorized" }, 401);
      // Intentionally empty for now. Add projects here later, or move them to D1/KV/R2.
      return json({ ok: true, projects: [
        { title: 'Google Drive Index', icon: 'gdrive', description: 'Access files directly from my Google Drive through Cloudflare.', link: 'https://t.me/drive.fowlers.site' },
        { title: 'Telegram Stremio', icon: 'tv', description: 'Stream the files directly from your Telegram channel without downloading.', link: 'https://t.me/caitlinsnow_bot' },
        { title: 'VPN', icon: 'vpn', description: 'Hide yourself and access everything made especially for Russia.', link: 'http://vpn.fowlers.site/' },
        { title: 'Mirror Telegram Bot', icon: 'torrent', description: 'Upload everything to Google Drive and Telegram, including torrent and TG files.', link: 'https://t.me/oliviaps_bot' },
        { title: 'ChatGPT Telegram Bot', icon: 'ai', description: 'Access ChatGPT through Telegram.', link: 'https://t.me/caitlin_gpt_bot' },
        { title: 'Caitlin Daily Planner', icon: 'book', description: 'Plan your day with tasks and AI tracking and suggestions.', link: 'https://planner.fowlers.site/' },
        { title: 'GDrive Stremio', icon: 'stremio', description: 'Stream files directly from your Google Drive library.', link: 'https://gdrive-stremio.fowlers.site/' }
      ] });
    }

    return env.ASSETS.fetch(request);
  }
};
