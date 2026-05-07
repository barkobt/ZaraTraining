export const QUESTIONS = [
  {
    id: 1,
    text: "Saat 11:00, mağaza yeni açıldı. Prova odası önünde 4 müşteri sıra bekliyor. Aynı anda iPod'unuza Inline'dan bir runner çağrısı geliyor: bir önceki müşteri için 'L beden lazım' diyor. Önceliğiniz?",
    options: [
      { key: "A", text: "Sıradaki müşteriyi karşılarım, runner çağrısını başka biri görsün" },
      { key: "B", text: "Önce iPod'a yanıt veririm, sıradaki müşteriden 30 saniye sabır isterim" },
      { key: "C", text: "Sırayı yöneten arkadaşa 'ben Inline'a bakıyorum' diyerek hızlıca koordine olurum" },
      { key: "D", text: "Sırayı tutar, müşteriyi içeri alırken iPod'u açar, paralel hallederim" },
    ],
  },
  {
    id: 2,
    text: "Müşteri 5 askılı kıyafetle 12 dakikadır kabinde. Çıkıyor, aynaya bakıyor, geri giriyor. Hiçbir şey söylemedi, sormadı. Sıra da uzun. Siz...",
    options: [
      { key: "A", text: "Kendi karar versin, rahatsız etmeyeyim. Belki düşünüyor" },
      { key: "B", text: "'Yardımcı olabileceğim bir şey var mı?' diye sorarım" },
      { key: "C", text: "Yanına gidip 'Hangi kombin sizi en çok yansıtıyor?' gibi spesifik bir soru sorarım" },
      { key: "D", text: "Müşterinin denediklerine bakıp 'Bu ceket çok yakışmış' gibi yorum yaparım, konuşmayı başlatırım" },
    ],
  },
  {
    id: 3,
    text: "Çok yoğun bir gün. Masada 30 askı birikti, runner gecikiyor. Welcomer pozisyonundasınız. Tam o anda yeni bir müşteri kabin için yaklaşıyor. Ne yaparsınız?",
    options: [
      { key: "A", text: "Müşteriyi karşılayıp kabine yönlendiririm, askılarla sonra ilgilenirim" },
      { key: "B", text: "Müşteriyi karşılarken, gözle masa görevlisini arar, sinyal veririm" },
      { key: "C", text: "Müşteriyi karşılarım, '1 saniye, kabini hazırlıyorum' diyerek yoldaki birkaç askıyı toplayıp gösteririm" },
      { key: "D", text: "Önce 3-4 askıyı hızlıca toplarım, sonra müşteriye dönerim" },
    ],
  },
  {
    id: 4,
    text: "Bir müşteri kabinden çıkıyor ve size dönüp şöyle diyor: 'Aslında bu elbise çok güzel ama bütçemi aşıyor.' Sıradaki müşteri sizi bekliyor. İlk tepkiniz?",
    options: [
      { key: "A", text: "'Anlıyorum, kampanyalarımız var, isterseniz bakabiliriz'" },
      { key: "B", text: "'Bütçeniz nedir? Benzer kalıpta daha uygun fiyatlı seçeneklerimiz var, hızlıca gösterebilirim'" },
      { key: "C", text: "'Olur, başka bir şey isterseniz buradayım' (sıradaki müşteriye dönerim)" },
      { key: "D", text: "'Çok haklısınız, kaliteli ürünler maalesef öyle. Tekrar bekleriz'" },
    ],
  },
  {
    id: 5,
    text: "Sizinle aynı vardiyada çalışan bir ekip arkadaşı sürekli prova odasından kayboluyor — telefonuna bakmaya gidiyor. Bu, iş yükünüzü artırıyor ve müşteri akışı bozuluyor. Siz ne yaparsınız?",
    options: [
      { key: "A", text: "Manager'a iletip durumu bildiririm" },
      { key: "B", text: "Arkadaşımla aramda nazik bir şekilde 'Sıra çok yoğun, yardımına ihtiyacım var' derim" },
      { key: "C", text: "Görmezden gelirim, herkesin kendi tarzı vardır" },
      { key: "D", text: "O an hiçbir şey yapmam, vardiya sonu sohbet ederim" },
    ],
  },
  {
    id: 6,
    text: "Müşteri size soruyor: 'Bu kumaş çabuk yıpranır mı? Yün mü, polyester mi?' Tam olarak emin değilsiniz. Tepkiniz?",
    options: [
      { key: "A", text: "'Sanırım yün ama ben de tam emin değilim'" },
      { key: "B", text: "'Etiketten hemen kontrol ediyorum, doğru bilgiyi vereyim' (etikete bakar)" },
      { key: "C", text: "'Genelde iyi kumaş kullanıyoruz, yıkamayla bir şey olmaz'" },
      { key: "D", text: "'Bir saniye, ekipten bilen birine soruyorum'" },
    ],
  },
  {
    id: 7,
    text: "Akşam 19:30. 9 saatlik vardiyanın sonundasınız. Ayaklarınız ağrıyor. Tam o anda kapıdan girmek üzere olan müşteri, prova odasına yöneliyor. Kendinize ne dersiniz?",
    options: [
      { key: "A", text: "'1 saatim kaldı, sadece bu müşteriyi geçireyim'" },
      { key: "B", text: "'Yorgun olsam da, bu müşterinin günü olabilir, normal enerjimi gösteririm'" },
      { key: "C", text: "'Standart hizmet veririm, kimse fark etmez zaten'" },
      { key: "D", text: "'Müşteriye 'kapanışa az kaldı' diye bilgi veririm, hızlıca halletmeye çalışırım'" },
    ],
  },
];

export const SCORING_TABLE: Record<string, number>[] = [
  { A: 1, B: 2, C: 3, D: 2 },
  { A: 0, B: 1, C: 3, D: 2 },
  { A: 1, B: 2, C: 3, D: 0 },
  { A: 2, B: 3, C: 0, D: 1 },
  { A: 1, B: 3, C: 0, D: 2 },
  { A: 1, B: 3, C: 0, D: 2 },
  { A: 1, B: 3, C: 0, D: 0 },
];

export function calculateCabin(totalScore: number): {
  cabin: string;
  cabinName: string;
  label: string;
  description: string;
  longText: string;
} {
  if (totalScore <= 7) {
    return {
      cabin: "baslangic",
      cabinName: "Başlangıç Kabini",
      label: "Yeni Bir Başlangıç",
      description: "Her uzman bir gün buradan başladı.",
      longText:
        "Bugün bazı anları kaçırdık — ama bu, yarın bizi daha güçlü yapacak.\n\nBugün: -3.500 TL kayıp, 3 müşteri vazgeçti.\nYarın: Aynı senaryoda farklı davranacaksınız.",
    };
  } else if (totalScore <= 14) {
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
  gelisim: { img: "/images/cabins.png", color: "#A89B8C", header: "2. KABİN" },
  altin: { img: "/images/cabins.png", color: "#C5A059", header: "3. KABİN" },
};

export const ADMIN_PIN = "000000";
