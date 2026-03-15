import { Input } from './Input.js';
import { Camera } from './Camera.js';
import { Player } from '../entities/Player.js';
import { Level } from '../world/Level.js';
import { Background } from '../world/Background.js';
import { MusicPlayer } from './MusicPlayer.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        // Oyun Durumu Yönetimi (START_MENU, PLAYING, GAME_OVER)
        this.state = 'START_MENU';
        
        // Girdi sınıfını başlat
        this.input = new Input();
        
        // İlk arka planı oluştur (Menü için)
        this.background = new Background(this.height);
        
        // Türk Sanat Müziği fon müziği
        this.music = new MusicPlayer();
        
        // Sahne nesneleri Play state'de dolacak
        this.entities = [];
    }

    startPlaying() {
        this.camera = new Camera(this.width, this.height);
        this.background = new Background(this.height);
        this.background.startTime = Date.now(); // Gökyüzü döngüsü oyun başlayınca start alsın
        this.level = new Level(this);
        this.entities = [];
        this.player = new Player(50, 50); 
        this.entities.push(this.player);
        this.hurmaCount = 0; 
        document.getElementById('coins').innerText = `x00`;
        this.state = 'PLAYING';
        
        // Düşman döngüsel spawn sistemi
        this.enemySpawnTimer = 0;
        this.enemySpawnInterval = 3000; // Her 3 saniyede bir yeni düşman
        
        // Fon müziğini başlat
        this.music.start();
    }

    update(deltaTime) {
        // Duruma Göre Girdi Yönetimi
        if (this.state === 'START_MENU' || this.state === 'GAME_OVER' || this.state === 'GAME_WON') {
            if (this.input.isDown('Enter')) {
                this.startPlaying();
                // Basılı tutmayı önlemek için anlık sıfırlama (basit debounce)
                this.input.keys['Enter'] = false;
            }
            return; // Menüdeyken fizikleri işletme
        }

        if (this.state === 'PLAYING') {
            // Kamerayı oyuncuya göre güncelle
            this.camera.update(this.player, this.level.width);
            
            // Tüm varlıkların update metodunu çağır
            this.entities.forEach(entity => entity.update(deltaTime, this));

            // Düşman Döngüsel Spawn (Oyun bitene kadar sürekli gelsinler)
            this.enemySpawnTimer += deltaTime;
            if (this.enemySpawnTimer >= this.enemySpawnInterval) {
                this.enemySpawnTimer = 0;
                
                // Oyuncunun sağına, ekran dışına spawn et
                const groundY = this.level.groundY || (this.height - this.level.tileSize * 2);
                const spawnX = this.player.x + this.width + Math.random() * 200;
                const spawnY = groundY - 64; // Zemin üstü
                
                import('../entities/Enemy.js').then(({ Enemy }) => {
                    const enemy = new Enemy(spawnX, spawnY);
                    this.spawnItem(enemy);
                });
            }

            // Nesne Toplama (Hurma) ve Düşman Çarpışma Mantığı
            this.entities.forEach(entity => {
                if (entity !== this.player) {
                    import('../engine/Physics.js').then(({ Physics }) => {
                        if (Physics.AABB(this.player, entity)) {
                            // 1. Durum: HURMA
                            if (entity.constructor.name === 'Hurma' && !entity.isCollected && !entity.isFlying) {
                                // Uçma animasyonu başlat (anında silme, kayarak HUD'a gitsin)
                                entity.startFlyToHUD(this.camera.x);
                            }
                            // 2. Durum: DÜŞMAN
                            else if (entity.constructor.name === 'Enemy' && !entity.isDead) {
                                if (this.player.vy > 0 && this.player.y + this.player.height < entity.y + 32) {
                                    entity.die(); 
                                    this.player.vy = -350;
                                } else {
                                    this.state = 'GAME_OVER';
                                }
                            }
                            // 3. Durum: KAPI (Kazanma)
                            else if (entity.constructor.name === 'Door') {
                                this.state = 'GAME_WON';
                            }
                        }
                    });
                }
            });

            // Toplananları ve ölenleri sil (Hurma animasyon bitince sayacı güncelle)
            this.entities = this.entities.filter(entity => {
                if (entity.constructor.name === 'Hurma' && entity.isConsumed) {
                    // Animasyon bitti, şimdi sayacı artır
                    this.hurmaCount = (this.hurmaCount || 0) + 1;
                    document.getElementById('coins').innerText = `x${this.hurmaCount.toString().padStart(2, '0')}`;
                    return false;
                }
                if (entity.constructor.name === 'Enemy' && entity.deathTimer < 0) return false;
                return true;
            });

            // Oyuncu boşluğa düşerse
            if (this.player.y > this.height + 100) {
                this.state = 'GAME_OVER';
            }
        }
    }

    spawnItem(item) {
        this.entities.push(item);
    }

    draw() {
        // 1. Evrensel Arka plan çizimi (Menüde de görünmesi için)
        this.ctx.fillStyle = '#2c549c'; 
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Eğer menüysek kamera X'ini 0 farz edip background çiz
        if (this.state === 'START_MENU') {
            this.background.draw(this.ctx, {x: 0});
            this.drawStartMenu();
        } 
        else if (this.state === 'PLAYING' || this.state === 'GAME_OVER' || this.state === 'GAME_WON') {
            this.background.draw(this.ctx, this.camera);
            this.level.draw(this.ctx, this.camera);
            this.entities.forEach(entity => entity.draw(this.ctx, this.camera.x));
            
            if (this.state === 'GAME_OVER') {
                this.drawGameOverScreen();
            } else if (this.state === 'GAME_WON') {
                this.drawWinScreen();
            }
        }
    }

    drawWinScreen() {
        // Ekranı hafif karart
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // KAZANDINIZ YAZISI
        this.ctx.fillStyle = '#FFD700'; // Altın sarısı
        this.ctx.font = '50px "Press Start 2P", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowColor = '#000';
        this.ctx.shadowBlur = 15;
        this.ctx.fillText('KAZANDINIZ!', this.width / 2, this.height / 2 - 40);

        // TEKRAR OYNA İPUCU
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '20px "Press Start 2P", monospace';
        this.ctx.shadowBlur = 5;
        
        // Yanıp sönen efekt
        if (Date.now() % 1000 < 500) {
            this.ctx.fillText("Tekrar oynamak icin 'Enter'a bas", this.width / 2, this.height / 2 + 50);
        }
        
        this.ctx.shadowBlur = 0;
    }

    drawStartMenu() {
        const ctx = this.ctx;
        
        // ZAMAN BAZLI TEMANIN GÖRÜNMESİ İÇİN MENÜYE ÖZEL KARANLIK FON (OVERLAY) YERİNE BOŞ GEÇİLİYOR
        // (Eskiden burada menü için statik siyahlık vardı, artık oyunla 'Tamamen Aynı Tema'ya sahip)

        // Ramazan Pidesi Sırası Teması Çizimi (Ortanın altında)
        this.drawPideTheme(ctx);

        // Başlık
        ctx.fillStyle = '#FFD700'; // Altın Sarısı
        ctx.font = '40px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 10;
        ctx.fillText("NASREDDİN HOCA", this.width / 2, this.height / 3);
        
        ctx.font = '20px "Press Start 2P", monospace';
        ctx.fillStyle = '#FFF';
        ctx.fillText("PIDENIN PESINDE", this.width / 2, this.height / 3 + 40);

        // Talimatlar / Buton
        ctx.font = '16px "Press Start 2P", monospace';
        
        // Yanıp Sönen (Blinking) Yazı efekti
        if (Math.floor(Date.now() / 500) % 2 === 0) {
            ctx.fillStyle = '#20B2AA'; // Turkuaz
            ctx.fillText(">>> BASLAMAK ICIN [ENTER] TUSUNA BAS <<<", this.width / 2, this.height / 2 + 30);
        }

        ctx.fillStyle = '#DDD';
        ctx.font = '12px "Press Start 2P"';
        ctx.fillText("YON TUSLARI: Hareket  |  YUKARI: Zipla  |  ASAGI: Egil", this.width / 2, this.height / 2 + 100);
        
        ctx.shadowBlur = 0; // Kapat
    }

    drawPideTheme(ctx) {
        // Bu sahne için ölçeklendirme veya kamera sabit
        const baseY = this.height - 64; // Zemin (Background.js ile aynı hiza)

        ctx.save();
        
        // --- FIRIN ---
        // Fırın Gövdesi (Taş/Kerpiç yapılı)
        ctx.fillStyle = '#D2B48C'; // Tan (Açık Kerpiç)
        ctx.fillRect(80, baseY - 200, 180, 200);
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 4;
        ctx.strokeRect(80, baseY - 200, 180, 200);
        
        // Fırın Çatısı (Üçgen, Koyu kiremit)
        ctx.fillStyle = '#A0522D';
        ctx.beginPath();
        ctx.moveTo(70, baseY - 200);
        ctx.lineTo(170, baseY - 280);
        ctx.lineTo(270, baseY - 200);
        ctx.fill();

        // Tabela ("TAŞ FIRIN - SICAK PİDE")
        ctx.fillStyle = '#654321';
        ctx.fillRect(100, baseY - 180, 140, 30);
        ctx.fillStyle = '#FFD700';
        ctx.font = '12px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText("TAS FIRIN", 170, baseY - 160);

        // Fırın Ateşi (Hareketli Işık)
        const time = Date.now();
        const fireFlicker = Math.sin(time / 100) * 10;
        ctx.fillStyle = '#111'; // Fırın İçi
        ctx.beginPath();
        ctx.arc(170, baseY - 20, 45, Math.PI, 0);
        ctx.fill();
        
        ctx.fillStyle = '#FF4500'; // OrangeRed (Ateş Göbeği)
        ctx.beginPath();
        ctx.arc(170, baseY - 20, 35 + fireFlicker * 0.5, Math.PI, 0);
        ctx.fill();

        ctx.fillStyle = '#FFD700'; // Sarı Ateş (İç Işık)
        ctx.beginPath();
        ctx.arc(170, baseY - 20, 20 - fireFlicker * 0.3, Math.PI, 0);
        ctx.fill();
        
        // Baca ve Duman
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(140, baseY - 320, 30, 80); // Baca
        
        // Duman dairesel animasyonları
        ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
        const smokeY1 = (time / 20) % 50;
        const smokeY2 = ((time + 500) / 20) % 50;
        ctx.beginPath();
        ctx.arc(155 + Math.sin(time / 300) * 10, baseY - 320 - smokeY1 * 2, 15 + smokeY1 * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(155 + Math.cos(time / 250) * 10, baseY - 320 - smokeY2 * 2, 10 + smokeY2 * 0.3, 0, Math.PI * 2);
        ctx.fill();


        // --- İNSAN SIRASI ---
        for (let i = 0; i < 3; i++) {
            const personX = 260 + (i * 70); 
            // Silüet İnsan Çizimleri
            ctx.fillStyle = ['#4682B4', '#556B2F', '#A0522D'][i]; // Farklı renk kazaklar
            ctx.fillRect(personX, baseY - 50, 30, 35); // Gövde
            ctx.fillStyle = '#8B4513'; 
            ctx.fillRect(personX + 4, baseY - 15, 8, 15); // Sol Bacak
            ctx.fillRect(personX + 18, baseY - 15, 8, 15); // Sağ Bacak
            // Kafa (Animasyonlu bekleme kafa sallama)
            const headNod = Math.sin(time / 300 + i) * 2;
            ctx.fillStyle = '#FFCC99';
            ctx.fillRect(personX + 5, baseY - 70 + headNod, 20, 20); 
        }

        // --- NASREDDİN HOCA (Sırada Bekliyor) ---
        const hocaX = 480;
        ctx.save();
        ctx.translate(hocaX, baseY - 96); // Zemin - Hoca yüksekliği
        ctx.scale(1.5, 1.5); // Hoca'yı menüde biraz büyütelim
        
        const hocaBreath = Math.sin(time / 200) * 1; // Nefes alma animasyonu
        ctx.translate(0, hocaBreath);

        // Hoca Gövde Çizimi (Player.js'tekine benzer ama yönsüz basit)
        ctx.fillStyle = '#20B2AA'; // Yeşil cübbe
        ctx.fillRect(-10, 20, 20, 20); // Gövde
        ctx.fillStyle = '#FFD700'; // Pantolon
        ctx.fillRect(-6, 40, 5, 8);
        ctx.fillRect(1, 40, 5, 8);
        ctx.fillStyle = '#CC0000'; // Çarık
        ctx.fillRect(-8, 48, 7, 4);
        ctx.fillRect(1, 48, 7, 4);
        ctx.fillStyle = '#FFCC99'; // Kafa
        ctx.fillRect(-6, 8, 12, 12);
        ctx.fillStyle = '#FFFFFF'; // Sakal
        ctx.fillRect(-8, 16, 16, 6);
        ctx.fillStyle = '#4682B4'; // Kavuk altı
        ctx.fillRect(-5, 0, 10, 8);
        ctx.fillStyle = '#FFFFFF'; // Sarık
        ctx.fillRect(-8, 2, 16, 6);
        ctx.restore();

        // --- BOZ EŞEK (Hocanın arkasında otluyor) ---
        const esekX = hocaX + 80;
        const esekY = baseY - 60;
        ctx.save();
        ctx.translate(esekX, esekY);
        ctx.scale(-1.2, 1.2); // Sola baksın (Hocaya doğru)

        // Eşek Gövde
        ctx.fillStyle = '#808080'; // Gri Gövde
        ctx.fillRect(0, 0, 40, 25);
        // Eşek Bacakları
        ctx.fillStyle = '#696969';
        ctx.fillRect(4, 25, 4, 15);
        ctx.fillRect(12, 25, 4, 15);
        ctx.fillRect(24, 25, 4, 15);
        ctx.fillRect(32, 25, 4, 15);
        
        // Eşek Kafası (Eğilmiş otluyor)
        const headDip = Math.sin(time / 400) * 5; 
        ctx.fillRect(-15, 10 + headDip, 20, 15); // Kafa kısmı daha aşağıda
        // Eşek Kulakları
        ctx.fillRect(-10, 0 + headDip, 4, 15); 
        ctx.fillRect(-4, 2 + headDip, 4, 15); 
        
        // Eşek Kuyruğu
        ctx.strokeStyle = '#404040';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const tailWag = Math.sin(time / 150) * 5;
        ctx.moveTo(40, 5);
        ctx.quadraticCurveTo(45 + tailWag, 15, 42, 25);
        ctx.stroke();

        ctx.restore();

        ctx.restore(); // Tüm pidetheme çizimlerini eski haline döndür
    }

    drawGameOverScreen() {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(139, 0, 0, 0.7)'; // Koyu kızıl ölüm ekranı
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.fillStyle = '#FFF';
        ctx.font = '40px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText("OYUN BITTI", this.width / 2, this.height / 2 - 20);

        ctx.font = '16px "Press Start 2P"';
        ctx.fillStyle = '#FFD700';
        ctx.fillText("YENIDEN BASLAMAK ICIN [ENTER]", this.width / 2, this.height / 2 + 40);
    }
}
