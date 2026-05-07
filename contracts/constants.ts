export const QUESTIONS = [
  {
    id: 1,
    text: "Müşteri 5 askılı kıyafetle 12 dakikadır kabinde. Çıkıyor, aynaya bakıyor, geri giriyor. Hiçbir şey söylemedi, sormadı. Sıra da uzun. Siz...",
    options: [
      { key: "A", text: "Kendi karar versin, rahatsız etmeyeyim. Belki düşünüyor" },
      { key: "B", text: "'Yardımcı olabileceğim bir şey var mı?' diye sorarım" },
      { key: "C", text: "Yanına gidip 'Hangi kombin sizi en çok yansıtıyor?' gibi spesifik bir soru sorarım" },
      { key: "D", text: "Müşterinin denediklerine bakıp 'Bu ceket çok yakışmış' gibi yorum yaparım, konuşmayı başlatırım" },
    ],
  },
  {
    id: 2,
    text: "Çok yoğun bir gün. Masada 30 askı birikti, runner gecikiyor. Welcomer pozisyonundasınız. Tam o anda yeni bir müşteri kabin için yaklaşıyor. Ne yaparsınız?",
    options: [
      { key: "A", text: "Müşteriyi karşılayıp kabine yönlendiririm, askılarla sonra ilgilenirim" },
      { key: "B", text: "Müşteriyi karşılarken, gözle masa görevlisini arar, sinyal veririm" },
      { key: "C", text: "Müşteriyi karşılarım, '1 saniye, kabini hazırlıyorum' diyerek yoldaki birkaç askıyı toplayıp gösteririm" },
      { key: "D", text: "Önce 3-4 askıyı hızlıca toplarım, sonra müşteriye dönerim" },
    ],
  },
  {
    id: 3,
    text: "Sizinle aynı vardiyada çalışan bir ekip arkadaşı sürekli prova odasından kayboluyor — telefonuna bakmaya gidiyor. Bu, iş yükünüzü artırıyor ve müşteri akışı bozuluyor. Siz ne yaparsınız?",
    options: [
      { key: "A", text: "Manager'a iletip durumu bildiririm" },
      { key: "B", text: "Arkadaşımla aramda nazik bir şekilde 'Sıra çok yoğun, yardımına ihtiyacım var' derim" },
      { key: "C", text: "Görmezden gelirim, herkesin kendi tarzı vardır" },
      { key: "D", text: "O an hiçbir şey yapmam, vardiya sonu sohbet ederim" },
    ],
  },
  {
    id: 4,
    text: "Müşteri size soruyor: 'Bu kumaş çabuk yıpranır mı? Yün mü, polyester mi?' Tam olarak emin değilsiniz. Tepkiniz?",
    options: [
      { key: "A", text: "'Sanırım yün ama ben de tam emin değilim'" },
      { key: "B", text: "'Etiketten hemen kontrol ediyorum, doğru bilgiyi vereyim' (etikete bakar)" },
      { key: "C", text: "'Genelde iyi kumaş kullanıyoruz, yıkamayla bir şey olmaz'" },
      { key: "D", text: "'Bir saniye, ekipten bilen birine soruyorum'" },
    ],
  },
];

// Carries over scoring from the originally-numbered Q2, Q3, Q5, Q6.
export const SCORING_TABLE: Record<string, number>[] = [
  { A: 0, B: 1, C: 3, D: 2 }, // Q1 (was Q2)
  { A: 1, B: 2, C: 3, D: 0 }, // Q2 (was Q3)
  { A: 1, B: 3, C: 0, D: 2 }, // Q3 (was Q5)
  { A: 1, B: 3, C: 0, D: 2 }, // Q4 (was Q6)
];

// Max score is now 12 (4 questions × 3 max). Tiers re-bucketed evenly.
export function calculateCabin(totalScore: number): {
  cabin: string;
  cabinName: string;
  label: string;
  description: string;
  longText: string;
} {
  if (totalScore <= 4) {
    return {
      cabin: "baslangic",
      cabinName: "Başlangıç Kabini",
      label: "Yeni Bir Başlangıç",
      description: "Her uzman bir gün buradan başladı.",
      longText:
        "Bugün bazı anları kaçırdık — ama bu, yarın bizi daha güçlü yapacak.\n\nBugün: -3.500 TL kayıp, 3 müşteri vazgeçti.\nYarın: Aynı senaryoda farklı davranacaksınız.",
    };
  } else if (totalScore <= 8) {
    return {
      cabin: "gelisim",
      cabinName: "Gelişim Kabini",
      label: "Potansiyel Dolu",
      description: "İyi adımlar attınız, birkaç dokunuşla mükemmelleşeceksiniz.",
      longText:
        "Potansiyeliniz belli oluyor, birkaç ipucuyla fark yaratacaksınız.\n\nBugün: +1.200 TL ama müşteri tekrar gelmedi.\nYarın: Aynı müşteri yarın annesini getirecek.",
    };
  } else {
    return {
      cabin: "altin",
      cabinName: "Altın Kabin",
      label: "Mükemmel Hizmet",
      description: "Bugün siz müşterilerin gününü kurtardınız!",
      longText:
        "+8.700 TL satış. 3 çapraz satış. Ve en önemlisi:\nYarın bu müşteri annesini getirecek. Çünkü siz 'an'ı kurtardınız.",
    };
  }
}

export const CABIN_DETAILS: Record<string, { img: string; color: string; header: string }> = {
  baslangic: { img: "/images/cabins.png", color: "#8B7355", header: "1. KABİN" },
  gelisim:   { img: "/images/cabins.png", color: "#A89B8C", header: "2. KABİN" },
  altin:     { img: "/images/cabins.png", color: "#C5A059", header: "3. KABİN" },
};

export const ADMIN_PIN = "000000";
