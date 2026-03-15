import { Entity } from './Entity.js';
import { Hurma } from './Hurma.js';

export class Player extends Entity {
    constructor(x, y) {
        // Blok boyutu 64px olacak şekilde ölçeklendi:
        // 1 blok eninde (64px), 1.5 blok boyunda (96px)
        super(x, y, 64, 96); 
        this.color = 'red';  // Temel gövde rengi

        // Mario'ya / Hoca'ya özel fizik değerleri
        this.maxSpeedX = 400;      // Yatay maksimum hız 2 kat artırıldı (200->400)
        this.accelX = 1000;        // Tuşa basıldığındaki ivmelenme (500->1000)
        this.frictionX = 500;      // Duruken sürtünme ivmesi (250->500)
        // 4 blok yüksekliğine rahatça çıkabilmesi için zıplama gücü orantılı (zıplama mesafesini korumak için)
        this.jumpForce = -1100;    // Yerçekimi artınca yüksek zıplamak için artırıldı
        this.gravity = 1800;       // Yer çekimi 2x yapıldı (900 -> 1800)
        this.terminalVelocity = 800; // Maksimum düşme hızı 2 kat artırıldı (400 -> 800)
        
        // Zıplama mekaniği
        this.isJumping = false;
        
        // Eğilme mekaniği
        this.isCrouching = false;
        this.normalHeight = 96;
        this.crouchHeight = 48;
        
        // Animasyon yönü için
        this.facingRight = true;
    }

    update(deltaTime, game) {
        const dt = deltaTime / 1000;

        // --- GİRDİ (INPUT) İŞLEME ---
        // Sağ-Sol Hareket
        if (game.input.isDown('ArrowRight')) {
            this.vx += this.accelX * dt;
            this.facingRight = true;
        } else if (game.input.isDown('ArrowLeft')) {
            this.vx -= this.accelX * dt;
            this.facingRight = false;
        } else {
            // Hiçbir yöne basılmıyorsa sürtünme uygula (Yavaşla)
            if (this.vx > 0) {
                this.vx -= this.frictionX * dt;
                if (this.vx < 0) this.vx = 0;
            } else if (this.vx < 0) {
                this.vx += this.frictionX * dt;
                if (this.vx > 0) this.vx = 0;
            }
        }

        // Eğilme (Crouch) - Aşağı Ok Tuşu
        if (game.input.isDown('ArrowDown') && this.isGrounded) {
            if (!this.isCrouching) {
                this.isCrouching = true;
                this.y += (this.normalHeight - this.crouchHeight); // Alçal
                this.height = this.crouchHeight;
            }
        } else {
            if (this.isCrouching) {
                this.isCrouching = false;
                this.y -= (this.normalHeight - this.crouchHeight); // Geri yüksel
                this.height = this.normalHeight;
            }
        }

        // Zıplama - Yukarı Ok Tuşu
        if (game.input.isDown('ArrowUp') && this.isGrounded && !this.isJumping && !this.isCrouching) {
            this.vy = this.jumpForce;
            this.isGrounded = false;
            this.isJumping = true;
        }

        if (!game.input.isDown('ArrowUp')) {
            // Zıplama tuşu bırakıldığında tekrar zıplayabilmesini sağla
            if(this.vy < 0 && this.vy < this.jumpForce / 2) {
                this.vy = this.jumpForce / 2; // Kısa basıldıysa yukarı ivmeyi kes
            }
            if (this.isGrounded) this.isJumping = false;
        }


        // --- FİZİK VE DÜŞME (GRAVITY) ---
        this.vy += this.gravity * dt;

        // --- TEMEL GÜNCELLEMELER (Hareket, Çarpışma ve Sınırlandırmalar) ---
        super.update(deltaTime, game);

        // --- BASİT EKRAN SINIRLARI (SOL) ---
        if (this.x < 0) {
            this.x = 0;
            this.vx = 0;
        }
    }

    // Nasreddin Hoca modeli çizimi
    draw(ctx, cameraX = 0) {
        const renderX = this.x - cameraX;
        const renderY = this.y;

        ctx.save();
        
        ctx.translate(renderX, renderY);
        
        // Yönlendirme (Sağ/Sol) ve Boyutlandırma (2 Katı Büyüklük)
        if (!this.facingRight) {
            ctx.translate(this.width, 0); // Orijinal genişlik (64) kadar kaydır
            ctx.scale(-2, 2); // 2x Büyüt ve X ekseninde ters çevir
        } else {
            ctx.scale(2, 2); // Sadece 2x Büyüt
        }

        // --- ARKA PLANDAKİ HEYBE (Sopanın ucu) ---
        // Sopa çizgisi (Omzun arkasına doğru uzanan)
        ctx.fillStyle = '#654321'; // Koyu Ahşap rengi
        ctx.fillRect(-8, 16, 20, 4); // Sırta doğru sopa uzantısı
        ctx.fillRect(8, 20, 4, 12); // Sopa gövdesi ele doğru
        
        // Torba (Heybe)
        ctx.fillStyle = '#A0522D'; // Sienna torba rengi
        ctx.fillRect(-16, 12, 12, 14); // Torbanın kendisi
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-12, 12, 4, 4);  // Torba düğümü
        ctx.fillRect(-14, 26, 8, 2);  // Torba alt izi
        
        // Animasyon için Offset
        let walkOffset = 0;
        let walkOffsetArm = 0;
        if (Math.abs(this.vx) > 10 && this.isGrounded) {
             const time = Date.now() / 150; 
             walkOffset = Math.sin(time) * 4;
             walkOffsetArm = Math.cos(time) * 2;
        }

        // --- GÖVDE VE KIYAFET (Cübbe / Kaftan) ---
        // İçlik (Sarımsı Pantolon/Gömlek)
        ctx.fillStyle = '#FFD700'; 
        ctx.fillRect(10, 24, 12, 14); 

        // Kemer / Kuşak (Turuncu/Kırmızı)
        ctx.fillStyle = '#FF8C00'; 
        ctx.fillRect(8, 30, 16, 4);

        // Yeşil Çizgili Cübbe (Ana Gövde)
        ctx.fillStyle = '#20B2AA'; // Turkuaz/Yeşilimsi
        ctx.fillRect(4, 20, 24, 16); 
        ctx.fillStyle = '#008080'; // Koyu yeşil çizgiler
        ctx.fillRect(6, 20, 2, 16);
        ctx.fillRect(12, 20, 2, 10);
        ctx.fillRect(18, 20, 2, 10);
        ctx.fillRect(24, 20, 2, 16);

        // Cübbe Etekleri
        ctx.fillStyle = '#20B2AA'; 
        ctx.fillRect(4, 36, 10, 6);
        ctx.fillRect(18, 36, 10, 6);


        // --- BACAKLAR VE AYAKKABILAR (Çarık) ---
        ctx.fillStyle = '#FFD700'; // Bacaklar (İçlik devamı)
        ctx.fillRect(8 - walkOffset, 40, 6, 6); // Arka bacak
        ctx.fillRect(18 + walkOffset, 40, 6, 6); // Ön bacak

        // Ayakkabılar (Sivri uçlu kırmızı yemeniler/çarık)
        ctx.fillStyle = '#CC0000';
        // Arka Ayakkabı
        ctx.fillRect(6 - walkOffset, 46, 10, 4);
        ctx.fillRect(14 - walkOffset, 44, 2, 2); // Ucu havada
        // Ön Ayakkabı
        ctx.fillRect(16 + walkOffset, 46, 10, 4);
        ctx.fillRect(24 + walkOffset, 44, 2, 2);


        // --- KAFA VE YÜZ ---
        // Yüz (Deri Rengi)
        ctx.fillStyle = '#FFCC99';
        ctx.fillRect(10, 8, 14, 12); 
        // Burun (Biraz büyük)
        ctx.fillStyle = '#FFA07A';
        ctx.fillRect(22, 12, 6, 4);

        // Beyaz Sakal ve Bıyık
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(6, 18, 18, 8);  // Ana sakal yığını
        ctx.fillRect(10, 26, 10, 4); // Sarkık kısım
        ctx.fillRect(20, 16, 6, 2);  // Bıyık kısmı
        
        // Göz
        ctx.fillStyle = '#000000';
        ctx.fillRect(18, 10, 2, 2); 
        // Kaş (Beyaz/Gri)
        ctx.fillStyle = '#D3D3D3';
        ctx.fillRect(16, 8, 6, 2); 


        // --- BAŞLIK (Sarık/Kavuk) ---
        // Alt mavi takke kısmı
        ctx.fillStyle = '#4682B4';
        ctx.fillRect(12, -2, 10, 6);
        // Beyaz Sarık Dolanması
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(6, 2, 22, 10); 
        // Sarık kırışıklıkları (Gri)
        ctx.fillStyle = '#D3D3D3';
        ctx.fillRect(8, 4, 18, 2);
        ctx.fillRect(10, 8, 14, 2);


        // --- ÖN KOL VE ELLER ---
        // Ön Kol (Yeşil Cübbe Kolu)
        ctx.fillStyle = '#20B2AA';
        ctx.fillRect(12 + walkOffsetArm, 20, 8, 12);
        // Ön El (Sopayı tutan)
        ctx.fillStyle = '#FFCC99';
        ctx.fillRect(14 + walkOffsetArm, 32, 6, 6);
        
        ctx.restore();
    }

    // Bloklara alttan vurulduğunda çalışacak özel çarpışma metodu
    onHitBlockFromBelow(block, game) {
        // Eğer vurulan blok "Soru / Gizemli Blok" ise (type === 3)
        if (block.type === 3) {
            // Bloğun tipini 4 yap (Boş / Tükenmiş Blok)
            block.type = 4;
            
            // Yeni bir Hurma oluştur. Bloğun tam üst orta noktasına yerleştirelim.
            const hurmaX = block.x + block.width / 2 - 16; // Hurmanın genişliği 32 (16->32)
            const hurmaY = block.y - 32;
            
            const yeniHurma = new Hurma(hurmaX, hurmaY);
            game.spawnItem(yeniHurma);
        }
    }
}
