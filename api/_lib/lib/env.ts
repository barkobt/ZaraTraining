import "dotenv/config";
import dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: ".env.local", override: true });
}

function optional(name: string): string {
  return process.env[name] ?? "";
}

export const env = {
  isProduction: process.env.NODE_ENV === "production",
  databaseUrl: optional("DATABASE_URL"),
  shiftOrganizerPassword: optional("SHIFT_ORGANIZER_PASSWORD"),
  // Pusula demo kapısı — ayrı şifre dağıtılabilsin diye bağımsız env;
  // boşsa Shift Organizer şifresi Pusula'da da geçerlidir.
  pusulaPassword: optional("PUSULA_PASSWORD"),
  // Admin/Buenas-dias PIN'i — ARTIK sunucu tarafında doğrulanır (eskiden yalnız
  // client sabiti ADMIN_PIN="000000" idi, bundle'da okunup bypass edilebiliyordu).
  // Üretimde ADMIN_PIN env'i AYARLANMALI; ayarlanmazsa eski varsayılana düşer.
  adminPin: optional("ADMIN_PIN") || "000000",
};
