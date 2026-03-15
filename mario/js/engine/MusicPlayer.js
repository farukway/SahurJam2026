/**
 * Türk Sanat Müziği - Prosedürel Fon Müziği
 * Web Audio API ile Hicaz / Rast makamı tabanlı melodi üretir.
 * Tüm notalar prosedürel olarak üretilir, harici dosya gerekmez.
 */
export class MusicPlayer {
    constructor() {
        this.audioCtx = null;
        this.isPlaying = false;
        this.gainNode = null;
        this.currentTimeout = null;
        
        // Hicaz makamı frekansları (Do oktavı bazlı, yaklaşık quarter-tone dahil)
        // Hicaz: Do - Re♭ - Mi - Fa - Sol - La♭ - Si - Do
        this.hicazScale = [
            261.63, // Do (C4)
            277.18, // Re♭ (Db4)  
            329.63, // Mi (E4)
            349.23, // Fa (F4)
            392.00, // Sol (G4)
            415.30, // La♭ (Ab4)
            493.88, // Si (B4)
            523.25, // Do (C5)
        ];
        
        // Rast makamı frekansları
        this.rastScale = [
            261.63, // Do
            293.66, // Re
            320.00, // Mi (çeyrek ton düşük, ~Segah)
            349.23, // Fa
            392.00, // Sol
            440.00, // La
            480.00, // Si (çeyrek ton düşük, ~Eviç)
            523.25, // Do üst
        ];
        
        // Melodi desenleri (indeks tabanlı, makam notalarına referans)
        this.patterns = [
            [0, 1, 2, 3, 4, 3, 2, 1],           // Yukarı-Aşağı seyir
            [4, 5, 6, 7, 6, 5, 4, 3],           // Üst seyir
            [0, 2, 4, 3, 2, 0, 1, 0],           // Atlayışlı seyir
            [7, 6, 5, 4, 3, 2, 1, 0],           // İniş (karar)
            [0, 0, 2, 3, 4, 4, 3, 2],           // Tekrarlı motif
            [3, 4, 5, 4, 3, 2, 3, 4],           // Dalgalı
            [0, 3, 4, 7, 4, 3, 0, 0],           // Geniş aralıklı
        ];
        
        this.currentPatternIndex = 0;
        this.currentNoteIndex = 0;
        this.currentScale = this.hicazScale;
        this.tempo = 280; // ms aralıkla nota (yavaş, sanat müziği tarzı)
    }

    init() {
        if (this.audioCtx) return;
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Ana ses seviyesi
        this.gainNode = this.audioCtx.createGain();
        this.gainNode.gain.value = 0.15; // Düşük seviye (fon müziği)
        this.gainNode.connect(this.audioCtx.destination);
    }

    start() {
        if (this.isPlaying) return;
        this.init();
        this.isPlaying = true;
        
        // Suspended durumda ise resume et (tarayıcı politikası)
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
        
        this.playNextNote();
    }

    stop() {
        this.isPlaying = false;
        if (this.currentTimeout) {
            clearTimeout(this.currentTimeout);
            this.currentTimeout = null;
        }
    }

    playNextNote() {
        if (!this.isPlaying) return;
        
        const pattern = this.patterns[this.currentPatternIndex];
        const noteIndex = pattern[this.currentNoteIndex];
        const freq = this.currentScale[noteIndex];
        
        // Nota süresi (rastgele varyasyon ekle - insan hissi)
        const duration = this.tempo + (Math.random() - 0.5) * 60;
        const noteDuration = duration / 1000 * 1.8; // Nota biraz uzun sürsün (legato)
        
        this.playNote(freq, noteDuration);
        
        // Drone (sürekli 'dem' sesi - arka plan tonu)
        if (this.currentNoteIndex === 0) {
            this.playDrone(this.currentScale[0] / 2, noteDuration * 4); // 1 oktav altta
        }
        
        // Sonraki nota
        this.currentNoteIndex++;
        if (this.currentNoteIndex >= pattern.length) {
            this.currentNoteIndex = 0;
            // Yeni desen seç (sıralı veya yarı-rastgele)
            if (Math.random() > 0.3) {
                this.currentPatternIndex = (this.currentPatternIndex + 1) % this.patterns.length;
            } else {
                this.currentPatternIndex = Math.floor(Math.random() * this.patterns.length);
            }
            
            // Arada makam değiştir (%20 ihtimal)
            if (Math.random() > 0.8) {
                this.currentScale = this.currentScale === this.hicazScale ? this.rastScale : this.hicazScale;
            }
        }
        
        this.currentTimeout = setTimeout(() => this.playNextNote(), duration);
    }

    playNote(frequency, duration) {
        const ctx = this.audioCtx;
        const now = ctx.currentTime;
        
        // Ney/Ud benzeri bir sinüs + üçgen dalga sentez
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const noteGain = ctx.createGain();
        
        osc1.type = 'sine';
        osc1.frequency.value = frequency;
        
        osc2.type = 'triangle';
        osc2.frequency.value = frequency * 1.002; // Hafif detune (chorus efekti)
        
        noteGain.gain.setValueAtTime(0, now);
        noteGain.gain.linearRampToValueAtTime(0.3, now + 0.05); // Hızlı atak
        noteGain.gain.exponentialRampToValueAtTime(0.01, now + duration); // Yavaş söndürme
        
        osc1.connect(noteGain);
        osc2.connect(noteGain);
        noteGain.connect(this.gainNode);
        
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + duration);
        osc2.stop(now + duration);
    }

    playDrone(frequency, duration) {
        const ctx = this.audioCtx;
        const now = ctx.currentTime;
        
        // Drone / Dem sesi (düşük ve sürekli)
        const osc = ctx.createOscillator();
        const droneGain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = frequency;
        
        droneGain.gain.setValueAtTime(0, now);
        droneGain.gain.linearRampToValueAtTime(0.08, now + 0.3);
        droneGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
        
        osc.connect(droneGain);
        droneGain.connect(this.gainNode);
        
        osc.start(now);
        osc.stop(now + duration);
    }
    
    setVolume(vol) {
        if (this.gainNode) {
            this.gainNode.gain.value = Math.max(0, Math.min(1, vol));
        }
    }
}
