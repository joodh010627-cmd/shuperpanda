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
    return Object.keys(this.justPressedKeys).length > 0;
  }

  endFrame() {
    this.justPressedKeys = {};
    this.justReleasedKeys = {};
  }
}
