// src/pages/pusula/data-hafiza.ts
// Öğrenen Hafıza — koçluk gözlem arşivi (GERÇEK roster id'leriyle). "Bilgi
// kaybolmasın": her gözlem tarihiyle, koçuyla, nitel gidişatıyla birikir; bu
// birikim "neyi ne zaman işaretledim" öğrenme pattern'inin ham kaydıdır.
// SENTIMENT YÜZDESİ YOK — gidişat nitel (developing / steady / strong).
// Metinler render-time pick() ile aktif dilde üretilir.

import type { ArchiveNote } from "./types-gelisim";
import { pick } from "./i18n";

const MGR = () => pick({ tr: "Mağaza Müdürü", en: "Store Manager", es: "Gerente de Tienda" });

/** Arşiv notları — aktif dilde (render-time). */
export const archiveNotes = (): ArchiveNote[] => [
  {
    id: "n1",
    employeeId: "Asya",
    date: "2026-05-28",
    kind: "Gözlem",
    topic: pick({ tr: "Kabin temelleri — kıdemli eşliğinde", en: "Fitting-room basics — paired with a senior", es: "Básicos de probador — junto a un sénior" }),
    note: pick({
      tr: "Çok yeni; tek bırakılmadı. Kabin akışını Fatma eşliğinde izledi, ilk denemelerde tempo iyi. Welcome'a henüz hazır değil.",
      en: "Very new; not left alone. Watched the fitting-room flow with Fatma, good tempo in first attempts. Not yet ready for Welcome.",
      es: "Muy nueva; no se dejó sola. Observó el flujo del probador con Fatma, buen ritmo en los primeros intentos. Aún no lista para Welcome.",
    }),
    author: "Baran B.",
    signed: true,
    tone: "developing",
  },
  {
    id: "n2",
    employeeId: "Asya",
    date: "2026-06-04",
    kind: "Koçluk",
    topic: pick({ tr: "Müşteri yaklaşımı", en: "Customer approach", es: "Acercamiento al cliente" }),
    note: pick({
      tr: "Teorik anlatım yapıldı; sahada ilk temas çekingen. İki gölge seansı sonrası göz teması belirgin arttı. Kademeli ilerleniyor.",
      en: "Theory covered; first contact on the floor was shy. After two shadow sessions eye contact rose clearly. Progressing gradually.",
      es: "Se cubrió la teoría; el primer contacto en sala fue tímido. Tras dos sesiones de acompañamiento el contacto visual subió claramente. Avanza gradualmente.",
    }),
    author: "Fatma Y.",
    signed: true,
    tone: "developing",
  },
  {
    id: "n3",
    employeeId: "Fatma",
    date: "2026-06-05",
    kind: "Gözlem",
    topic: pick({ tr: "Tepe-saat kabin akışı", en: "Peak-hour fitting-room flow", es: "Flujo de probador en hora pico" }),
    note: pick({
      tr: "Yoğun saatte kabini sakin ve hatasız yönetti; paralel kabini tek elden topladı. Yeni ekip üyesine doğal alan açtı — usta aktarımına hazır.",
      en: "Managed the fitting room calmly and flawlessly in the busy hour; consolidated parallel cabins in one hand. Naturally made room for a new member — ready to transfer mastery.",
      es: "Gestionó el probador con calma y sin errores en la hora ajetreada; centralizó los probadores paralelos. Abrió espacio de forma natural a un nuevo miembro — lista para transferir maestría.",
    }),
    author: "Baran B.",
    signed: true,
    tone: "strong",
  },
  {
    id: "n4",
    employeeId: "Kaan",
    date: "2026-06-06",
    kind: "Koçluk",
    topic: pick({ tr: "Tepe-saat dayanıklılığı", en: "Peak-hour resilience", es: "Resistencia en hora pico" }),
    note: pick({
      tr: "Sakin saatte istikrarlı; tepe-saatte ritmi korumakta zorlanıyor. Ön cephenin yanında, kontrollü maruziyetle kademeli geliştirme planlandı.",
      en: "Steady in calm hours; struggles to hold rhythm in peak. Gradual development planned beside the front, with controlled exposure.",
      es: "Estable en horas tranquilas; le cuesta mantener el ritmo en pico. Se planificó un desarrollo gradual junto al frente, con exposición controlada.",
    }),
    author: "Şeyma Ş.",
    signed: true,
    tone: "steady",
  },
  {
    id: "n5",
    employeeId: "Aysu",
    date: "2026-06-07",
    kind: "Gözlem",
    topic: pick({ tr: "Karşılama ve ilk temas", en: "Greeting and first contact", es: "Bienvenida y primer contacto" }),
    note: pick({
      tr: "Sıcak karşılamada akış kurar; Welcome'da conversion belirgin yükseliyor. Zone geçişlerinde de güçlü — esnek.",
      en: "Builds flow with a warm greeting; conversion rises clearly in Welcome. Strong in zone transitions too — flexible.",
      es: "Crea flujo con una bienvenida cálida; la conversión sube claramente en Welcome. Fuerte también en las transiciones de zona — flexible.",
    }),
    author: "Baran B.",
    signed: true,
    tone: "strong",
  },
  {
    id: "n6",
    employeeId: "Sevim",
    date: "2026-06-08",
    kind: "Koçluk",
    topic: pick({ tr: "Koçun koçluğu — geri bildirim döngüsü", en: "Coaching the coach — feedback loop", es: "El coaching del coach — bucle de feedback" }),
    note: pick({
      tr: "Yetiştirdiği kişide son vakalarda gözle görülür gelişim. Kendi gelişim kenarı: ileri One Store anlatımını sadeleştirme. Eğitimcinin de eğitimi sürüyor.",
      en: "Visible growth in recent cases in the person she develops. Own growth edge: simplifying advanced One Store delivery. Training the trainer continues too.",
      es: "Crecimiento visible en casos recientes de la persona que desarrolla. Su propio borde de crecimiento: simplificar la explicación avanzada de One Store. Formar al formador también sigue.",
    }),
    author: MGR(),
    signed: true,
    tone: "strong",
  },
  {
    id: "n7",
    employeeId: "Gamze",
    date: "2026-06-08",
    kind: "Değerlendirme",
    topic: pick({ tr: "İlk hafta özeti", en: "First-week summary", es: "Resumen de la primera semana" }),
    note: pick({
      tr: "Çok yeni — tek bırakılmıyor. Sprinter/joker rolünde kıdemli yanında temel akışı öğreniyor. Mola ve araç düzeni oturdu.",
      en: "Very new — not left alone. Learns the basic flow beside a senior in the Sprinter/joker role. Breaks and tool order settled.",
      es: "Muy nueva — no se deja sola. Aprende el flujo básico junto a un sénior en el rol Sprinter/comodín. Descansos y orden de herramientas asentados.",
    }),
    author: "Baran B.",
    signed: true,
    tone: "developing",
  },
];

export function notesFor(employeeId: string): ArchiveNote[] {
  return archiveNotes()
    .filter((n) => n.employeeId === employeeId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Arşiv kaydı olan kişiler (Hafıza varsayılan seçimi için) — dil-bağımsız. */
export const NOTED_IDS = ["Asya", "Fatma", "Kaan", "Aysu", "Sevim", "Gamze"];
