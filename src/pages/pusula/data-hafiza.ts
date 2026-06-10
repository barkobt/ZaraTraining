// src/pages/pusula/data-hafiza.ts
// Öğrenen Hafıza — koçluk gözlem arşivi (GERÇEK roster id'leriyle). "Bilgi
// kaybolmasın": her gözlem tarihiyle, koçuyla, nitel gidişatıyla birikir; bu
// birikim "neyi ne zaman işaretledim" öğrenme pattern'inin ham kaydıdır.
// SENTIMENT YÜZDESİ YOK — gidişat nitel (developing / steady / strong).

import type { ArchiveNote } from "./types-gelisim";

export const ARCHIVE_NOTES: ArchiveNote[] = [
  {
    id: "n1",
    employeeId: "Asya",
    date: "2026-05-28",
    kind: "Gözlem",
    topic: "Kabin temelleri — kıdemli eşliğinde",
    note: "Çok yeni; tek bırakılmadı. Kabin akışını Fatma eşliğinde izledi, ilk denemelerde tempo iyi. Welcome'a henüz hazır değil.",
    author: "Baran B.",
    signed: true,
    tone: "developing",
  },
  {
    id: "n2",
    employeeId: "Asya",
    date: "2026-06-04",
    kind: "Koçluk",
    topic: "Müşteri yaklaşımı",
    note: "Teorik anlatım yapıldı; sahada ilk temas çekingen. İki gölge seansı sonrası göz teması belirgin arttı. Kademeli ilerleniyor.",
    author: "Fatma Y.",
    signed: true,
    tone: "developing",
  },
  {
    id: "n3",
    employeeId: "Fatma",
    date: "2026-06-05",
    kind: "Gözlem",
    topic: "Tepe-saat kabin akışı",
    note: "Yoğun saatte kabini sakin ve hatasız yönetti; paralel kabini tek elden topladı. Yeni ekip üyesine doğal alan açtı — usta aktarımına hazır.",
    author: "Baran B.",
    signed: true,
    tone: "strong",
  },
  {
    id: "n4",
    employeeId: "Kaan",
    date: "2026-06-06",
    kind: "Koçluk",
    topic: "Tepe-saat dayanıklılığı",
    note: "Sakin saatte istikrarlı; tepe-saatte ritmi korumakta zorlanıyor. Ön cephenin yanında, kontrollü maruziyetle kademeli geliştirme planlandı.",
    author: "Şeyma Ş.",
    signed: true,
    tone: "steady",
  },
  {
    id: "n5",
    employeeId: "Aysu",
    date: "2026-06-07",
    kind: "Gözlem",
    topic: "Karşılama ve ilk temas",
    note: "Sıcak karşılamada akış kurar; Welcome'da conversion belirgin yükseliyor. Zone geçişlerinde de güçlü — esnek.",
    author: "Baran B.",
    signed: true,
    tone: "strong",
  },
  {
    id: "n6",
    employeeId: "Sevim",
    date: "2026-06-08",
    kind: "Koçluk",
    topic: "Koçun koçluğu — geri bildirim döngüsü",
    note: "Yetiştirdiği kişide son vakalarda gözle görülür gelişim. Kendi gelişim kenarı: ileri One Store anlatımını sadeleştirme. Eğitimcinin de eğitimi sürüyor.",
    author: "Mağaza Müdürü",
    signed: true,
    tone: "strong",
  },
  {
    id: "n7",
    employeeId: "Gamze",
    date: "2026-06-08",
    kind: "Değerlendirme",
    topic: "İlk hafta özeti",
    note: "Çok yeni — tek bırakılmıyor. Sprinter/joker rolünde kıdemli yanında temel akışı öğreniyor. Mola ve araç düzeni oturdu.",
    author: "Baran B.",
    signed: true,
    tone: "developing",
  },
];

export function notesFor(employeeId: string): ArchiveNote[] {
  return ARCHIVE_NOTES.filter((n) => n.employeeId === employeeId).sort((a, b) => b.date.localeCompare(a.date));
}

/** Arşiv kaydı olan kişiler (Hafıza varsayılan seçimi için). */
export const NOTED_IDS = Array.from(new Set(ARCHIVE_NOTES.map((n) => n.employeeId)));
