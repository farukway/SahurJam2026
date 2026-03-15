export class Input {
    constructor() {
        this.keys = {
            ArrowLeft: false,
            ArrowRight: false,
            ArrowUp: false,
            ArrowDown: false,
            // Aksiyon / Zıplama Tuşları
            z: false,
            x: false,
            ' ': false, // Boşluk (Space)
            // Menü onay tuşu
            Enter: false 
        };

        // Tuşa basıldığında true yap
        window.addEventListener('keydown', (e) => {
            if (this.keys.hasOwnProperty(e.key)) {
                this.keys[e.key] = true;
            }
        });

        // Tuş bırakıldığında false yap
        window.addEventListener('keyup', (e) => {
            if (this.keys.hasOwnProperty(e.key)) {
                this.keys[e.key] = false;
            }
        });
    }

    // İstenen tuşun basılı olup olmadığını kontrol eder
    isDown(key) {
        return this.keys[key];
    }
}
