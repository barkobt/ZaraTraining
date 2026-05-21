import app from "./_lib/boot.js";

export const config = { runtime: "nodejs" };

// CP-SAT solver Railway'de 15-25s sürebiliyor. Vercel default 10s timeout
// Safari'de "The string did not match the expected pattern." (JSON.parse fail
// on 504 plaintext) olarak gözüküyordu. 60s Hobby/Pro plan'da güvenli üst sınır.
export const maxDuration = 60;

// Vercel `nodejs` runtime'ı NAMED HTTP method exports bekliyor.
// `hono/vercel` adapter'ı eski (req,res)=>void imzasıyla uyumsuz olduğu için
// app.fetch'i her HTTP method'a bağlıyoruz.
const handler = async (req: Request): Promise<Response> => app.fetch(req);

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
export const HEAD = handler;
