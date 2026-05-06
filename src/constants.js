// Game Constants
export const CANVAS_W = 960;
export const CANVAS_H = 540;
export const PIXEL = 3; // pixel art scale

// Physics
export const GRAVITY = 0.6;
export const GROUND_Y = 460; // ground line Y position
export const FRICTION = 0.85;
export const MOVE_SPEED = 3.5;
export const DASH_SPEED = 12;
export const DASH_DURATION = 10; // frames
export const JUMP_POWER = 12;

// Player Stats
export const PANDA_HP = 100;
export const PANDA_PUNCH_DMG = 6;
export const PANDA_KICK_DMG = 10;
export const PANDA_LASER_DMG = 35;
export const PANDA_PUNCH_RANGE = 120;
export const PANDA_KICK_RANGE = 140;
export const GAUGE_PER_HIT = 50; // gauge gained when hit (Doubled as requested)


export const MAX_GAUGE = 100;

// Boss Stats
export const FROG_HP = 150;
export const FROG_CLAP_DMG = 10;
export const FROG_TONGUE_DMG = 7;
export const FROG_STOMP_DMG = 15;
export const FROG_CLAP_RANGE = 140;
export const FROG_TONGUE_RANGE = 280;

// Combat
export const BLOCK_REDUCTION = 0.4; // take only 40% damage when blocking
export const HITSTUN_FRAMES = 15;
export const KNOCKBACK_FORCE = 6;
export const INVINCIBLE_FRAMES = 8;

// Timing
export const DOUBLE_TAP_WINDOW = 15; // frames for double-tap detection

// Colors
export const COLORS = {
  bg: '#1a1a2e',
  uiBg: '#16213e',
  hpPlayer: '#22c55e',
  hpBoss: '#ef4444',
  gauge: '#3b82f6',
  gaugeFull: '#f59e0b',
  text: '#ffffff',
  textShadow: '#000000',
};

// Stage boundaries
export const STAGE_LEFT = 40;
export const STAGE_RIGHT = 920;

// Stage 3 Constants
export const PROFESSOR_LEE_HP = 600;
export const SHOOTER_SCROLL_SPEED = 2;
export const PANDA_BULLET_SPEED = 10;
export const PANDA_BULLET_DMG = 5;
export const PANDA_EYE_LASER_DMG = 50;
export const PANDA_EYE_LASER_COOLDOWN = 120; // 2 seconds at 60fps
export const PAPER_SPEED = 4;
export const PAPER_DMG = 10;
export const EYE_BEAM_DMG = 20;

