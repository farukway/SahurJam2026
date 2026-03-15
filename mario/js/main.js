import { Game } from './engine/Game.js';

// Oyun başladığında çalışacak ana fonksiyon
window.onload = () => {
    const canvas = document.getElementById('gameCanvas');
    
    // Canvas boyutlarını tam ekran yap
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Ekran yeniden boyutlandırıldığında canvas boyutlarını da güncelle
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        // Game sınıfındaki genişliği de güncelle
        if (game) {
            game.width = canvas.width;
            game.height = canvas.height;
        }
    });
    // Oyun motorunu başlat
    const game = new Game(canvas);
    
    // Oyun döngüsünü (Game Loop) başlat
    let lastTime = 0;
    
    function gameLoop(timestamp) {
        // deltaTime (ms cinsinden geçen süre) hesapla
        let deltaTime = timestamp - lastTime;
        lastTime = timestamp;
        
        // Çok büyük deltaTime atlamalarını (örneğin sekme değiştirildiğinde) engelle
        if (deltaTime > 100) deltaTime = 100;

        // Oyunu güncelle ve çiz
        game.update(deltaTime);
        game.draw();

        requestAnimationFrame(gameLoop);
    }
    
    // İlk döngüyü tetikle
    requestAnimationFrame(gameLoop);
};
