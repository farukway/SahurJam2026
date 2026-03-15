import { Physics } from '../engine/Physics.js';

export class Entity {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        // Hız (Velocity)
        this.vx = 0;
        this.vy = 0;

        // İvme (Acceleration)
        this.ax = 0;
        this.ay = 0;

        // Hız Limitleri (Maksimum hız vb.)
        this.maxSpeedX = 200; // Saniyede 200 pixel
        this.terminalVelocity = 400; // Maksimum düşme hızı

        // Durumlar (yerde mi, havada mı vb.)
        this.isGrounded = false;
        
        // Görünüm özelliği
        this.color = 'white';
    }

    // Pozisyonu, hıza ve ivmeye göre günceller
    update(deltaTime, game) {
        // Hızları ivme ile güncelle
        this.vx += this.ax * (deltaTime / 1000);
        this.vy += this.ay * (deltaTime / 1000);

        // Maksimum hızları sınırla
        if (this.vx > this.maxSpeedX) this.vx = this.maxSpeedX;
        if (this.vx < -this.maxSpeedX) this.vx = -this.maxSpeedX;
        if (this.vy > this.terminalVelocity) this.vy = this.terminalVelocity;

        // --- X EKSENİ (Yatay) HAREKET VE ÇARPIŞMA ---
        this.x += this.vx * (deltaTime / 1000);
        this.checkCollisionsX(game.level.blocks);

        // --- Y EKSENİ (Dikey) HAREKET VE ÇARPIŞMA ---
        this.y += this.vy * (deltaTime / 1000);
        this.checkCollisionsY(game.level.blocks, game);
    }
    
    // Yatay çarpışma algılama ve çözümleme
    checkCollisionsX(blocks) {
        blocks.forEach(block => {
            if (Physics.AABB(this, block)) {
                // Eğer varlık sağa doğru gidiyorsa (Sağ kenar bloğun soluna çarpar)
                if (this.vx > 0) {
                    this.vx = 0;
                    this.x = block.x - this.width;
                }
                // Eğer varlık sola doğru gidiyorsa (Sol kenar bloğun sağına çarpar)
                else if (this.vx < 0) {
                    this.vx = 0;
                    this.x = block.x + block.width;
                }
            }
        });
    }

    // Dikey çarpışma algılama ve çözümleme
    checkCollisionsY(blocks, game) {
        this.isGrounded = false; // Her döngüde varsayılan olarak havada kabul et

        blocks.forEach(block => {
            if (Physics.AABB(this, block)) {
                // Eğer varlık aşağı doğru düşüyorsa (Alt kenar bloğun üstüne çarpar)
                if (this.vy > 0) {
                    this.vy = 0;
                    this.y = block.y - this.height;
                    this.isGrounded = true; 
                }
                // Eğer varlık yukarı doğru zıplıyorsa (Üst kenar bloğun altına çarpar)
                else if (this.vy < 0) {
                    this.vy = 0;
                    this.y = block.y + block.height;
                    this.onHitBlockFromBelow(block, game);
                }
            }
        });
    }

    // Alttan vurma kancası (Miras alan sınıflar ezecek)
    onHitBlockFromBelow(block, game) {
        // Boş implementasyon
    }

    // Basit bir dikdörtgen olarak çizer
    draw(ctx, cameraX = 0) {
        ctx.fillStyle = this.color;
        // Kamera X değerini çıkartarak çizin
        ctx.fillRect(this.x - cameraX, this.y, this.width, this.height);
    }
}
