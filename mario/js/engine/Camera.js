export class Camera {
    constructor(width, height) {
        this.x = 0;
        this.y = 0;
        this.width = width;
        this.height = height;
    }

    update(targetEntity, worldWidth) {
        // Oyuncuyu her zaman ekranın ortasında tut (sol ve sağ takip)
        this.x = targetEntity.x + targetEntity.width / 2 - this.width / 2;

        // Sol sınır: Kamera negatife düşmesin
        if (this.x < 0) this.x = 0;
        
        // Sağ sınır: Dünya genişliğini aşmasın
        if (this.x > worldWidth - this.width) this.x = worldWidth - this.width;
    }
}
