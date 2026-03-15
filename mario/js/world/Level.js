export class Level {
    constructor(game) {
        this.game = game;
        this.tileSize = 64; // Blok boyutları iki katına çıkarıldı (32 -> 64)
        this.blocks = [];
        
        // Harita 200 blok uzunluğunda olacak
        const totalBlocks = 200;
        this.width = totalBlocks * this.tileSize; 
        
        // Zemin hizası (Tam ekranın altından 2 blok yukarıda)
        const groundY = this.game.height - 2 * this.tileSize;

        for (let c = 0; c < totalBlocks; c++) {
            const absolutePixelX = c * this.tileSize;
            const absolutePixelY = groundY;

            // 1. ZEMİN (Aralıksız düzlük)
            this.blocks.push({
                type: 1, // Zemin
                x: absolutePixelX,
                y: absolutePixelY,
                width: this.tileSize,
                height: this.tileSize
            });
            
            // Kamera sarsıntısında veya ekran büyüdüğünde altından siyah boşluk görünmemesi için dolgu (1'den 10'a kadar)
            for (let depth = 1; depth < 10; depth++) {
                this.blocks.push({
                    type: 1, 
                    x: absolutePixelX,
                    y: absolutePixelY + (depth * this.tileSize),
                    width: this.tileSize,
                    height: this.tileSize
                });
            }

            // İlk 10 blok güvenli bölge (Düşman veya blok çıkmasın)
            if (c > 10) {
                // 2. GÖKYÜZÜ BLOKLARI - Organik Desenli Platformlar (Merdiven, Zigzag, Dağınık)
                if (!this._skyBlockCooldown) this._skyBlockCooldown = 0;
                
                if (this._skyBlockCooldown > 0) {
                    this._skyBlockCooldown--;
                } else if (Math.random() < 0.13) {
                    const baseBlockY = groundY - (4 * this.tileSize);
                    const pattern = Math.floor(Math.random() * 6); // 0-5 arası desen
                    
                    // Her desen [(dx, dy)] çiftlerinden oluşur (dx: sağa kaç blok, dy: yukarı kaç blok)
                    let offsets = [];
                    
                    if (pattern === 0) {
                        // Merdiven Yukarı (soldan sağa yükseliyor)
                        offsets = [[0,0],[1,0],[1,1],[2,1],[2,2],[3,2],[3,3]];
                    } else if (pattern === 1) {
                        // Merdiven Aşağı (soldan sağa iniyor)
                        offsets = [[0,3],[0,2],[1,2],[1,1],[2,1],[2,0],[3,0]];
                    } else if (pattern === 2) {
                        // Zigzag (Yukarı-aşağı-yukarı)
                        offsets = [[0,0],[1,1],[2,0],[3,1],[4,0],[5,1]];
                    } else if (pattern === 3) {
                        // Dağınık Bloklar (Rastgele yüksekliklerde)
                        offsets = [[0,0],[2,1],[3,0],[5,2],[6,0],[7,1],[9,0]];
                    } else if (pattern === 4) {
                        // Piramit
                        offsets = [[0,0],[1,0],[2,0],[3,0],[4,0],[1,1],[2,1],[3,1],[2,2]];
                    } else {
                        // L Şekli
                        offsets = [[0,0],[0,1],[0,2],[1,0],[2,0],[3,0]];
                    }
                    
                    let maxDx = 0;
                    offsets.forEach(([dx, dy]) => {
                        if (dx > maxDx) maxDx = dx;
                        if ((c + dx) >= totalBlocks) return;
                        
                        // Alt sıra (dy===0) soru bloğu olabilir, üstler tuğla
                        const blockType = (dy === 0 && Math.random() > 0.55) ? 3 : 2;
                        
                        this.blocks.push({
                            type: blockType,
                            x: (c + dx) * this.tileSize,
                            y: baseBlockY - (dy * this.tileSize),
                            width: this.tileSize,
                            height: this.tileSize
                        });
                    });
                    
                    // Desen genişliği + boşluk
                    this._skyBlockCooldown = maxDx + 3 + Math.floor(Math.random() * 3);
                }
                
                // 3. DÜŞMAN ÜRETİMİ (Hırsız/Yaratık) - %10 İhtimal
                if (Math.random() < 0.1) {
                    import('../entities/Enemy.js').then(({ Enemy }) => {
                        const enemyX = absolutePixelX;
                        const enemyY = groundY - this.tileSize; // Zemin üzerinden yürüyecek
                        const newEnemy = new Enemy(enemyX, enemyY);
                        this.game.spawnItem(newEnemy);
                    });
                }
            }
        }

        // 4. OYUN SONU KAPISI (Seviyenin sonuna yakın, 195. bloğa)
        const doorX = (totalBlocks - 5) * this.tileSize;
        const doorY = groundY - 128; // Kapı yüksekliği 2 tile (128px) olduğu için yukarı çıkarıyoruz
        
        import('../entities/Door.js').then(({ Door }) => {
            const door = new Door(doorX, doorY);
            this.game.spawnItem(door);
        });
    }

    update(camera) {
        // Artık harita sabit üretildiği için burada chunk oluşturmaya gerek yok.
        // İstenirse oyundan çıkan/okunmayan objeler burada temizlenebilir.
    }

    // Blokları Ekrana Çizme
    draw(ctx, camera) {
        this.blocks.forEach(block => {
            // Sadece kameranın gördüğü blokları çiz (Optimizasyon)
            if (block.x + block.width > camera.x && block.x < camera.x + camera.width) {
                
                // Karoya göre renk belirle
                if (block.type === 1) ctx.fillStyle = '#cc5600'; // Kir / Zemin rengi
                else if (block.type === 2) ctx.fillStyle = '#a84000'; // Kırılabilir Tuğla
                else if (block.type === 3) ctx.fillStyle = '#ffd700'; // Soru Bloğu (Altın)
                else if (block.type === 4) ctx.fillStyle = '#8B4513'; // Boş / Tükenmiş Soru Bloğu
                
                const renderX = block.x - camera.x;
                const renderY = block.y;
                
                // Kamerayı çıkartarak çizim yap (Ana gövde)
                ctx.fillRect(renderX, renderY, block.width, block.height);
                
                // Çimen eklentisi (Sadece "en üstte kalan" Zemin Blokları için - type 1)
                if (block.type === 1) {
                    // Bu bloğun tam üstünde başka bir blok var mı kontrol et
                    const isTopBlock = !this.blocks.some(b => 
                        b.x === block.x && Math.abs(b.y - (block.y - this.tileSize)) < 2 
                    );
                    
                    if (isTopBlock) {
                        ctx.fillStyle = '#2d8021'; // Çimen Yeşili
                        const grassHeight = block.height / 5; // Üst %20 (1/5)
                        ctx.fillRect(renderX, renderY, block.width, grassHeight);
                    }
                }
                
                // Blok kenarlarını siyah çiz (Piksel stili / ayırt etmek için)
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 1;
                ctx.strokeRect(renderX, renderY, block.width, block.height);
            }
        });
    }
}


