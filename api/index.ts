import app from "./_lib/boot.js";

export const config = { runtime: "nodejs" };

// Vercel `nodejs` runtime'ı NAMED HTTP method exports bekliyor.
// `hono/vercel` adapter'ı eski (req,res)=>void imzasıyla uyumsuz olduğu için
// app.fetch'i her HTTP method'a bağlıyoruz.
const handler = (req: Request): Promise<Response> => app.fetch(req);

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
export const HEAD = handler;
