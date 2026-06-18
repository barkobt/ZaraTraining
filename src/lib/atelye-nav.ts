import { useNavigate } from "react-router";

/**
 * Atölye çapraz-kişi navigasyonu — Pusula → Shift Organizer.
 *
 * İlk ad ORTAK ANAHTAR'dır (Sevim, Şeyma, Fatma…). Yalnız Pusula→Shift yönü
 * canlıdır: Shift personeli gerçek veridir, ad ile matriste konumlanır.
 * Ters yön (Shift→Pusula) BİLİNÇLİ SEMBOLİK bırakıldı — Pusula profilleri
 * temsilî/rastgele olduğundan oraya navigasyon yanıltıcı olurdu (pusula ikonu
 * tıklanamaz, AI önerisi devre dışı).
 */
export function useAtelyeNav() {
  const navigate = useNavigate();
  return {
    /** Kişiyi Shift Organizer matrisinde aç (Pusula → Shift). */
    openInShift: (name: string) =>
      navigate(`/shift-organizer?focus=${encodeURIComponent(name)}`),
  };
}
