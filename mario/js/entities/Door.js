import { Entity } from './Entity.js';

export class Door extends Entity {
    constructor(x, y) {
        super(x, y, 64, 128); // Genişlik 64 (1 blok), Yükseklik 128 (2 blok)
        this.color = '#8b5a2b'; // Kahverengi ahşap dokusu
        
        // Kapı sabittir, yerçekiminden etkilenmez
        this.gravity = 0;
        this.isGrounded = true;
    }
    
    update(deltaTime, game) {
        // Kapı hareketsizdir, fizik güncellemesine ihtiyaç duymaz
    }
    
    draw(ctx, cameraX = 0) {
        const renderX = this.x - cameraX;
        const renderY = this.y;
        
        // Gövde (Ahşap)
        ctx.fillStyle = this.color;
        ctx.fillRect(renderX, renderY, this.width, this.height);
        
        // Çerçeve (Koyu ahşap)
        ctx.strokeStyle = '#5c3a21';
        ctx.lineWidth = 6;
        ctx.strokeRect(renderX, renderY, this.width, this.height);
        
        // Ortadaki süsleme çizgileri
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(renderX + this.width / 2, renderY + 5);
        ctx.lineTo(renderX + this.width / 2, renderY + this.height - 5);
        ctx.stroke();
        
        // Kapı Tokmağı (Altın Rengi)
        ctx.fillStyle = '#FFD700';
        ctx.shadowColor = '#DAA520';
        ctx.shadowBlur = 5;
        ctx.beginPath();
        // Sağ tarafa kapı tokmağı ekle
        ctx.arc(renderX + this.width - 15, renderY + this.height / 2, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
    }
}
