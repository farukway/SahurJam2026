export class Physics {
    // AABB Çarpışma Tespiti (Axis-Aligned Bounding Box)
    // İki dikdörtgen varlık veya karo arasında kesişim (çarpışma) olup olmadığını denetler.
    static AABB(rect1, rect2) {
        return (
            rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y
        );
    }

    // Oyun varlıkları ile çevresel statik bloklar arasındaki çarpışmaları çözer
    // Şimdilik yerçekimi ve hız limiti fonksiyonlarını içerebilir
}
