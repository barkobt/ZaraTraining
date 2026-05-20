import app from "./_lib/boot.js";

export const config = { runtime: "nodejs" };

// Vercel'in Web standard fetch handler signature'ı.
// `hono/vercel` adapter eski (req, res) => void imzasıyla uyumsuz olduğu için
// Hono app.fetch'i doğrudan export ediyoruz.
export default async function handler(req: Request): Promise<Response> {
  return app.fetch(req);
}
