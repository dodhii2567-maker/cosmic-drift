
export enum GameState {
  LOBBY = 'LOBBY',
  PLAYING = 'PLAYING',
  RESULT = 'RESULT'
}

export enum PlayerType {
  HUMAN = 'HUMAN',
  AI = 'AI'
}

export interface Player {
  id: string;
  name: string;
  type: PlayerType;
  color: string;
  score: number;
  x: number;
  y: number;
  angle: number;
  velocity: { x: number; y: number };
  controls?: {
    up: string;
    down: string;
    left: string;
    right: string;
  };
}

export interface Collectible {
  id: string;
  x: number;
  y: number;
  type: 'STAR' | 'NEBULA' | 'SUPERNOVA' | 'VOID';
  points: number;
  radius: number;
  createdAt: number;
}

export interface GameConfig {
  playerCount: number;
  duration: number; // in seconds
}
