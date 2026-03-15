export class Background {
    constructor(gameHeight) {
        this.gameHeight = gameHeight;
        this.parallaxFactor = 0.3; // Kameradan daha yavaş hareket etmesi için
        
        // 25 saniyelik (25000 ms) zaman bazlı renk döngüsü
        this.startTime = Date.now();
        this.duration = 25000;
        
        // Gökyüzünde parlayan yıldızlar (Geniş alanda)
        this.stars = [];
        for(let i=0; i<300; i++) { // Sayı arttı (150 -> 300)
            this.stars.push({
                x: Math.random() * 3000,
                y: Math.random() * (this.gameHeight * 0.7),
                size: Math.random() * 2 + 1.5, // Boyutlar arttırıldı (daha kalın)
                alpha: Math.random() * 0.7 + 0.3 // Soluk olanlar da daha belirgin
            });
        }
        
        // Ramazan Topu (Mesafe bazlı havai fişek)
        this.cannonImg = new Image();
        this.cannonImg.src = 'cannon.png'; // Kullanıcının kaydettiği resmi kullanacak
        
        this.cannonBall = {
            active: false,
            worldX: 0, worldY: 0,
            targetY: 0,
            speed: 300,
            phase: 'idle', // 'rising', 'exploding', 'idle'
            timer: 0,
            cooldown: 0,
            particles: []
        };
    }

    draw(ctx, camera) {
        const cameraX = camera.x || 0;
        const canvasW = ctx.canvas.width;
        const canvasH = ctx.canvas.height;

        // Oyun başladığından beri geçen süre (milisaniye)
        const elapsed = Date.now() - this.startTime;
        
        // 25 saniyelik sürede Gündüz -> Gece, sonraki 25 saniyede Gece -> Gündüz (Sürekli Döngü)
        const cycle = (elapsed / this.duration) % 2; 
        let progress = cycle <= 1 ? cycle : 2 - cycle; 

        // 1. ZAMAN BAZLI GÖKYÜZÜ RENGİ (Gündüz Açık Mavi -> Gece Koyu Lacivert/Siyah)
        // Gündüz: (135, 206, 235) - Light Sky Blue
        // Gece  : (10, 20, 40)    - Dark Navy
        const r = Math.round(135 * (1 - progress) + 10 * progress);
        const g = Math.round(206 * (1 - progress) + 20 * progress);
        const b = Math.round(235 * (1 - progress) + 40 * progress);
        
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(0, 0, canvasW, canvasH);

        // 2. YILDIZLAR (Tam karanlıktan yaklaşık 5 saniye önce belirmeye başlar)
        // 25sn / 2 = 12.5sn yarı periyot. 5 saniye = yaklaşık 0.4 progress'e denk düşer. (0.6 ile 1.0 arası görünür)
        const starAlphaMult = Math.min(1, Math.max(0, (progress - 0.5) * 2)); // 0.5 ile 1.0 arasında (karanlığa 5 sn kala) artar
        if (starAlphaMult > 0) {
            ctx.save();
            const starParallax = -(cameraX * 0.15);
            
            // Yıldızlara parlama (glow) efekti
            ctx.shadowColor = '#FFFFFF';
            ctx.shadowBlur = 5;

            this.stars.forEach(s => {
                // Yıldızı ekrana göre konumlandır (wrapping)
                let sx = ((s.x + starParallax) % canvasW + canvasW) % canvasW;
                
                // Yıldızların sürekli hafifçe parlayıp sönmesi için (titreme efekti)
                s.alpha += (Math.random() - 0.5) * 0.1;
                if (s.alpha > 1) s.alpha = 1;
                if (s.alpha < 0.3) s.alpha = 0.3; // Minimum parlaklık daha yüksek
                
                ctx.fillStyle = `rgba(255, 255, 230, ${s.alpha * starAlphaMult})`; // Tam beyaz değil çok hafif sıcak beyaz (#ffffe6)
                ctx.beginPath();
                ctx.arc(sx + s.size/2, s.y + s.size/2, s.size, 0, Math.PI * 2); // Yıldızları daha dairesel çiz
                ctx.fill();
            });
            ctx.shadowBlur = 0;
            ctx.restore();
        }

        // 3. CAMİLER, MİNARELER VE MAHYALAR (Tek sürekli katman, parallax etkisiyle)
        const bgOffsetX = -(cameraX * this.parallaxFactor);
        
        // Silüet rengi geceleyin siyaha yaklaşır
        let silhoutteColor;
        if (progress > 0.8) silhoutteColor = '#0A121F';
        else if (progress > 0.5) silhoutteColor = '#12233A';
        else silhoutteColor = '#1A2F4C';
        
        const baseY = this.gameHeight - 64; // Zemin hizası
        const texts = ["HOŞ GELDİN YA ŞEHR-İ RAMAZAN", "ŞÜKÜR", "BEREKET", "SABIR"];
        
        // Mahya stili (Gece/Gündüz)
        const isNight = progress > 0.7;

        // RAMAZAN TOPU çizimi (Her zaman kontrol et, ekrandaysa çizer, hizaya gelince ateşler)
        this.updateAndDrawCannon(ctx, canvasW, canvasH, cameraX);

        // Cami gruplarını ekranın tüm genişliği boyunca kesintisiz yerleştir
        const groupWidth = 2400; // Her cami grubunun genişliği (Camiler arası mesafe artırıldı)
        
        // Kaç grup gösterilmeli (ekranı doldurmak için)
        const visibleStart = Math.floor((cameraX * this.parallaxFactor) / groupWidth) - 1;
        const visibleEnd = visibleStart + Math.ceil(canvasW / groupWidth) + 2;
        
        for (let i = visibleStart; i <= visibleEnd; i++) {
            const groupX = (i * groupWidth) + bgOffsetX;
            
            // Ekran dışındaysa atla (Optimizasyon)
            if (groupX + groupWidth < -200 || groupX > canvasW + 200) continue;
            
            ctx.save();
            ctx.translate(groupX, 0);

            // Büyük Cami (Sol tarafta)
            drawMosque(ctx, 200, baseY, 1.3, silhoutteColor);
            
            // Küçük Cami (Sağ tarafta)
            drawMosque(ctx, 800, baseY, 1.0, silhoutteColor);

            // Mahya Yazıları
            ctx.font = '14px "Press Start 2P"';
            ctx.textAlign = 'center';
            if (isNight) {
                ctx.shadowColor = '#FFD700';
                ctx.shadowBlur = 15;
                ctx.fillStyle = '#FFFACD';
            } else {
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
            }

            drawMahya(ctx, 200, baseY, 1.3, texts[(((i % texts.length) + texts.length) % texts.length)]);
            drawMahya(ctx, 800, baseY, 1.0, texts[((((i * 2 + 1) % texts.length) + texts.length) % texts.length)]);

            ctx.shadowBlur = 0;
            ctx.restore();
        }
    }

    updateAndDrawCannon(ctx, canvasW, canvasH, cameraX) {
        const cb = this.cannonBall;
        const now = Date.now();
        
        // Topun dünyadaki sabit konumu (1600 piksel, ilk cami grubundaki büyük boşlukta)
        const cannonWorldX = 1600; 
        const cannonY = canvasH - 64 - 160; // Zemin üstü, topun yüksekliği 100 ama daha görünür olması için yukarı çekildi
        const cannonW = 140;
        const cannonH = 100;
        
        // Ekrana yansıyan X konumu
        const screenX = cannonWorldX - cameraX;
        
        // Sadece ekrandaysa veya ekrana yakınsa topu çiz
        if (screenX > -400 && screenX < canvasW + 400) {
            // Görsel çizimi
            if (this.cannonImg.complete && this.cannonImg.naturalWidth > 0) {
                // Görsel yüklendiyse çiz
                ctx.drawImage(this.cannonImg, screenX, cannonY, cannonW, cannonH);
            } else {
                // Yüklenemediyse Fallback (Geçici) Çizim
                ctx.fillStyle = '#654321';
                ctx.fillRect(screenX + 20, cannonY + 40, 100, 60);
                ctx.fillStyle = '#333';
                ctx.beginPath();
                ctx.arc(screenX + 70, cannonY + 100, 30, 0, Math.PI*2);
                ctx.fill();
            }
        }
        
        // Oyuncu top ile aynı hizaya (veya biraz geçince) geldi mi? (Ekranın ortası topa yaklaşınca)
        const playerReachedCannon = (cameraX + canvasW / 2) >= cannonWorldX;

        // Fırlatma döngüsü
        if (cb.phase === 'idle') {
            if (playerReachedCannon) {
                if (cb.cooldown <= 0) {
                    // Yeni top fırlat (Göğsünden çıkıyormuş gibi koordinat)
                    cb.phase = 'rising';
                    cb.worldX = cannonWorldX + cannonW - 20; // Topun namlusunun ucuna doğru
                    cb.worldY = cannonY + 20; 
                    cb.targetY = 80 + Math.random() * (canvasH * 0.3); // Gökyüzünün üst kısmına
                    cb.timer = now;
                    cb.particles = [];
                } else {
                    cb.cooldown -= 16; // ~frame süresi
                }
            } else {
                // Henüz hizasına gelmediyse beklemede kalsın (cooldown sıfırlansın)
                cb.cooldown = 0;
            }
        }
        
        const drawX = cb.worldX - cameraX;
        
        if (cb.phase === 'rising') {
            // Top yukarı yükseliyor
            const elapsed = (now - cb.timer) / 1000;
            const startY = cannonY + 20;
            cb.worldY = startY - (startY - cb.targetY) * Math.min(1, elapsed * 0.8);
            
            // Top çizimi (Siyah küre + kıvılcımlı fitil)
            ctx.save();
            ctx.fillStyle = '#222';
            ctx.beginPath();
            ctx.arc(drawX, cb.worldY, 6, 0, Math.PI * 2);
            ctx.fill();
            
            // Fitil kıvılcımı (arkasında iz)
            for (let i = 0; i < 3; i++) {
                const sparkX = drawX + (Math.random() - 0.5) * 8;
                const sparkY = cb.worldY + 6 + Math.random() * 15;
                ctx.fillStyle = ['#FF4500', '#FFD700', '#FF6347'][i];
                ctx.beginPath();
                ctx.arc(sparkX, sparkY, 1 + Math.random() * 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
            
            // Hedefe ulaştı mı?
            if (cb.worldY <= cb.targetY + 5) {
                cb.phase = 'exploding';
                cb.timer = now;
                // Patlama parçacıkları oluştur
                const colors = ['#FF0000', '#FFD700', '#00FF00', '#00BFFF', '#FF69B4', '#FFA500', '#FFFFFF', '#FF4500'];
                cb.particles = [];
                for (let i = 0; i < 40; i++) {
                    const angle = (Math.PI * 2 / 40) * i + (Math.random() - 0.5) * 0.3;
                    const speed = 60 + Math.random() * 120;
                    cb.particles.push({
                        x: cb.worldX,
                        y: cb.worldY,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        color: colors[Math.floor(Math.random() * colors.length)],
                        life: 1.0,
                        size: 2 + Math.random() * 3
                    });
                }
            }
        }
        
        if (cb.phase === 'exploding') {
            const elapsed = (now - cb.timer) / 1000;
            
            ctx.save();
            // Patlama ışığı (flash)
            if (elapsed < 0.1) {
                ctx.fillStyle = `rgba(255, 255, 200, ${0.6 - elapsed * 6})`;
                ctx.beginPath();
                ctx.arc(drawX, cb.worldY, 80, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Parçacıkları çiz ve güncelle
            cb.particles.forEach(p => {
                p.x += p.vx * 0.016; // ~1 frame
                p.y += p.vy * 0.016;
                p.vy += 30 * 0.016; // Hafif yerçekimi
                p.life -= 0.012;
                
                const pDrawX = p.x - cameraX;
                
                if (p.life > 0 && pDrawX > -100 && pDrawX < canvasW + 100) {
                    ctx.globalAlpha = p.life;
                    ctx.fillStyle = p.color;
                    ctx.shadowColor = p.color;
                    ctx.shadowBlur = 8;
                    ctx.beginPath();
                    ctx.arc(pDrawX, p.y, p.size * p.life, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
            
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
            ctx.restore();
            
            // Patlama bitti mi?
            if (elapsed > 2.5) {
                cb.phase = 'idle';
                cb.cooldown = 2000 + Math.random() * 3000; // 2-5 saniye sonra tekrar
                cb.particles = [];
            }
        }
    }
}

// Yardımcı Çizim Fonksiyonları

function sceneCutout(ctx, x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
}

/**
 * Detaylı ve büyük Osmanlı Cami Silüeti Çizimi
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} baseX Caminin orta x noktası
 * @param {number} baseY Caminin yere değdiği y noktası
 * @param {number} scale Büyültme/Küçültme çarpanı
 * @param {string} color Silüet rengi
 */
function drawMosque(ctx, baseX, baseY, scale, color) {
    ctx.save();
    ctx.translate(baseX, baseY);
    ctx.scale(scale, scale);
    
    // Gölge engelleme (kendi kendine gölge yapmasın)
    ctx.shadowBlur = 0;
    
    // Ana Gövde (Ortalanmış)
    ctx.fillStyle = color;
    ctx.fillRect(-120, -180, 240, 180);
    
    // --- KUBBELER ---
    // Ana Kubbe
    ctx.beginPath();
    ctx.arc(0, -180, 80, Math.PI, 0);
    ctx.fill();
    
    // Ana Kubbe Alemi (Tepesi)
    ctx.fillRect(-2, -290, 4, 30);
    ctx.beginPath();
    ctx.arc(0, -295, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Üst Yan Kubbeler (Sol ve Sağ)
    ctx.beginPath();
    ctx.arc(-80, -180, 40, Math.PI, 0);
    ctx.arc(80, -180, 40, Math.PI, 0);
    ctx.fill();

    // Alt Yan Kubbeler (Daha da dışarıda olan çeyrek daireler)
    ctx.beginPath();
    ctx.arc(-120, -130, 40, Math.PI, -Math.PI / 2);
    ctx.arc(120, -130, 40, -Math.PI / 2, 0);
    ctx.fill();
    
    // --- MİNARELER ---
    // Sol Minare Gövdesi
    ctx.fillRect(-170, -350, 18, 350); 
    // Sol Şerefeler (Balkonlar)
    ctx.fillRect(-175, -150, 28, 12);
    ctx.fillRect(-175, -240, 28, 12); // Ortadaki şerefe (Mahya buraya bağlanır)
    ctx.fillRect(-175, -330, 28, 12);
    // Sol Külah
    ctx.beginPath();
    ctx.moveTo(-170, -350);
    ctx.lineTo(-152, -350);
    ctx.lineTo(-161, -420);
    ctx.fill();
    // Sol Alem
    ctx.fillRect(-162, -435, 2, 15);

    // Sağ Minare Gövdesi
    ctx.fillRect(152, -350, 18, 350);
    // Sağ Şerefeler
    ctx.fillRect(147, -150, 28, 12);
    ctx.fillRect(147, -240, 28, 12);
    ctx.fillRect(147, -330, 28, 12);
    // Sağ Külah
    ctx.beginPath();
    ctx.moveTo(152, -350);
    ctx.lineTo(170, -350);
    ctx.lineTo(161, -420);
    ctx.fill();
    // Sağ Alem
    ctx.fillRect(160, -435, 2, 15);

    // --- DETAYLAR VE PENCERELER ---
    // Pencereler caminin dışarıdan hava alması veya ışık geçirmesi için şeffaf bir boşluktur.
    // background ile aynı veya yarı şeffaf karanlık bir renk kullanırız (silüette boşluk).
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'; // Saydam kesikler
    
    // Ana Kapı (Devasa Kemerli Giriş)
    ctx.beginPath();
    ctx.arc(0, -60, 30, Math.PI, 0);
    ctx.fillRect(-30, -60, 60, 60);
    ctx.fill();

    // Minik Kemerli Pencereler
    const drawWin = (wx, wy) => {
        ctx.beginPath();
        ctx.arc(wx, wy, 10, Math.PI, 0);
        ctx.fillRect(wx - 10, wy, 20, 30);
        ctx.fill();
    };

    // Üst sırada pencereler
    drawWin(-40, -130);
    drawWin(0, -130);
    drawWin(40, -130);

    // Alt sırada pencereler (Kapının yanları)
    drawWin(-80, -60);
    drawWin(-40, -60);
    drawWin(40, -60);
    drawWin(80, -60);

    ctx.restore();
}

/**
 * İki minare arasına Mahya Işıkları (İp ve Yazı) Çizer
 */
function drawMahya(ctx, baseX, baseY, scale, text) {
    const minaretOffset = 161 * scale;
    const hookY = baseY - 240 * scale; // Minarelerin ortadaki şerefesi
    
    const startX = baseX - minaretOffset + 10;
    const endX = baseX + minaretOffset - 10;
    
    // Mahya İpi Çizimi
    ctx.save();
    ctx.shadowBlur = 0; // İpte ışama olmasın
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(startX, hookY);
    ctx.quadraticCurveTo(baseX, hookY + 80 * scale, endX, hookY);
    ctx.stroke();
    ctx.restore();
    
    // Yazı Çizimi (Yazı yukarıda ctx özelliklerini miras alır: renk ve shadow)
    // İpin kavisinin hemen altına yazalım
    ctx.fillText(text, baseX, hookY + 50 * scale);
}
