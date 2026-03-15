import { Entity } from './Entity.js';
import { Physics } from '../engine/Physics.js';

export class Enemy extends Entity {
    constructor(x, y) {
        super(x, y, 64, 64); // Hitbox boyutu 64x64 olarak güncellendi
        this.color = '#2E8B57'; // SeaGreen (Koyu yeşil çirkin yaratık)
        
        // Düşman fizikleri
        this.maxSpeedX = 75;  // Hız 1.5x artırıldı (50->75)
        this.vx = -75;        // İlk hareket hızı (sola doğru, -50->-75)
        this.gravity = 1600;
        this.terminalVelocity = 600;
        
        this.isDead = false;
        this.deathTimer = 0; 

        // Rastgele: Acaba bu düşman normal mi yoksa zıplayan türden mi? (%50 Şans)
        this.isBouncer = Math.random() > 0.5;
        this.jumpForce = -600; // Zıplama gücü orantılı artırıldı
    }

    update(deltaTime, game) {
        if (this.isDead) {
            this.deathTimer -= deltaTime;
            return;
        }

        const dt = deltaTime / 1000;
        this.vy += this.gravity * dt;
        if (this.vy > this.terminalVelocity) this.vy = this.terminalVelocity;

        this.x += this.vx * dt;
        this.checkEnemyCollisionsX(game.level.blocks);

        this.y += this.vy * dt;
        this.checkCollisionsY(game.level.blocks, game);

        // Zıplayan düşman mekaniği
        if (this.isBouncer && this.isGrounded) {
            this.vy = this.jumpForce;
            this.isGrounded = false;
        }

        if (this.y > game.height + 100) {
            this.isDead = true; 
            this.deathTimer = -1; 
        }
    }

    checkEnemyCollisionsX(blocks) {
        blocks.forEach(block => {
            if (Physics.AABB(this, block)) {
                if (this.vx > 0) { 
                    this.vx = -this.maxSpeedX;
                    this.x = block.x - this.width;
                } else if (this.vx < 0) { 
                    this.vx = this.maxSpeedX; 
                    this.x = block.x + block.width;
                }
            }
        });
    }

    die() {
        this.isDead = true;
        this.deathTimer = 500; 
        this.height = 20;     
        this.y += 44;         
    }

    draw(ctx, cameraX = 0) {
        const renderX = this.x - cameraX;
        const renderY = this.y;
        const time = Date.now();

        ctx.save();
        ctx.translate(renderX, renderY);
        ctx.scale(2, 2); // 2x büyütme

        const cx = this.width / 4; // Merkez X (32/2=16)
        const cy = this.height / 4; // Merkez Y (32/2=16)
        const radius = 14; // Gövde yarıçapı

        if (this.isDead) {
            // Ezilmiş: yassı oval yeşil sıvı
            ctx.fillStyle = '#006400';
            ctx.beginPath();
            ctx.ellipse(cx, cy + 10, radius + 4, 4, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            const bodyColor = this.isBouncer ? '#7CFC00' : this.color;
            
            // --- YUVARLAK GÖVDE ---
            ctx.fillStyle = bodyColor;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Gövde üstüne siğiller/lekeler
            ctx.fillStyle = '#556B2F';
            ctx.beginPath();
            ctx.arc(cx - 8, cy - 6, 2, 0, Math.PI * 2);
            ctx.arc(cx + 10, cy + 2, 1.5, 0, Math.PI * 2);
            ctx.fill();

            // --- HAVADA SÜZÜLEN ELLER (Kolsuz, Rayman tarzı) ---
            const handBob = Math.sin(time / 200) * 3;
            const handBob2 = Math.cos(time / 200) * 3;
            
            // Sol El
            ctx.fillStyle = bodyColor;
            ctx.beginPath();
            ctx.arc(cx - radius - 6, cy + 2 + handBob, 4, 0, Math.PI * 2);
            ctx.fill();
            // Sol El parmak detayı
            ctx.fillStyle = '#3A6B3A';
            ctx.beginPath();
            ctx.arc(cx - radius - 8, cy + handBob, 1.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Sağ El
            ctx.fillStyle = bodyColor;
            ctx.beginPath();
            ctx.arc(cx + radius + 6, cy + 2 + handBob2, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#3A6B3A';
            ctx.beginPath();
            ctx.arc(cx + radius + 8, cy + handBob2, 1.5, 0, Math.PI * 2);
            ctx.fill();

            // --- MİNİK AYAKLAR ---
            ctx.fillStyle = '#2E6B2E';
            ctx.beginPath();
            ctx.ellipse(cx - 5, cy + radius + 2, 4, 3, 0, 0, Math.PI * 2);
            ctx.ellipse(cx + 5, cy + radius + 2, 4, 3, 0, 0, Math.PI * 2);
            ctx.fill();

            // --- KORKUNÇ TEK GÖZ (Cyclops) ---
            // Göz akı (Büyük oval)
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.ellipse(cx, cy - 3, 8, 6, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Kırmızı iris (Gittiği yöne baksın)
            const eyeOffsetX = this.vx < 0 ? -3 : 3;
            ctx.fillStyle = '#FF0000';
            ctx.beginPath();
            ctx.arc(cx + eyeOffsetX, cy - 3, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Göz bebeği
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(cx + eyeOffsetX, cy - 3, 1.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Kızgın Kaş
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            if (this.vx < 0) {
                ctx.moveTo(cx - 9, cy - 10);
                ctx.lineTo(cx + 5, cy - 7);
            } else {
                ctx.moveTo(cx + 9, cy - 10);
                ctx.lineTo(cx - 5, cy - 7);
            }
            ctx.stroke();

            // --- GENİŞ ÇİRKİN AĞIZ + SİVRİ DİŞLER ---
            // Ağız içi
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.ellipse(cx, cy + 7, 9, 5, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Üst sivri dişler
            ctx.fillStyle = '#FFF';
            ctx.beginPath();
            ctx.moveTo(cx - 8, cy + 4); ctx.lineTo(cx - 5, cy + 8); ctx.lineTo(cx - 2, cy + 4);
            ctx.moveTo(cx - 2, cy + 4); ctx.lineTo(cx + 1, cy + 8); ctx.lineTo(cx + 4, cy + 4);
            ctx.moveTo(cx + 4, cy + 4); ctx.lineTo(cx + 7, cy + 8); ctx.lineTo(cx + 10, cy + 4);
            ctx.fill();
            
            // Alt dişler
            ctx.beginPath();
            ctx.moveTo(cx - 6, cy + 10); ctx.lineTo(cx - 3, cy + 6); ctx.lineTo(cx, cy + 10);
            ctx.moveTo(cx, cy + 10); ctx.lineTo(cx + 3, cy + 6); ctx.lineTo(cx + 6, cy + 10);
            ctx.fill();
        }

        ctx.restore();
    }
}
