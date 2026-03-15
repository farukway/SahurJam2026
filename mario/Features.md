# Nasreddin Hoca Platformer - Özellikler (Features)

### 2. Özellikler (Oynanış ve Mekanikler)

## 🖼️ Ana Menü ve Oyun Akışı
- **Ramazan Pidesi Sırası:** Oyun anında başlamaz, sizi dumanı tüten bir "Taş Fırın" önünde karşılar. Nasreddin Hoca ve Boz Eşeği ile sıradaki vatandaşlar hareketli bir tema sunar.
- **Enter ile Başlama:** Oyunu başlatmak ve öldüğünüzde (Oyun Bitti) tekrar hayata dönmek için `[ENTER]` tuşuna basmanız yeterlidir.

## 🎮 Temel Mekanikler (Core Mechanics)
- **Sağa / Sola Hareket:** Hocanın yatay düzlemde ivmelenerek yürümesi ve koşması.
- **Zıplama:** Basılı tutma süresine göre değişen zıplama yüksekliği (dinamik zıplama).
- **Kayma / Durma:** Yön değiştirirken Hocanın çarıklarıyla kayarak yavaşlaması ve ters yöne hızlanması.

## 🕌 Dünya, Çevre ve Arayüz (World & Environment)
- **Zaman Bazlı Gökyüzü (25 Saniye):** Gökyüzünün aydınlanması Hoca'nın haritadaki hareketinden tamamen bağımsızdır. Oyun başladığı andan itibaren tüm gökyüzü parlak tam sarı renk ile başlar, 25 saniye sürecek yavaş ve eşit bir geçişle eş zamanlı olarak kararıp koyu mavi tam bir geceye döner.
- **Cami ve Minareler:** Arka planda tüm ekranı (panoramik olarak) dolduran ikili ve devasa Osmanlı Cami silüetleri yer alır ve bu yapılar oyun boyunca birbirini takip ederek uzanır. Gece olduğunda silüetlerin karartısı estetik bir şekilde artar.
- **Mahya:** İki minare arasına gerilmiş dini ve kültürel yazılar (mahyalar) asılıdır. Gündüz vakti sönük olan mahyalar, hava karardığında ışıl ışıl parlar.
- **Toplanabilir Ögeler:** Alttan vurulan özel bloklardan çıkan "Hurma" nesneleri. Hoca bu blokların üzerine zıplayarak bu hurmaları toplayıp puan (veya can) kazanır.
- **Kültürel Dokular:** Zemin ve tuğlalar, taş döşeli Anadolu yollarını, çini süslemeli duvarları ve otantik ahşap/taş ev dokularını yansıtacak şekilde şekillendirilir.
- **Fizik Uyumu:** Yükseltilen (2x) boyutlarda oyunun ağırlaşmaması adına Hoca'nın koşu ve yatay ivmelenmesi 2 kat (2x), düşmanların yatay devriye hızları ise 1.5 kat (1.5x) artırılarak akıcı ve heyecanlı bir atari deneyimi elde edilmiştir. Zıplama ve düşme ivmeleri buna göre özenle kalibre edilmiştir. Harita baştan sağa doğru tam **200 blok** uzunluğunda, aralıksız düz bir zemin olarak tasarlanmıştır. Hoca bu düzlükte özgürce koşabilir.
- **Gizemli Bloklar ve Tuğlalar:** Bloklar Hoca'nın kolayca erişebilmesi için gökyüzünde bir blok daha aşağıya kaydırılmış durumdadır. İçinden Hurma çıkaran altın sarısı özel çinili bloklar vurulduktan sonra boş ve soluk bir taşa (boş blok) dönüşür.
- **Tuğla Bloklar:** Zıplandığında seken veya kırılabilen yapı taşları.
- **Zıplama Gücü:** Hoca, hedeflerine ulaşmak için rahatça 4 blok yüksekliğe (128++ px) kadar zıplayabilecek çevikliğe sahiptir.

## 🧱 Çarpışma ve Etkileşim (Collision)
- **Çarpışma Algılama:** Zemin, duvar, tavan ve platformlarla doğru etkileşim.

## 👳‍♂️ Güçlendirmeler ve Karakter (Power-ups & Character)
- **Nasreddin Hoca (Ana Karakter):** Sarıklı, beyaz sakallı, omuzunda çıkını (heybesi) ve elinde değneği olan, kırmızı çarıklarıyla hareket eden bilge figür.

## 👺 Düşmanlar ve Tehlikeler (Enemies)
- **Yeşil Yaratıklar (Temel Düşman):** Sağa ve sola sürekli devriye gezen, sivri dişleri, tek gözü ve çirkin bir sırıtması olan sinirli yeşil yaratıklar. Çarptığında Hoca'ya zarar verip bölümü baştan başlatır.
- **Zıplayan Yaratıklar (Varyant):** Normal yaratıklarla aynı görünüme sahip ancak ara sıra yerden bir blok kadar zıplayarak ilerleyen, kaçması daha zor düşmanlar.
- **Savunma / Kaçınma:** Hoca üstünden zıplayarak düşmanı tepesinden ezebilir ve onu alt edip puan kazanabilir veya sadece üzerinden zıplayarak yoluna devam edebilir.
- **Akçe / Altın:** Toplanan sembol veya paraların sayısı.
- **Dünya (World)::** O an oynanılan bölüm.
- **Süre (Time):** Bölümü bitirmek için geriye sayan zamanlayıcı.

## 🔧 Teknik Altyapı
- **Görüntü Motoru:** HTML5 `<canvas>` nesnesi ve 2D Rendering Context (Saf JavaScript).
- **Tam Ekran (Full Screen) Desteği:** Oyun penceresi sabit bir boyutta kısıtlı kalmaz; tarayıcı penceresinin boyutlarına (genişlik/yükseklik) uyum sağlayacak şekilde dinamik olarak ölçeklenir ve tam ekranda (100vw, 100vh) kesintisiz bir deneyim sunar.
- **Gameloop (Oyun Döngüsü):** `requestAnimationFrame` kullanılarak akıcı çizim.
- **Dizinselleştirme:** Modüler kod yapısıyla sınıflara (`Player.js`, `Enemy.js`, `Level.js`, `Game.js`, vb.) bölünmüş yapı.
- **Fizik:** Özel olarak yazılmış yerçekimi (gravity), AABB (Axis-Aligned Bounding Box) kutu çarpışmaları sistemi.