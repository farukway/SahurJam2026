import { Entity } from './Entity.js';

/**
 * Ramazan Topu Mermisi - Zıplayan canavarların fırlattığı mermi.
 * type: 'hurma' (toplanabilir) veya 'barut' (öldürücü)
 */
export class Projectile extends Entity {
    constructor(x, y, vx, vy, type) {
        super(x, y, 24, 24); // 24x24 mermi boyutu
        this.vx = vx;
        this.vy = vy;
        this.type = type; // 'hurma' veya 'barut'
        this.gravity = 400;
        this.isActive = true;
        this.spawnTime = Date.now();
        this.lifetime = 4000; // 4 saniye sonra kaybolur
    }

    update(deltaTime, game) {
        if (!this.isActive) return;
        
        const dt = deltaTime / 1000;
        this.vy += this.gravity * dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        // Süre dolduğunda veya ekranın çok altına düştüyse yok et
        if (Date.now() - this.spawnTime > this.lifetime || this.y > game.height + 200) {
            this.isActive = false;
        }
    }

    draw(ctx, cameraX = 0) {
        if (!this.isActive) return;
        
        const renderX = this.x - cameraX;
        const renderY = this.y;
        const time = Date.now();
        
        ctx.save();
        ctx.translate(renderX + this.width / 2, renderY + this.height / 2);
        
        // Dönen animasyon
        ctx.rotate((time / 150) % (Math.PI * 2));
        
        if (this.type === 'hurma') {
            // --- HURMA (Toplanabilir) ---
            // Kahverengi oval hurma
            ctx.fillStyle = '#8B4513';
            ctx.beginPath();
            ctx.ellipse(0, 0, 10, 7, 0, 0, Math.PI * 2);
            ctx.fill();
            // Yeşil sap
            ctx.fillStyle = '#228B22';
            ctx.fillRect(-2, -10, 4, 4);
            // Parlama
            ctx.fillStyle = '#A0522D';
            ctx.beginPath();
            ctx.ellipse(-3, -2, 3, 2, Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // --- BARUT (Öldürücü Ramazan Topu) ---
            // Siyah küre
            ctx.fillStyle = '#1a1a1a';
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.fill();
            // Kırmızı fitil kıvılcımı
            const sparkle = Math.sin(time / 80) * 3;
            ctx.fillStyle = '#FF4500';
            ctx.beginPath();
            ctx.arc(0, -10 + sparkle, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(1, -12 + sparkle, 2, 0, Math.PI * 2);
            ctx.fill();
            // Fitil çizgisi
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, -8);
            ctx.quadraticCurveTo(3, -10, 0, -10 + sparkle);
            ctx.stroke();
        }
        
        ctx.restore();
    }
}
