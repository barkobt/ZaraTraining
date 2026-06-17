import { useNavigate, useSearchParams } from "react-router";

/**
 * Atölye çapraz-kişi navigasyonu — Pusula ↔ Shift Organizer.
 *
 * İlk ad ORTAK ANAHTAR'dır (Sevim, Şeyma, Fatma…). Design handoff §5'teki
 * ?person / ?focus query paramlarını bizim react-router'ımıza bağlar:
 *   - Pusula'da bir kişi  → Shift matrisinde aç   (?focus=Ad)
 *   - Shift'te bir kişi    → Pusula profilinde aç  (?person=Ad)
 */
export function useAtelyeNav() {
  const navigate = useNavigate();
  return {
    /** Kişiyi Pusula profilinde aç (Shift → Pusula). */
    openInPusula: (name: string) =>
      navigate(`/pusula?person=${encodeURIComponent(name)}`),
    /** Kişiyi Shift Organizer matrisinde aç (Pusula → Shift). */
    openInShift: (name: string) =>
      navigate(`/shift-organizer?focus=${encodeURIComponent(name)}`),
  };
}

/** URL'den çapraz-link kişi parametresini oku (mount'ta). İlk ad döner. */
export function useAtelyeParam(key: "person" | "focus"): string | null {
  const [params] = useSearchParams();
  return params.get(key);
}
