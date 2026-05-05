import { DOUBLE_TAP_WINDOW } from './constants.js';

export class InputManager {
  constructor() {
    this.keys = {};
    this.justPressedKeys = {};
    this.justReleasedKeys = {};
    this.doubleTapState = {};

    window.addEventListener('keydown', (e) => {
      if (!this.keys[e.code]) {
        this.justPressedKeys[e.code] = true;
        this._checkDoubleTap(e.code);
      }
      this.keys[e.code] = true;
      e.preventDefault();
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      this.justReleasedKeys[e.code] = true;
      e.preventDefault();
    });

    // Mouse support
    this.mouseDeltaX = 0;
    this.mouseClicked = false;
    this.mouseDown = false;
    this.mouseX = 400; // default center
    this.mouseY = 300;

    window.addEventListener('mousemove', (e) => {
      this.mouseDeltaX += e.movementX || 0;
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        // Assume logical size is 800x600 (from constants)
        const scaleX = 800 / rect.width;
        const scaleY = 600 / rect.height;
        this.mouseX = (e.clientX - rect.left) * scaleX;
        this.mouseY = (e.clientY - rect.top) * scaleY;
      }
    });

    window.addEventListener('mousedown', () => {
      this.mouseClicked = true;
      this.mouseDown = true;
    });

    window.addEventListener('mouseup', () => {
      this.mouseDown = false;
    });
  }

  _checkDoubleTap(code) {
    const now = performance.now();
    if (!this.doubleTapState[code]) {
      this.doubleTapState[code] = { lastPress: 0, triggered: false };
    }
    const state = this.doubleTapState[code];
    const elapsed = now - state.lastPress;
    if (elapsed < DOUBLE_TAP_WINDOW * 16.67) { // convert frames to ms
      state.triggered = true;
    } else {
      state.triggered = false;
    }
    state.lastPress = now;
  }

  isDown(code) {
    return !!this.keys[code];
  }

  justPressed(code) {
    return !!this.justPressedKeys[code];
  }

  doubleTapped(code) {
    const state = this.doubleTapState[code];
    if (state && state.triggered) {
      state.triggered = false;
      return true;
    }
    return false;
  }

  anyKeyPressed() {
    return Object.keys(this.justPressedKeys).length > 0 || this.mouseClicked;
  }

  getMouseDeltaX() {
    const d = this.mouseDeltaX;
    this.mouseDeltaX = 0;
    return d;
  }

  isMouseDown() {
    return this.mouseDown;
  }

  justClicked() {
    return this.mouseClicked;
  }

  endFrame() {
    this.justPressedKeys = {};
    this.justReleasedKeys = {};
    this.mouseClicked = false;
    this.mouseDeltaX = 0;
  }
}
