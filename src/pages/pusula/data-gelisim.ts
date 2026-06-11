// src/pages/pusula/data-gelisim.ts
// Gelişim Defteri verisi — GERÇEK kitapçıklardan zeminlenmiştir
// (docs/Gelişim Formu: Satış Danışmanı · Kasa · Operasyon). Konu adları, ASA'lar,
// seviye yapısı (Başlangıç 1–4h · Orta 5–6h · İleri 7–8h) ve 4 durum (Teorik /
// Yapabiliyor / Geliştirilmeli / Öğretebilir) kitapçığın aslına sadıktır.
// İlk durumlar demo içindir; UI'da işaretlenince değişir. RAKAM yok.
// Tüm görünür metinler render-time pick() ile aktif dilde üretilir.

import type {
  GlossaryTerm,
  GuidebookLevel,
  GuidebookRole,
  GuidebookSection,
  GuidebookTopic,
  TopicCategory,
  TopicStatus,
} from "./types-gelisim";
import { pick, type Tri } from "./i18n";

export const GUIDEBOOK_ROLES: GuidebookRole[] = ["Satış Danışmanı", "Kasa", "Operasyon"];
export const GUIDEBOOK_LEVELS: GuidebookLevel[] = ["Başlangıç", "Orta", "İleri"];

/** Rol etiketi — aktif dilde (filtre değeri TR kalır). */
export const roleLabel = (r: GuidebookRole): string =>
  r === "Satış Danışmanı"
    ? pick({ tr: "Satış Danışmanı", en: "Sales Assistant", es: "Asesor de Ventas" })
    : r === "Kasa"
      ? pick({ tr: "Kasa", en: "Cashier", es: "Caja" })
      : pick({ tr: "Operasyon", en: "Operations", es: "Operaciones" });

/** Seviye etiketi — aktif dilde. */
export const levelLabel = (lv: GuidebookLevel): string =>
  lv === "Başlangıç"
    ? pick({ tr: "Başlangıç", en: "Beginner", es: "Inicial" })
    : lv === "Orta"
      ? pick({ tr: "Orta", en: "Intermediate", es: "Intermedio" })
      : pick({ tr: "İleri", en: "Advanced", es: "Avanzado" });

/** Kategori etiketi — aktif dilde. */
export const categoryLabel = (c: TopicCategory | string): string => {
  switch (c) {
    case "Müşteri": return pick({ tr: "Müşteri", en: "Customer", es: "Cliente" });
    case "Ürün": return pick({ tr: "Ürün", en: "Product", es: "Producto" });
    case "Satış": return pick({ tr: "Satış", en: "Sales", es: "Ventas" });
    case "Süreçler": return pick({ tr: "Süreçler", en: "Processes", es: "Procesos" });
    case "Kasa": return pick({ tr: "Kasa", en: "Till", es: "Caja" });
    case "Depo": return pick({ tr: "Depo", en: "Stockroom", es: "Almacén" });
    case "Sistem": return pick({ tr: "Sistem", en: "System", es: "Sistema" });
    default: return String(c);
  }
};

export const levelWeeks = (lv: GuidebookLevel): string =>
  lv === "Başlangıç"
    ? pick({ tr: "1–4. Hafta", en: "Weeks 1–4", es: "Semanas 1–4" })
    : lv === "Orta"
      ? pick({ tr: "5–6. Hafta", en: "Weeks 5–6", es: "Semanas 5–6" })
      : pick({ tr: "7–8. Hafta", en: "Weeks 7–8", es: "Semanas 7–8" });

/** Rol başına ASA (Ana Sorumluluk Alanları) + form ağırlıkları (rol tanımı, kişi skoru değil). */
const ROLE_ASA_RAW: Record<GuidebookRole, { label: Tri; weight: string }[]> = {
  "Satış Danışmanı": [
    { label: { tr: "Mağaza İçi Operasyonu", en: "In-store Operations", es: "Operaciones en Tienda" }, weight: "%20–30" },
    { label: { tr: "Müşteri Servisi", en: "Customer Service", es: "Servicio al Cliente" }, weight: "%20–30" },
    { label: { tr: "Satış", en: "Sales", es: "Ventas" }, weight: "%15–25" },
    { label: { tr: "Kendini Geliştirme", en: "Self-development", es: "Autodesarrollo" }, weight: "%10" },
  ],
  Kasa: [
    { label: { tr: "Kasa Operasyonu & Kayıp Önleme", en: "Till Operations & Loss Prevention", es: "Operación de Caja y Prevención de Pérdidas" }, weight: "%40" },
    { label: { tr: "Müşteri Servisi", en: "Customer Service", es: "Servicio al Cliente" }, weight: "%30" },
    { label: { tr: "Süreç & Sistem Bilgisi", en: "Process & System Knowledge", es: "Conocimiento de Procesos y Sistemas" }, weight: "%20" },
    { label: { tr: "Kendini Geliştirme", en: "Self-development", es: "Autodesarrollo" }, weight: "%10" },
  ],
  Operasyon: [
    { label: { tr: "Depo Operasyonu", en: "Stockroom Operations", es: "Operación de Almacén" }, weight: "%35" },
    { label: { tr: "Müşteri Servisi", en: "Customer Service", es: "Servicio al Cliente" }, weight: "%20" },
    { label: { tr: "Ürün Bilgisi", en: "Product Knowledge", es: "Conocimiento de Producto" }, weight: "%15" },
    { label: { tr: "Kendini Geliştirme", en: "Self-development", es: "Autodesarrollo" }, weight: "%10" },
  ],
};
/** Rol ASA'ları — aktif dilde (render-time). */
export const roleAsa = (role: GuidebookRole): { label: string; weight: string }[] =>
  ROLE_ASA_RAW[role].map((a) => ({ label: pick(a.label), weight: a.weight }));

/** 5 davranışsal yetkinlik (tüm rollerde ortak — kitapçıktan). Aktif dilde. */
const COMPETENCIES_RAW: Tri[] = [
  { tr: "Etkili İletişim ve İş Birliği", en: "Effective Communication & Collaboration", es: "Comunicación Efectiva y Colaboración" },
  { tr: "Motivasyonel Uyum", en: "Motivational Fit", es: "Ajuste Motivacional" },
  { tr: "Ekip Çalışması", en: "Teamwork", es: "Trabajo en Equipo" },
  { tr: "Sürdürülebilir Performans", en: "Sustainable Performance", es: "Rendimiento Sostenible" },
  { tr: "Öğrenme Çevikliği", en: "Learning Agility", es: "Agilidad de Aprendizaje" },
];
/** Yetkinlik adları — aktif dilde (render-time). Uzunluk dile bağımsız (5). */
export const competencies = (): string[] => COMPETENCIES_RAW.map(pick);
/** Sabit uzunluk — hash/index için (dil-bağımsız). */
export const COMPETENCY_COUNT = COMPETENCIES_RAW.length;

/** 0–5 davranışsal ölçek sözleri — Defter Yetkinlik tabı + Profil davranışsal şeridi
 *  AYNI kelimeleri kullansın diye tek kaynak (sayı ekrana basılmaz, kelime basılır). */
export const COMPETENCY_SCALE_TRI: Tri[] = [
  { tr: "Gözlemlenmedi", en: "Not observed", es: "No observado" },
  { tr: "Çok Gelişmeli", en: "Much to develop", es: "Mucho por mejorar" },
  { tr: "Gelişmeli", en: "Developing", es: "En desarrollo" },
  { tr: "Yapabilir", en: "Can do", es: "Lo hace" },
  { tr: "Güçlü", en: "Strong", es: "Fuerte" },
  { tr: "Çok Güçlü", en: "Very strong", es: "Muy fuerte" },
];

type Seed = [no: number, category: TopicCategory, title: Tri, status: TopicStatus];

function section(role: GuidebookRole, level: GuidebookLevel, asa: string[], seeds: Seed[]): GuidebookSection {
  const topics: GuidebookTopic[] = seeds.map(([no, category, title, status]) => ({
    id: `${role[0]}${level[0]}-${no}`,
    no,
    category,
    title: pick(title),
    status,
  }));
  return { role, level, weeks: levelWeeks(level), asa, topics };
}

const SD_ASA = ["Mağaza İçi Operasyonu", "Müşteri Servisi", "Satış", "Kendini Geliştirme"];
const KS_ASA = ["Kasa Operasyonu & Kayıp Önleme", "Müşteri Servisi", "Süreç & Sistem", "Kendini Geliştirme"];
const OP_ASA = ["Depo Operasyonu", "Müşteri Servisi", "Ürün Bilgisi", "Kendini Geliştirme"];

/** Bölüm seed'leri (Tri başlıklar) — pick render-time olduğu için modül yükünde donmaz. */
const SECTIONS = (): GuidebookSection[] => [
  section("Satış Danışmanı", "Başlangıç", SD_ASA, [
    [1, "Müşteri", { tr: "Çalışan enerjisi ve pozitif mağaza tutumu", en: "Employee energy and a positive store attitude", es: "Energía del empleado y actitud positiva en tienda" }, "Öğretebilir"],
    [2, "Müşteri", { tr: "Tutum – Bilgi – Beceri dengesi ve rol beklentileri (oryantasyon)", en: "Attitude – Knowledge – Skill balance and role expectations (orientation)", es: "Equilibrio Actitud – Conocimiento – Habilidad y expectativas del rol (orientación)" }, "Yapabiliyor"],
    [3, "Müşteri", { tr: "Müşteri türleri ve CX (müşteri deneyimi) projesinin önemi", en: "Customer types and the importance of the CX (customer experience) project", es: "Tipos de cliente y la importancia del proyecto CX (experiencia del cliente)" }, "Geliştirilmeli"],
    [4, "Müşteri", { tr: "Müşteri deneyiminde rolümüz", en: "Our role in the customer experience", es: "Nuestro papel en la experiencia del cliente" }, "Yapabiliyor"],
    [5, "Müşteri", { tr: "Müşteri önceliği ilkesi", en: "The customer-first principle", es: "El principio de prioridad al cliente" }, "Teorik"],
    [6, "Müşteri", { tr: "Müşteri servisi temel yaklaşımı", en: "Core customer-service approach", es: "Enfoque básico del servicio al cliente" }, "Boş"],
    [7, "Müşteri", { tr: "İstek noktası ve istek hakimiyeti", en: "Request point and request mastery", es: "Punto de petición y dominio de la petición" }, "Öğretebilir"],
    [8, "Müşteri", { tr: "QR kullanımı ve müşteriyi yönlendirme", en: "Using QR and guiding the customer", es: "Uso del QR y orientación al cliente" }, "Yapabiliyor"],
    [9, "Müşteri", { tr: "iPod ile ürün gösterme ve satış", en: "Showing products and selling with the iPod", es: "Mostrar producto y vender con el iPod" }, "Geliştirilmeli"],
    [10, "Müşteri", { tr: "Geri bildirim kültürü: geri bildirim verme ve isteme", en: "Feedback culture: giving and asking for feedback", es: "Cultura de feedback: dar y pedir feedback" }, "Yapabiliyor"],
    [11, "Ürün", { tr: "Departmanlar ve buyer'lar", en: "Departments and buyers", es: "Departamentos y compradores (buyers)" }, "Teorik"],
    [12, "Ürün", { tr: "Commercial gruplar", en: "Commercial groups", es: "Grupos comerciales" }, "Boş"],
    [13, "Ürün", { tr: "Etiket okuma ve ürün içerik bilgisi", en: "Reading labels and product-content knowledge", es: "Lectura de etiquetas y conocimiento del contenido del producto" }, "Öğretebilir"],
    [14, "Ürün", { tr: "Koleksiyonlar ve tipler", en: "Collections and types", es: "Colecciones y tipos" }, "Yapabiliyor"],
    [15, "Ürün", { tr: "Zara Glossary (terim sözlüğü)", en: "Zara Glossary (terminology)", es: "Zara Glossary (glosario de términos)" }, "Geliştirilmeli"],
    [16, "Süreçler", { tr: "Askılama ve askı türleri", en: "Hanging and hanger types", es: "Colgado y tipos de percha" }, "Yapabiliyor"],
    [17, "Süreçler", { tr: "Chart sistemi ve vardiya (shift): DC1 / DC2 / Hold", en: "Chart system and shifts: DC1 / DC2 / Hold", es: "Sistema de chart y turnos (shift): DC1 / DC2 / Hold" }, "Teorik"],
    [18, "Süreçler", { tr: "Zone hakimiyeti ve devretme", en: "Zone mastery and handover", es: "Dominio de zona y traspaso" }, "Boş"],
    [19, "Süreçler", { tr: "Sprinter / Runner sistemi (360°)", en: "Sprinter / Runner system (360°)", es: "Sistema Sprinter / Runner (360°)" }, "Öğretebilir"],
    [20, "Süreçler", { tr: "Araç ve mola düzeni", en: "Equipment and break organization", es: "Organización de herramientas y descansos" }, "Yapabiliyor"],
    [21, "Süreçler", { tr: "Açılış ve kapanış süreçleri: düzen ve sıralama", en: "Opening and closing processes: order and sequence", es: "Procesos de apertura y cierre: orden y secuencia" }, "Geliştirilmeli"],
    [22, "Süreçler", { tr: "Deadline ve verimlilik (productivity) bilinci", en: "Deadline and productivity awareness", es: "Conciencia de deadline y productividad" }, "Yapabiliyor"],
  ]),
  section("Satış Danışmanı", "Orta", SD_ASA, [
    [2, "Müşteri", { tr: "Omnichannel / online sayfa: Click & Find, Click & Go, Click & Try", en: "Omnichannel / online page: Click & Find, Click & Go, Click & Try", es: "Omnicanal / página online: Click & Find, Click & Go, Click & Try" }, "Teorik"],
    [3, "Müşteri", { tr: "Alternatif ürün sunma", en: "Offering alternative products", es: "Ofrecer productos alternativos" }, "Boş"],
    [4, "Müşteri", { tr: "Tadilat hizmeti süreci", en: "Alterations service process", es: "Proceso del servicio de arreglos" }, "Geliştirilmeli"],
    [5, "Ürün", { tr: "Ürün bilgisinin önemi (→ Digital Library)", en: "Importance of product knowledge (→ Digital Library)", es: "Importancia del conocimiento del producto (→ Digital Library)" }, "Boş"],
    [6, "Ürün", { tr: "Kumaş bilgisinin önemi (→ Digital Library)", en: "Importance of fabric knowledge (→ Digital Library)", es: "Importancia del conocimiento de tejidos (→ Digital Library)" }, "Teorik"],
    [7, "Ürün", { tr: "Fit – kalıp bilgisi", en: "Fit – cut knowledge", es: "Conocimiento de fit – patrón" }, "Teorik"],
    [8, "Ürün", { tr: "ACC – Tempe alanları", en: "ACC – Tempe areas", es: "Áreas ACC – Tempe" }, "Boş"],
    [9, "Ürün", { tr: "Money Mapping ve Money Map diskleri (ürün yerleşim mantığı)", en: "Money Mapping and Money Map discs (product placement logic)", es: "Money Mapping y discos Money Map (lógica de ubicación de producto)" }, "Geliştirilmeli"],
    [10, "Süreçler", { tr: "Prova odaları (Fitting Room): alarming, theft (çalıntı) ve tara nedenleri", en: "Fitting rooms: alarming, theft and shrinkage causes", es: "Probadores (Fitting Room): alarmas, hurto y causas de merma" }, "Boş"],
    [11, "Süreçler", { tr: "Door Control uygulaması", en: "Door Control app", es: "Aplicación Door Control" }, "Teorik"],
    [12, "Süreçler", { tr: "Gun, RFID ve soft tag (EAS) — kayıp önleme", en: "Gun, RFID and soft tag (EAS) — loss prevention", es: "Gun, RFID y soft tag (EAS) — prevención de pérdidas" }, "Teorik"],
    [13, "Süreçler", { tr: "Inline süreci", en: "Inline process", es: "Proceso Inline" }, "Boş"],
    [14, "Süreçler", { tr: "ITX ve One Store süreç ilişkisi", en: "ITX and One Store process relationship", es: "Relación de procesos ITX y One Store" }, "Geliştirilmeli"],
    [16, "Süreçler", { tr: "Alarm Finder", en: "Alarm Finder", es: "Alarm Finder" }, "Boş"],
  ]),
  section("Satış Danışmanı", "İleri", SD_ASA, [
    [1, "Müşteri", { tr: "Müşteri portföyü oluşturma ve artırma", en: "Building and growing a customer portfolio", es: "Crear y ampliar la cartera de clientes" }, "Boş"],
    [2, "Müşteri", { tr: "SINT ve productivity (verimlilik) takibi", en: "SINT and productivity tracking", es: "Seguimiento de SINT y productividad" }, "Teorik"],
    [3, "Ürün", { tr: "Ranking Top 10 analizi ve kullanımı", en: "Ranking Top 10 analysis and use", es: "Análisis y uso del Ranking Top 10" }, "Boş"],
    [4, "Ürün", { tr: "Twin – Market: eş/kardeş mağaza karşılaştırması ile aksiyon", en: "Twin – Market: action via sister-store comparison", es: "Twin – Market: acción mediante comparación de tienda hermana" }, "Boş"],
    [5, "Ürün", { tr: "GAP / Compran kavramı ve kullanımı", en: "GAP / Compran concept and use", es: "Concepto y uso de GAP / Compran" }, "Boş"],
    [6, "Ürün", { tr: "Mağaza imajı ve mobilya bilgisi (frontal, manken, hizalama)", en: "Store image and furniture knowledge (frontal, mannequin, alignment)", es: "Imagen de tienda y conocimiento de mobiliario (frontal, maniquí, alineación)" }, "Teorik"],
    [7, "Süreçler", { tr: "One Store hakimiyeti ve uçtan uca süreç", en: "One Store mastery and end-to-end process", es: "Dominio de One Store y proceso de extremo a extremo" }, "Boş"],
    [8, "Süreçler", { tr: "ACO ve önemi", en: "ACO and its importance", es: "ACO y su importancia" }, "Boş"],
    [9, "Süreçler", { tr: "iPod ve envantere sahip olmanın önemi", en: "Importance of owning the iPod and inventory", es: "Importancia de tener el iPod y el inventario" }, "Boş"],
    [10, "Süreçler", { tr: "İleri açılış / kapanış: tam bağımsız düzen ve sıralama", en: "Advanced opening / closing: fully independent order and sequence", es: "Apertura / cierre avanzado: orden y secuencia totalmente autónomos" }, "Teorik"],
  ]),
  section("Kasa", "Başlangıç", KS_ASA, [
    [1, "Müşteri", { tr: "Müşteriye yaklaşım ve ilk temas (ACO noktası)", en: "Customer approach and first contact (ACO point)", es: "Acercamiento al cliente y primer contacto (punto ACO)" }, "Öğretebilir"],
    [2, "Müşteri", { tr: "Ödeme sırasında müşteriye yaklaşım ve son onay", en: "Customer approach during payment and final confirmation", es: "Acercamiento al cliente durante el pago y confirmación final" }, "Yapabiliyor"],
    [3, "Müşteri", { tr: "İade müşterisinin sırasını takip etme ve yönlendirme", en: "Tracking and guiding the returns customer's queue", es: "Seguir y orientar la cola del cliente de devoluciones" }, "Geliştirilmeli"],
    [4, "Müşteri", { tr: "Online iade (Drop-off) front sürecinde müşteriye yaklaşım", en: "Customer approach in the online-returns (Drop-off) front process", es: "Acercamiento al cliente en el proceso front de devolución online (Drop-off)" }, "Yapabiliyor"],
    [5, "Müşteri", { tr: "Müşteri hizmetlerinin ne zaman ve nasıl aranacağı; numara paylaşımı", en: "When and how to call customer service; sharing the number", es: "Cuándo y cómo llamar a atención al cliente; compartir el número" }, "Teorik"],
    [6, "Ürün", { tr: "Hediye Kartı satış prosedürü", en: "Gift Card sales procedure", es: "Procedimiento de venta de Tarjeta Regalo" }, "Boş"],
    [7, "Ürün", { tr: "İşlem sonrası poşet satışı ve poşet–askı alanı kontrolü", en: "Post-transaction bag sale and bag–hanger area check", es: "Venta de bolsa tras la transacción y control del área de bolsas–perchas" }, "Öğretebilir"],
    [8, "Ürün", { tr: "iPod satışı ve ödeme alma", en: "iPod sale and taking payment", es: "Venta con iPod y cobro" }, "Yapabiliyor"],
    [9, "Ürün", { tr: "Ödeme tipleri: puan kullanımı, e-fatura, Tax-Free ve Hediye Kartı", en: "Payment types: points, e-invoice, Tax-Free and Gift Card", es: "Tipos de pago: puntos, e-factura, Tax-Free y Tarjeta Regalo" }, "Geliştirilmeli"],
    [10, "Süreçler", { tr: "Kasa şifresi oluşturma", en: "Creating a till password", es: "Crear contraseña de caja" }, "Yapabiliyor"],
    [11, "Süreçler", { tr: "Kasa alanı tanıtımı (Regular / ACO / Drop-off iade / Online Pickup)", en: "Till area overview (Regular / ACO / Drop-off returns / Online Pickup)", es: "Presentación del área de caja (Regular / ACO / devolución Drop-off / Online Pickup)" }, "Teorik"],
    [12, "Süreçler", { tr: "ACO'da ödeme alma (nakit, kart, çoklu kart, büyük tutarlı satış)", en: "Taking payment at ACO (cash, card, multi-card, high-value sale)", es: "Cobro en ACO (efectivo, tarjeta, multitarjeta, venta de alto importe)" }, "Boş"],
    [13, "Süreçler", { tr: "Zara QR / e-bilet (e-ticket) önemi ve kullanımı", en: "Zara QR / e-ticket importance and use", es: "Importancia y uso de Zara QR / e-ticket" }, "Öğretebilir"],
    [14, "Süreçler", { tr: "Hediye değişim belgesi basma", en: "Printing a gift-exchange document", es: "Imprimir documento de cambio por regalo" }, "Yapabiliyor"],
    [15, "Süreçler", { tr: "Son fişi gösterme ve fatura basma", en: "Showing the last receipt and printing an invoice", es: "Mostrar el último ticket e imprimir factura" }, "Geliştirilmeli"],
    [16, "Süreçler", { tr: "Fiyat değişimi işlemi", en: "Price-change transaction", es: "Operación de cambio de precio" }, "Yapabiliyor"],
    [17, "Süreçler", { tr: "Yönetici onayı yetkisi ve iletişim prosedürü", en: "Manager-approval authority and communication procedure", es: "Autoridad de aprobación del gerente y procedimiento de comunicación" }, "Teorik"],
    [18, "Süreçler", { tr: "POS cihazı rulo talebi ve değişimi", en: "POS device roll request and replacement", es: "Solicitud y cambio del rollo del dispositivo POS" }, "Boş"],
    [19, "Süreçler", { tr: "Fiş iptali ve QR iptali", en: "Receipt cancellation and QR cancellation", es: "Anulación de ticket y anulación de QR" }, "Öğretebilir"],
    [20, "Süreçler", { tr: "Giriş (Door) kontrolü sonrası fiş kontrolü ve prosedürü", en: "Receipt check and procedure after Door control", es: "Control de ticket y procedimiento tras el control de Door" }, "Yapabiliyor"],
    [21, "Süreçler", { tr: "ACO kasalarını yeniden başlatma", en: "Restarting ACO tills", es: "Reiniciar las cajas ACO" }, "Geliştirilmeli"],
    [22, "Süreçler", { tr: "Online iade (Drop-off) prosedürü ve ekranı", en: "Online-returns (Drop-off) procedure and screen", es: "Procedimiento y pantalla de devolución online (Drop-off)" }, "Yapabiliyor"],
    [23, "Süreçler", { tr: "Online teslimat (pickup): ekran, müşteri adımları ve talep süreci", en: "Online delivery (pickup): screen, customer steps and request process", es: "Entrega online (pickup): pantalla, pasos del cliente y proceso de solicitud" }, "Teorik"],
    [25, "Süreçler", { tr: "Regular kasa alanı: aktif/pasif barlar, tempo sepeti, terzi barı", en: "Regular till area: active/passive bars, tempo basket, tailor bar", es: "Área de caja Regular: barras activas/pasivas, cesta tempo, barra de sastre" }, "Boş"],
    [26, "Süreçler", { tr: "Online iade süreçleri ve temel (basic) işlem alma", en: "Online-returns processes and basic transactions", es: "Procesos de devolución online y operaciones básicas" }, "Öğretebilir"],
    [27, "Süreçler", { tr: "iPod iade alma işlemi", en: "iPod return transaction", es: "Operación de devolución con iPod" }, "Yapabiliyor"],
    [28, "Süreçler", { tr: "Fiziksel mağazada temel iade ve değişim (parçalı/QR iade hariç)", en: "Basic in-store return and exchange (excluding split/QR returns)", es: "Devolución y cambio básicos en tienda física (excepto devolución parcial/QR)" }, "Geliştirilmeli"],
    [29, "Süreçler", { tr: "Parçalı/QR iade, ödeme yardımcısı iptali, bağlantı koparma ve evrak", en: "Split/QR return, payment-assistant cancellation, unlinking and paperwork", es: "Devolución parcial/QR, anulación del asistente de pago, desvinculación y documentación" }, "Yapabiliyor"],
    [30, "Süreçler", { tr: "Personel satışı ve iade prosedürü", en: "Staff-sale and return procedure", es: "Procedimiento de venta y devolución de personal" }, "Teorik"],
    [31, "Süreçler", { tr: "ACO kapanış işlemleri (anlatım ve uygulama)", en: "ACO closing operations (explanation and practice)", es: "Operaciones de cierre de ACO (explicación y práctica)" }, "Boş"],
  ]),
  section("Kasa", "Orta", KS_ASA, [
    [1, "Müşteri", { tr: "İade deneyimini yönetme (Drop-off çıkış ve Back-1 akışında müşteri)", en: "Managing the returns experience (customer in Drop-off exit and Back-1 flow)", es: "Gestionar la experiencia de devolución (cliente en salida Drop-off y flujo Back-1)" }, "Teorik"],
    [2, "Müşteri", { tr: "Unutulan eşya ve tadilat sürecinde müşteri iletişimi", en: "Customer communication in lost-property and alterations processes", es: "Comunicación con el cliente en objetos perdidos y proceso de arreglos" }, "Boş"],
    [3, "Ürün", { tr: "Para ürünlerinin (money products) takibi ve yönetimi", en: "Tracking and managing money products", es: "Seguimiento y gestión de los money products" }, "Geliştirilmeli"],
    [4, "Süreçler", { tr: "Drop-off çıkış işlemleri (anlatım ve birlikte uygulama)", en: "Drop-off exit operations (explanation and joint practice)", es: "Operaciones de salida Drop-off (explicación y práctica conjunta)" }, "Boş"],
    [5, "Süreçler", { tr: "Back-1 iade alanı takibi ve operasyon sürecini yönetme", en: "Tracking the Back-1 returns area and managing the operation process", es: "Seguimiento del área de devoluciones Back-1 y gestión del proceso de operación" }, "Teorik"],
    [6, "Süreçler", { tr: "Ops Tester açma", en: "Opening Ops Tester", es: "Abrir Ops Tester" }, "Teorik"],
    [8, "Süreçler", { tr: "Unutulan eşya prosedürü", en: "Lost-property procedure", es: "Procedimiento de objetos perdidos" }, "Boş"],
    [9, "Süreçler", { tr: "Tadilat formu düzenleme", en: "Filling in the alterations form", es: "Cumplimentar el formulario de arreglos" }, "Geliştirilmeli"],
  ]),
  section("Kasa", "İleri", KS_ASA, [
    [1, "Müşteri", { tr: "Kapanışta müşteri ve kasa akışını yönetme", en: "Managing customer and till flow at closing", es: "Gestionar el flujo de cliente y caja en el cierre" }, "Boş"],
    [2, "Müşteri", { tr: "Online teslimat alan müşteri deneyimi", en: "Experience of the customer collecting an online order", es: "Experiencia del cliente que recoge un pedido online" }, "Teorik"],
    [3, "Ürün", { tr: "Parfüm satışı takibi", en: "Tracking perfume sales", es: "Seguimiento de la venta de perfume" }, "Boş"],
    [4, "Ürün", { tr: "One Store ile stok ve ürün kullanımı", en: "Stock and product use with One Store", es: "Uso de stock y producto con One Store" }, "Boş"],
    [5, "Ürün", { tr: "Öncelikli banka kontrolü", en: "Priority bank check", es: "Control de banco prioritario" }, "Boş"],
    [6, "Süreçler", { tr: "Regular kapanış prosedürü ve organizasyonu (öncelikli kasa, yönetici)", en: "Regular closing procedure and organization (priority till, manager)", es: "Procedimiento y organización del cierre Regular (caja prioritaria, gerente)" }, "Teorik"],
    [7, "Süreçler", { tr: "Regular kapanış işlemleri: para sayımı, gün sonu, standalone gün", en: "Regular closing operations: cash count, end of day, standalone day", es: "Operaciones de cierre Regular: arqueo, fin de día, día standalone" }, "Boş"],
    [8, "Süreçler", { tr: "Process süreçleri: Back-1 – tara – poşet/askı alanı ve Drop-off alanı", en: "Process flows: Back-1 – shrinkage – bag/hanger area and Drop-off area", es: "Procesos: Back-1 – merma – área de bolsas/perchas y área Drop-off" }, "Boş"],
  ]),
  section("Operasyon", "Başlangıç", OP_ASA, [
    [1, "Müşteri", { tr: "Müşteri servisi anlayışının operasyona yansıması (önceliğin müşteri)", en: "How the customer-service mindset reflects in operations (customer first)", es: "Reflejo de la mentalidad de servicio al cliente en operaciones (el cliente primero)" }, "Öğretebilir"],
    [3, "Müşteri", { tr: "Araca teslimat prosedürü ve reyon ile iletişim", en: "Delivery-to-floor procedure and communication with the floor", es: "Procedimiento de entrega a la sala y comunicación con la sala" }, "Yapabiliyor"],
    [4, "Ürün", { tr: "Depo tanıtımı: bölümler, askılı–katlı ayrımı, tempo ve parfüm deposu", en: "Stockroom overview: sections, hanging–folded split, tempo and perfume stockroom", es: "Presentación del almacén: secciones, separación colgado–doblado, tempo y almacén de perfume" }, "Geliştirilmeli"],
    [5, "Ürün", { tr: "Ürün açılışı: verimlilik, ürün listesi (chart) ve genel mantık", en: "Product opening: efficiency, product list (chart) and general logic", es: "Apertura de producto: eficiencia, lista de producto (chart) y lógica general" }, "Yapabiliyor"],
    [6, "Ürün", { tr: "Etiket bağlama prosedürü ve etiket basımı detayları", en: "Tag-attaching procedure and label-printing details", es: "Procedimiento de colocación de etiqueta y detalles de impresión" }, "Teorik"],
    [7, "Ürün", { tr: "Askı değiştirme prosedürü ve askı tipleri", en: "Hanger-change procedure and hanger types", es: "Procedimiento de cambio de percha y tipos de percha" }, "Boş"],
    [8, "Ürün", { tr: "iPod ile ürün sorgulama", en: "Querying products with the iPod", es: "Consulta de producto con el iPod" }, "Öğretebilir"],
    [9, "Süreçler", { tr: "Depo standartları: location, priority, geçici zone, working area, cihaz", en: "Stockroom standards: location, priority, temporary zone, working area, device", es: "Estándares de almacén: location, priority, zona temporal, working area, dispositivo" }, "Yapabiliyor"],
    [10, "Süreçler", { tr: "ITX istek sekmesi: Reject, Found, Delivered, Not Seen, Not Found", en: "ITX request tab: Reject, Found, Delivered, Not Seen, Not Found", es: "Pestaña de solicitud ITX: Reject, Found, Delivered, Not Seen, Not Found" }, "Geliştirilmeli"],
    [11, "Süreçler", { tr: "Cihaz kullanımı: iPod, BB ve Printer (etiket formatı: tekstil / parfüm)", en: "Device use: iPod, BB and Printer (label format: textile / perfume)", es: "Uso de dispositivos: iPod, BB y Printer (formato de etiqueta: textil / perfume)" }, "Yapabiliyor"],
    [12, "Süreçler", { tr: "ops uygulaması: hangi verileri içerir ve nasıl çalışır", en: "ops app: what data it holds and how it works", es: "aplicación ops: qué datos contiene y cómo funciona" }, "Teorik"],
    [13, "Süreçler", { tr: "ops 25 sekmesi: 25'in anlamı, liste düşüş mantığı", en: "ops 25 tab: meaning of 25, list-drop logic", es: "pestaña ops 25: significado de 25, lógica de bajada de lista" }, "Boş"],
    [14, "Süreçler", { tr: "ITX istek takibi: kısmi sorumluluk verme ve geri bildirim", en: "ITX request tracking: assigning partial responsibility and feedback", es: "Seguimiento de solicitudes ITX: asignar responsabilidad parcial y feedback" }, "Öğretebilir"],
    [16, "Süreçler", { tr: "Operasyon uygulamaları: 07 ATS, 05 Genel Servis, ITX Deliveries, 19", en: "Operations apps: 07 ATS, 05 General Service, ITX Deliveries, 19", es: "Aplicaciones de operaciones: 07 ATS, 05 Servicio General, ITX Deliveries, 19" }, "Yapabiliyor"],
    [17, "Süreçler", { tr: "Depo açılış prosedürü: indirme, 19 isteği, ops reading, 25 kontrolü", en: "Stockroom opening procedure: unloading, 19 request, ops reading, 25 check", es: "Procedimiento de apertura de almacén: descarga, solicitud 19, ops reading, control 25" }, "Geliştirilmeli"],
    [18, "Süreçler", { tr: "Depo kapanış prosedürü: cihaz sayımı, alan toparlama, materyal/askı", en: "Stockroom closing procedure: device count, area tidying, material/hangers", es: "Procedimiento de cierre de almacén: recuento de dispositivos, recogida del área, material/perchas" }, "Yapabiliyor"],
  ]),
  section("Operasyon", "Orta", OP_ASA, [
    [2, "Müşteri", { tr: "Seçilen (online) ürün yönetiminin müşteri teslimine etkisi", en: "How picked (online) product management affects customer delivery", es: "Impacto de la gestión de producto seleccionado (online) en la entrega al cliente" }, "Teorik"],
    [3, "Ürün", { tr: "Ürün günü: açılış, picking, seçilen ürün yönetimi ve reyona gönderim", en: "Product day: opening, picking, picked-product management and sending to the floor", es: "Día de producto: apertura, picking, gestión de producto seleccionado y envío a sala" }, "Boş"],
    [4, "Ürün", { tr: "Depo düzeni: bölüm bazlı askılı–katlı yerleşim ve atama (assign) süreci", en: "Stockroom layout: section-based hanging–folded placement and assign process", es: "Disposición de almacén: ubicación colgado–doblado por sección y proceso de assign" }, "Geliştirilmeli"],
    [10, "Süreçler", { tr: "Depo jargonu: Backstock 1, Backstock 2, Backstock Guided, Tara", en: "Stockroom jargon: Backstock 1, Backstock 2, Backstock Guided, Tara", es: "Jerga de almacén: Backstock 1, Backstock 2, Backstock Guided, Tara" }, "Boş"],
  ]),
  section("Operasyon", "İleri", OP_ASA, [
    [1, "Müşteri", { tr: "ITX Deliveries akışının online müşteri teslimine etkisi", en: "How the ITX Deliveries flow affects online customer delivery", es: "Impacto del flujo ITX Deliveries en la entrega al cliente online" }, "Boş"],
    [2, "Ürün", { tr: "Bölüm bazlı ürün filtreleme, albarán kontrolü ve adet hesaplama", en: "Section-based product filtering, albarán check and quantity calculation", es: "Filtrado de producto por sección, control de albarán y cálculo de cantidad" }, "Teorik"],
    [3, "Ürün", { tr: "Gelecek ürün adedine göre materyal ihtiyacı (kapasite; örn. 1 bar = 50)", en: "Material need based on incoming product quantity (capacity; e.g. 1 bar = 50)", es: "Necesidad de material según la cantidad de producto entrante (capacidad; p. ej. 1 barra = 50)" }, "Boş"],
    [4, "Ürün", { tr: "Backstock'tan commercial basket toplama", en: "Picking a commercial basket from Backstock", es: "Recoger un commercial basket desde Backstock" }, "Boş"],
    [5, "Ürün", { tr: "Askı gönderimi prosedürü", en: "Hanger-dispatch procedure", es: "Procedimiento de envío de perchas" }, "Boş"],
    [7, "Süreçler", { tr: "Stockroom Locations sekmesi: Move Content, NOC arama", en: "Stockroom Locations tab: Move Content, NOC search", es: "Pestaña Stockroom Locations: Move Content, búsqueda NOC" }, "Teorik"],
    [8, "Süreçler", { tr: "Back-1 iade çıkış işlemleri", en: "Back-1 returns exit operations", es: "Operaciones de salida de devoluciones Back-1" }, "Boş"],
    [9, "Süreçler", { tr: "Materyal talebi ve geri bildirimi: çöp poşeti, etiket, sırt malzemesi", en: "Material request and feedback: bin bags, labels, back material", es: "Solicitud de material y feedback: bolsas de basura, etiquetas, material de soporte" }, "Boş"],
  ]),
];

export function sectionFor(role: GuidebookRole, level: GuidebookLevel): GuidebookSection | undefined {
  return SECTIONS().find((s) => s.role === role && s.level === level);
}

/** Sözlük — aktif dilde (render-time). */
export const glossaryTerms = (): GlossaryTerm[] => [
  { term: "ASA", type: pick({ tr: "Kavram", en: "Concept", es: "Concepto" }), definition: pick({ tr: "Ana Sorumluluk Alanı — bir rolün mağaza içindeki temel görev tanımı ve performans kriterlerinin bütünü.", en: "Main Area of Responsibility — the core job definition of a role in the store and the whole of its performance criteria.", es: "Área Principal de Responsabilidad — la definición básica de un rol en la tienda y el conjunto de sus criterios de desempeño." }) },
  { term: "Shadowing", type: pick({ tr: "Pedagoji", en: "Pedagogy", es: "Pedagogía" }), definition: pick({ tr: "Yeni çalışanın tecrübeli bir takım arkadaşını saha operasyonunda izleyerek süreci doğal akışında öğrenmesi.", en: "A new employee learning the process in its natural flow by watching an experienced teammate during floor operations.", es: "Un empleado nuevo que aprende el proceso en su flujo natural observando a un compañero experimentado en la operación de sala." }) },
  { term: "Reverse Mentoring", type: pick({ tr: "Pedagoji", en: "Pedagogy", es: "Pedagogía" }), definition: pick({ tr: "Yeni başlayanın; teknoloji/trend adaptasyonu gibi konularda tecrübeli yöneticilere kendi perspektifini aktarması.", en: "A newcomer sharing their own perspective with experienced managers on topics like technology/trend adoption.", es: "Un recién llegado que transmite su propia perspectiva a gerentes experimentados en temas como la adopción de tecnología/tendencias." }) },
  { term: "One Store", type: pick({ tr: "Kavram", en: "Concept", es: "Concepto" }), definition: pick({ tr: "Tüm kanalların (online, depo, kasa, reyon) izole değil entegre işlemesi prensibi.", en: "The principle that all channels (online, stockroom, till, floor) operate integrated rather than in isolation.", es: "El principio de que todos los canales (online, almacén, caja, sala) operan de forma integrada y no aislada." }) },
  { term: "Active Listening", type: pick({ tr: "Pedagoji", en: "Pedagogy", es: "Pedagogía" }), definition: pick({ tr: "Çalışanı yargılamadan, tamamen sürece odaklanarak dinleme ve beden diliyle geri bildirim verme.", en: "Listening to the employee without judgment, fully focused on the process, and giving feedback through body language.", es: "Escuchar al empleado sin juzgar, totalmente centrado en el proceso, y dar feedback con el lenguaje corporal." }) },
  { term: "Drop-off", type: pick({ tr: "Operasyon", en: "Operations", es: "Operaciones" }), definition: pick({ tr: "Müşterinin online sipariş iadesini mağaza kasasına bırakması sürecinin bütünü.", en: "The whole process of a customer dropping off an online-order return at the store till.", es: "El proceso completo en que el cliente deja la devolución de un pedido online en la caja de la tienda." }) },
  { term: "Money Mapping", type: pick({ tr: "Satış", en: "Sales", es: "Ventas" }), definition: pick({ tr: "Ürün yerleşim mantığı; disklerle satış potansiyeli yüksek alanların düzenlenmesi.", en: "Product-placement logic; organizing high-sales-potential areas with discs.", es: "Lógica de ubicación de producto; organizar con discos las zonas de alto potencial de venta." }) },
  { term: "Twin-Market", type: pick({ tr: "Analiz", en: "Analysis", es: "Análisis" }), definition: pick({ tr: "Eş/kardeş mağaza karşılaştırması ile aksiyon çıkarma yöntemi.", en: "A method of deriving action through sister-store comparison.", es: "Un método para derivar acción mediante la comparación con una tienda hermana." }) },
  { term: "ops 25", type: pick({ tr: "Sistem", en: "System", es: "Sistema" }), definition: pick({ tr: "Operasyon uygulamasında liste düşüş ve eksik tamamlama mantığını yöneten sekme.", en: "The tab in the operations app that governs list-drop and gap-completion logic.", es: "La pestaña de la aplicación de operaciones que gestiona la lógica de bajada de lista y la compleción de faltantes." }) },
];
