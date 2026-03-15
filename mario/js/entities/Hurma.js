import { Entity } from './Entity.js';
import { Physics } from '../engine/Physics.js';

export class Hurma extends Entity {
    constructor(x, y) {
        // Hurma boyutu 32x32 piksele çıkarıldı (16->32)
        super(x, y, 32, 32);
        
        // Hurma için fizik değerleri
        this.color = '#8B4513'; // Kahverengi Hurma Rengi
        this.maxSpeedX = 50;
        
        // Yerçekimi ivmesi (Aşağı doğru saniyede hızlanma)
        this.ay = 1600;
        this.terminalVelocity = 600;
        
        // Bloğun içinden çıkarken havaya doğru hafif fırlayacak
        this.vy = -420; 
        
        // Biraz da sağa doğru gitsin ki bloktan dışarı sekip yere düşüp alınabilsin.
        this.vx = 40; 

        // Toplanma durumu
        this.isCollected = false;
        
        // HUD'a kayma animasyonu
        this.isFlying = false;   // Toplama animasyonu aktif mi?
        this.isConsumed = false; // Animasyon bitti, artık silinebilir
        this.flyX = 0;           // Ekran koordinatlarında uçuş X
        this.flyY = 0;           // Ekran koordinatlarında uçuş Y
        this.flyTargetX = 140;   // HUD hurma simgesi konumu (yaklaşık)
        this.flyTargetY = 30;    
        this.flyScale = 1.0;     // Küçülme animasyonu
        this.flyProgress = 0;    // 0 -> 1 arası lerp
    }

    startFlyToHUD(cameraX) {
        this.isFlying = true;
        this.isCollected = true;
        this.flyX = this.x - cameraX;  // Dünya koordinatından ekran koordinatına çevir
        this.flyY = this.y;
        this.flyProgress = 0;
        this.flyScale = 1.0;
    }

    update(deltaTime, game) {
        if (this.isConsumed) return;
        
        if (this.isFlying) {
            // HUD'a doğru kayma animasyonu (lerp)
            const dt = deltaTime / 1000;
            this.flyProgress += dt * 2.5; // ~0.4 saniyede varır
            
            if (this.flyProgress >= 1) {
                this.flyProgress = 1;
                this.isConsumed = true; // Animasyon bitti
            }
            
            // Eased lerp (ease-in-out cubic)
            const t = this.flyProgress;
            const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
            
            // Pozisyon interpolasyonu (başlangıç noktasından hedefe)
            const startX = this.x - (game ? game.camera.x : 0);
            const startY = this.y;
            this.flyX = startX + (this.flyTargetX - startX) * ease;
            this.flyY = startY + (this.flyTargetY - startY) * ease;
            
            // Küçülme (1.0 -> 0.3)
            this.flyScale = 1.0 - (0.7 * ease);
            return;
        }
        
        if (this.isCollected) return;
        
        super.update(deltaTime, game);
        
        // Havaya fırladıktan sonra düşmeye başladığı an (vy > 0)
        // Oyuncu temasını beklemeden otomatik olarak HUD'a doğru uçmaya başla
        if (this.vy > 0 && !this.isCollected) {
            this.startFlyToHUD(game ? game.camera.x : 0);
        }
    }
    
    draw(ctx, cameraX = 0) {
        if (this.isConsumed) return;
        
        if (this.isFlying) {
            // HUD'a uçma animasyonu (Kameradan bağımsız ekran koordinatlarında çiz)
            ctx.save();
            ctx.translate(this.flyX, this.flyY);
            ctx.scale(this.flyScale * 2, this.flyScale * 2);
            
            // Parlayan altın efekti
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 10 + Math.sin(Date.now() / 100) * 5;
            
            // Hurma gövdesi
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.ellipse(8, 8, 6, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Yeşil sap
            ctx.fillStyle = '#228B22';
            ctx.fillRect(7, 0, 2, 2);
            
            ctx.shadowBlur = 0;
            ctx.restore();
            return;
        }
        
        if (this.isCollected) return;

        const renderX = this.x - cameraX;
        const renderY = this.y;

        ctx.save();
        ctx.translate(renderX, renderY);
        ctx.scale(2, 2); // 2 Katı çizim skalası

        // Hurma gövdesi (oval/yumurta şeklinde)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(8, 8, 6, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Üstünde minik bir yeşil sap
        ctx.fillStyle = '#228B22'; // ForestGreen
        ctx.fillRect(7, 0, 2, 2);

        // Parlama (Glow) hafif
        ctx.fillStyle = '#A0522D'; // Sienna parçası
        ctx.beginPath();
        ctx.ellipse(6, 6, 2, 3, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
