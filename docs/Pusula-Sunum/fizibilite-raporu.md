# PUSULA · Fizibilite Raporu
ZARA Bornova pilot uygulaması için değerlendirme
Hazırlayan: Proje ekibi · Haziran 2026

---

## 1. Yönetici Özeti

Pusula, mağaza koçunun günlük çalışmasını tek bir yüzeyde toplayan ve bu çalışmadan öğrenen bir insan gelişimi platformudur. Bu rapor, platformun Bornova mağazasında pilot olarak hayata geçirilmesinin teknik, operasyonel ve etik açıdan uygulanabilir olduğunu değerlendirmektedir.

Üç bulgu öne çıkıyor. Birincisi, sistemin ihtiyaç duyduğu verinin tamamına yakını mağazada bugün zaten üretiliyor; ek donanım veya yeni bir veri toplama süreci gerekmiyor. İkincisi, platform koça ek iş yüklemeden çalışacak şekilde tasarlandı; koç zaten doldurduğu kitapçığı doldurur, zaten yazdığı gözlemi yazar, sistem bu işten öğrenir. Üçüncüsü, kişi puanlamasına ve sıralamaya mimari düzeyde kapalı olması, benzer girişimlerin en sık takıldığı güven ve mevzuat engellerini baştan ortadan kaldırıyor.

Sonuç olarak pilot, mevcut kaynaklarla ve makul bir takvimle başlatılabilir durumdadır. Aşağıdaki bölümler bu değerlendirmenin dayanaklarını sunar.

## 2. İhtiyacın Tanımı

Mağaza operasyonunda üç kayıp alanı tespit edilmiştir.

Bilgi kaybı. Deneyimli çalışanların yöntem bilgisi yazılı hiçbir kaynakta yer almıyor. Usta bir çalışan ayrıldığında kabin yönetiminden müşteri karşılamaya kadar yıllar içinde damıtılmış pratik bilgi kurumdan çıkıyor. Yeni gelen koç süreci sıfırdan kuruyor.

Görünürlük kaybı. Gelişim kitapçıkları dolduruluyor ancak içerik hiçbir karara bağlanmıyor. Yeni başlayan bir çalışanın ilk aylardaki ilerleyişi hiçbir sistemde iz bırakmıyor; aptitude kararları büyük ölçüde izlenime dayanıyor.

Verim kaybı. Saatlik trafik verisi, akşam saatlerinde ziyaretçi sayısı zirvedeyken satışa dönüş oranının dibe indiğini gösteriyor. Bu pencere, doğru yetkinlikteki kişilerin doğru bölgede olmamasıyla doğrudan ilişkili. Mevcut planlama araçları vardiyayı saat bazında kurar; kişinin hangi alanda güçlü olduğu bilgisini kullanmaz.

## 3. Önerilen Çözümün Kapsamı

Pusula dokuz bölümden oluşur: günün kuyruğu, ekip, kişi profili, gelişim defteri, öğrenen hafıza, usta yolu, yerleştirme, saha krokisi ve etki ekranı. Platform mevcut sistemlerin yerine geçmez; Orquest planlaması, One Store göstergeleri ve basılı gelişim kitapçıkları üzerine bir akıl katmanı olarak oturur.

Yetkinlik modeli altı operasyonel alanda kuruludur: karşılama ve yönlendirme, kabin akışı, reyon dolumu ve devir, sell-through takibi, ürün bilgisi, kayıp önleme. Her alandaki durum üç kanıt kanalından beslenir:

1. Kişiye bağlanabilen ölçümler. Kabin sayacı ve EAS kapı kayıtları gibi, belirli bir vardiyada belirli bir kişiyle ilişkilendirilebilen veriler.
2. Vardiya kesişimi analizi. Mağaza geneli ölçülen trafik ve conversion verisinin, kişinin sahada olduğu saat dilimleriyle çakıştırılması.
3. Kitapçık ve koç gözlemi. Gelişim defterindeki işaretler ile koçun yapılandırılmış gözlem notları.

Kanıt yetersizse sistem bunu açıkça söyler. Denenmemiş bir alan zayıflık olarak değil veri yok olarak işlenir ve sakin saatlerde, deneyimli bir çalışan eşliğinde keşif vardiyası önerilir. Bu yaklaşım hem adil iş dağılımını korur hem de modelin veri tabanını dengeli biçimde genişletir.

## 4. Teknik Uygulanabilirlik

Veri tarafında yeni bir yatırım gerekmiyor. Saatlik trafik ve conversion Orquest üzerinden, kabin sayacı ve EAS kayıtları mevcut mağaza altyapısından, kitapçık içeriği ise pilotla birlikte dijitalleşen mevcut formlardan geliyor. Tek dönüşüm, kâğıt kitapçığın ekrana taşınmasıdır ve bu da koçun alışkanlıklarını değiştirmeden, aynı işaretleme mantığıyla yapılmıştır.

Çıkarım katmanı kasıtlı olarak sade tutulmuştur. Öneriler kural temelli sinyal eşleştirme ve benzer profil karşılaştırmasıyla üretilir; her öneri kartında tetikleyen sinyal, kanıt kanalı, çıkarım adımı ve güven seviyesi açıkça gösterilir. Bu şeffaflık tercihinin iki sonucu var: sistem denetlenebilir kalıyor ve sahada açıklanabilir olduğu için benimsenmesi kolaylaşıyor.

Soğuk başlangıç sınırı bilinçli olarak ürünün diline işlendi. İlk haftalarda kanıt az olduğundan öneriler geneldir ve sistem bunu ekranda belirtir. Kanıt kanalları beslemeye başladıkça öneriler kişiselleşir. Bu olgunlaşma eğrisi gizlenmemekte, etki ekranında açıkça gösterilmektedir.

## 5. Operasyonel Uygulanabilirlik

Pilotun başarısı koçun günlük ritmine uyum sağlamasına bağlıdır. Tasarımın temel ölçütü şuydu: koça yeni bir iş ekleyen her özellik elenir. Mevcut akışta koç güne tek ekranla başlar, onay ve planlamayı olduğu yerde yapar, gözlemini iki cümleyle yazar. Sistemin kendisinden istediği fazladan tek davranış, çıkarılan etiketi onaylamaktır ve bu üç saniyelik bir dokunuştur.

Eğitim ihtiyacı düşüktür. Arayüz, koçun zaten bildiği kavramlarla (kitapçık, dönem, gözlem, vardiya) kurulduğundan yarım günlük bir tanıtım oturumu yeterli görünmektedir.

## 6. Etik ve Mevzuat Çerçevesi

Platform üç ilkeyi mimari düzeyde garanti eder.

Puanlama ve sıralama yoktur. Hiçbir ekranda kişiye atanmış bir skor veya kişiler arası sıralama bulunmaz; kanıt önerinin üzerinde taşınır.

Amaç sınırı nettir. Sistem geliştirme amaçlıdır; işten çıkarma, disiplin veya eleme süreçlerine girdi üretmez. Bu sınır yalnızca politika değil, veri modelinin kendisidir: eleme kararını besleyecek bir karşılaştırma metriği üretilmez.

Şeffaflık çift yönlüdür. Çalışan kendi profilini görebilir; koçun verdiği her onay ve her gerekçeli red denetim izine işlenir. Kişisel veri işleme, mağazanın halihazırda ürettiği operasyonel verilerle sınırlıdır ve KVKK kapsamındaki bilgilendirme yükümlülükleri pilot başlangıcında tamamlanacaktır.

## 7. Beklenen Faydalar

Aşağıdaki hedefler pilot için belirlenmiş temsilî değerlerdir; sahadan veri geldikçe geriye dönük testle doğrulanacaktır.

| Alan | Hedef |
| --- | --- |
| Öneri isabeti | Dört dönemde yüzde 62'den 86'ya |
| Yeni başlayan ramp süresi | İki hafta kısalma |
| Koçun plan ve rapor hazırlık yükü | Belirgin azalma; taslaklar hazır gelir |
| Usta bilgisinin korunumu | Ayrılma durumunda yöntem bilgisi kurumda kalır |

Bu hedeflerin en savunulabilir olanı öneri isabetidir; çünkü dış bir nedensellik iddiası değil, sistemin kendi iç tutarlılığının ölçümüdür. Ciroya etki gibi mutlak iddialardan pilot aşamasında bilinçli olarak kaçınılmakta, bunun yerine kapanan döngü sayısı ve ramp süresi gibi süreç metrikleri esas alınmaktadır.

## 8. Riskler ve Önlemler

| Risk | Önlem |
| --- | --- |
| Soğuk başlangıçta önerilerin genel kalması ve güven kaybı | Sınır ekranda açıkça belirtilir; ilk haftalarda keşif ve eşleşme önerileri öne alınır |
| Koçun sistemi ek yük olarak algılaması | Sıfır ek yük ilkesi; tüm akışlar tek dokunuşa indirgenmiştir, pilot süresince kullanım gözlemlenir |
| Küçük örneklemde yanıltıcı sinyal | Güven seviyeleri yumuşak bantlarla gösterilir; düşük kanıtta sistem genel öneriye döner |
| Kişi değerlendirmesi algısı | Skorsuz mimari, çalışanın kendi profilini görmesi ve amaç sınırının yazılı taahhüdü |
| Tek mağazaya bağımlı öğrenme | İkinci fazda mağazalar arası örüntü paylaşımı planlanmıştır |

## 9. Uygulama Takvimi

Birinci faz, mevcut sürümün Bornova mağazasında sınırlı kadroyla devreye alınmasını kapsar: kitapçık dijitalleşir, günün kuyruğu ve gözlem akışı kullanıma açılır. İkinci fazda kasa ve sayaç verileri kanallara bağlanır, öneri isabeti geriye dönük testle ölçülmeye başlar. Üçüncü faz, dönem raporlarının yönetim özetine bağlanması ve ikinci bir mağazada doğrulama pilotudur.

Her faz kendi ölçüm kriteriyle kapanır; bir sonraki faza geçiş, önceki fazın kullanım ve isabet verisine bağlıdır.

## 10. Sonuç

Pusula, yeni veri toplamadan mevcut operasyonel veriyi anlamlandıran, koça yük bindirmeden ondan öğrenen ve insan değerlendirmesinin etik sınırlarını mimaride güvence altına alan bir platformdur. Teknik altyapı hazırdır, operasyonel uyum maliyeti düşüktür ve ölçüm planı dürüst bir çerçeveye oturtulmuştur.

Değerlendirmemiz, pilotun başlatılması yönündedir. Sahadan gelecek ilk dönem verisi, hem hedeflerin doğrulanması hem de mağaza ağına yayılım kararının sağlıklı biçimde verilmesi için yeterli zemini sağlayacaktır.
