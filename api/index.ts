import { handle } from "hono/vercel";
import app from "./_lib/boot.js";

export const config = { runtime: "nodejs" };

export default handle(app);
