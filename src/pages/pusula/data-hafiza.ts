// src/pages/pusula/data-hafiza.ts
// Öğrenen Hafıza — koçluk gözlem arşivi. "Bilgi kaybolmasın": her gözlem/koçluk/
// değerlendirme tarihiyle, koçuyla, nitel gidişatıyla birikir. Bu birikim aynı
// zamanda "neyi ne zaman işaretledim" öğrenme pattern'inin ham kaydıdır.
// SENTIMENT YÜZDESİ YOK — gidişat nitel (developing / steady / strong).

import type { ArchiveNote } from "./types-gelisim";

export const ARCHIVE_NOTES: ArchiveNote[] = [
  {
    id: "n1",
    employeeId: "ece",
    date: "2026-05-28",
    kind: "Gözlem",
    topic: "Askı değiştirme ve depo düzeni",
    note: "Askılı–katlı yerleşimi ilk kez desteksiz tamamladı. Tempo iyi; etiket basımında ufak duraksamalar mentor eşliğinde çözüldü.",
    author: "Ayşe A.",
    signed: true,
    tone: "developing",
  },
  {
    id: "n2",
    employeeId: "ece",
    date: "2026-06-03",
    kind: "Koçluk",
    topic: "25R Correction — kıdemli eşliğinde",
    note: "Shadowing yapıldı. Liste düşüş mantığını teorik olarak kavradı; sahada ilk denemelerde isabet artıyor. İki gölge seansı daha öneriliyor.",
    author: "Baran B.",
    signed: true,
    tone: "developing",
  },
  {
    id: "n3",
    employeeId: "selin",
    date: "2026-06-05",
    kind: "Gözlem",
    topic: "Tepe-saat kabin akışı",
    note: "Yoğun saatte kabin operasyonunu sakin ve hatasız yönetti. Yeni ekip üyesine doğal biçimde alan açtı; usta aktarımına hazır.",
    author: "Baran B.",
    signed: true,
    tone: "strong",
  },
  {
    id: "n4",
    employeeId: "kerem",
    date: "2026-06-06",
    kind: "Koçluk",
    topic: "Tepe-saat dayanıklılığı",
    note: "Sakin saatlerde istikrarlı; tepe-saatte ritmi korumakta zorlanıyor. Ön cephenin hemen yanında, kontrollü maruziyetle kademeli geliştirme planlandı.",
    author: "Selin Y.",
    signed: true,
    tone: "steady",
  },
  {
    id: "n5",
    employeeId: "mert",
    date: "2026-06-07",
    kind: "Değerlendirme",
    topic: "Aylık gelişim özeti — Kasa",
    note: "Kasa hızı ve iade akışı güçlü. One Store ile stok kullanımı ileri seviyeye geçiş için eksik; parfüm/add-on satışı çalışılmalı.",
    author: "Baran B.",
    signed: true,
    tone: "strong",
  },
  {
    id: "n6",
    employeeId: "ayse",
    date: "2026-06-08",
    kind: "Gözlem",
    topic: "Karşılama ve ilk temas",
    note: "Sıcak karşılamada akış kurar; Selin ile birlikte çalıştığında conversion belirgin yükseliyor. Çapraz satışta çekingenlik azalıyor.",
    author: "Baran B.",
    signed: true,
    tone: "strong",
  },
  {
    id: "n7",
    employeeId: "deniz",
    date: "2026-06-08",
    kind: "Koçluk",
    topic: "Koçun koçluğu — geri bildirim döngüsü",
    note: "Yetiştirdiği kişide son 3 vakada gözle görülür gelişim. Kendi gelişim kenarı: ileri One Store anlatımını sadeleştirme. Eğitimcinin de eğitimi sürüyor.",
    author: "Mağaza Müdürü",
    signed: true,
    tone: "strong",
  },
];

export function notesFor(employeeId: string): ArchiveNote[] {
  return ARCHIVE_NOTES.filter((n) => n.employeeId === employeeId).sort((a, b) => b.date.localeCompare(a.date));
}
