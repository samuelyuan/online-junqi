import type { DefaultEventsMap, Server as SocketIOServer, Socket as SocketIOSocket } from 'socket.io';
import { Game } from '../lib/Game';
import { BoardSquarePieceMap } from '../lib/BoardConstants';
import { Piece, PieceRank } from '../lib/Piece';
import { PlayerMove, SwapMove } from '../lib/Board';

// Extended onto express-session's own SessionData via module augmentation in types/express-session.d.ts
export interface SessionData {
  gameID: string;
  playerColor: 'red' | 'blue';
  playerName: string;
}

// Custom per-connection data attached to each authenticated socket
export interface SocketData {
  session: SessionData;
}

export type GameIOServer = SocketIOServer<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketData>;
export type GameIOSocket = SocketIOSocket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketData>;

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

// A single square as sent to a specific client: opponent ranks are hidden unless revealed
export interface ClientPieceView {
  colorChar: string;
  rank: PieceRank | 'hidden';
}

export type FilteredBoardState = { [square: string]: ClientPieceView | null };

export interface GameStateDTO {
  status: GameStatus;
  activePlayer: PlayerStatus | null;
  players: PlayerStatus[];
  capturedPieces: Piece[];
  validMoves: PlayerMove[];
  validSwap: SwapMove[];
  lastMove: PlayerMove | null;
  modifiedOn: number;
  colorMap: { [key: string]: number };
  board: BoardSquarePieceMap | FilteredBoardState;
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

// Form validation types
export interface StartGameFormData {
  'player-color': 'red' | 'blue';
}

export interface JoinGameFormData {
  'game-id': string;
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
