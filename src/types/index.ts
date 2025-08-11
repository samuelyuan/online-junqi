import { Request } from 'express';
import { Game } from '../lib/Game';

// Session-related types
export interface SessionData {
  gameID: string;
  playerColor: 'red' | 'blue';
  playerName: string;
}

// Socket.IO extended handshake type
export interface SocketHandshake {
  session: SessionData;
}

// Game-related types
export interface PlayerSession {
  playerColor: 'red' | 'blue';
  playerName: string;
}

export interface PlayerStatus {
  color: 'red' | 'blue' | null;
  name: string | null;
  joined: boolean;
  isSetup: boolean;
  inCheck: boolean;
  hasCommander: boolean;
  hasMoveablePieces: boolean;
  forfeited: boolean;
}

export enum GameStatus {
  PENDING = "pending",
  ONGOING = "ongoing",
  FORFEIT = "forfeit",
  NO_PIECES = "nopieces",
  CHECKMATE = "checkmate"
}

// Socket event types
export interface MoveData {
  gameID: string;
  move: string;
}

export interface DebugInfo {
  socketID: string;
  event: string;
  gameID?: string;
  move?: string;
  session: SessionData;
}

export interface ErrorResponse {
  message: string;
  code?: string;
}

// Extended Express types
export interface AuthenticatedRequest extends Request {
  session: any;
}

// Form validation types
export interface StartGameFormData {
  'player-color': 'red' | 'blue';
  'player-name': string;
}

export interface JoinGameFormData {
  'game-id': string;
  'player-name': string;
}

export interface ValidatedStartGameData {
  playerColor: 'red' | 'blue';
  playerName: string;
}

export interface ValidatedJoinGameData {
  gameID: string;
  playerName: string;
}

export interface ValidatedGameData {
  gameID: string;
  playerColor: string;
  playerName: string;
}

// Database types
export interface GameStoreInterface {
  games: { [key: string]: Game };
  add(gameParams: PlayerSession): string;
  remove(key: string): boolean;
  find(key: string): Game | false;
  list(): string[];
}
