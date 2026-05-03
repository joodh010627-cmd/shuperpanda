// Simple Web Audio sound effects
export class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      this.enabled = false;
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  _play(freq, type, duration, volume = 0.15) {
    if (!this.enabled || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  _noise(duration, volume = 0.1) {
    if (!this.enabled || !this.ctx) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    source.buffer = buffer;
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    source.connect(gain);
    gain.connect(this.ctx.destination);
    source.start();
  }

  punch() { this._play(200, 'square', 0.1, 0.2); this._noise(0.05, 0.15); }
  kick() { this._play(120, 'square', 0.15, 0.25); this._noise(0.08, 0.2); }
  laser() { this._play(800, 'sawtooth', 0.5, 0.15); this._play(600, 'sine', 0.6, 0.1); }
  hit() { this._noise(0.1, 0.2); this._play(150, 'square', 0.08, 0.15); }
  block() { this._play(400, 'triangle', 0.05, 0.1); }
  clap() { this._noise(0.15, 0.25); this._play(250, 'square', 0.12, 0.2); }
  tongue() { this._play(300, 'sine', 0.2, 0.15); }
  stomp() { this._play(60, 'square', 0.3, 0.3); this._noise(0.15, 0.2); }
  ko() { this._play(400, 'square', 0.1, 0.2); this._play(300, 'square', 0.15, 0.2); this._play(200, 'square', 0.2, 0.2); }
  victory() {
    [523, 659, 784, 1047].forEach((f, i) => {
      setTimeout(() => this._play(f, 'square', 0.3, 0.15), i * 150);
    });
  }
  menuSelect() { this._play(660, 'square', 0.08, 0.1); }
  gaugeMax() { this._play(880, 'sine', 0.3, 0.15); this._play(1100, 'sine', 0.2, 0.1); }
}
