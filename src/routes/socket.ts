import { Server, Socket } from 'socket.io';
import { GameStore } from '../lib/GameStore';
import { Game } from '../lib/Game';
import { 
  SessionData, 
  MoveData, 
  DebugInfo, 
  ErrorResponse,
  SocketHandshake 
} from '../types';

// Helper function to safely get session from handshake
function getSession(socket: Socket): SessionData {
  return (socket.handshake as any).session as SessionData;
}

let IO: Server | null = null;
let DB: GameStore | null = null;

/**
 * Add player to game
 * Emits an "update" event on success or an "error" event on failure
 */
const join = function (this: Socket, gameID: string) {
  const sess = getSession(this);
  const debugInfo: DebugInfo = {
    socketID: this.id,
    event: 'join',
    gameID: gameID,
    session: sess
  };

  // Check if user has permission to access this game
  if (gameID !== sess.gameID) {
    console.log('ERROR: Access Denied', debugInfo);
    this.emit('error', { message: "You cannot join this game" });
    return;
  }

  // Lookup game in database
  const game = DB?.find(gameID);

  if (!game) {
    console.log('ERROR: Game Not Found', debugInfo);
    this.emit('error', { message: "Game not found" });
    return;
  }

  // Add user to game
  const result = game.addPlayer(sess);
  if (!result) {
    console.log('ERROR: Failed to Add Player', debugInfo);
    this.emit('error', { message: "Unable to join game" });
    return;
  }

  // Add user to a socket.io "room" that matches the game ID
  this.join(gameID);

  // Emit the update event to everyone in this room/game
  IO?.sockets.in(gameID).emit('update', game);

  console.log(sess.playerName + ' joined ' + gameID);
};

/*
Finish setting up pieces before allowing gameplay to begin.
*/
const finishSetup = function (this: Socket, gameID: string) {
  const sess = getSession(this);
  const debugInfo: DebugInfo = {
    socketID: this.id,
    event: 'finishSetup',
    gameID: gameID,
    session: sess
  };

  // Check if user has permission to access this game
  if (gameID !== sess.gameID) {
    console.log('ERROR: Access Denied', debugInfo);
    this.emit('error', { message: "You have not joined this game" });
    return;
  }

  // Lookup game in database
  const game = DB?.find(gameID);
  if (!game) {
    console.log('ERROR: Game Not Found', debugInfo);
    this.emit('error', { message: "Game not found" });
    return;
  }

  // Finalize setup
  const result = game.finishSetup(sess);
  if (!result) {
    console.log('ERROR: Failed to finalize setup', debugInfo);
    this.emit('error', { message: "Setup not finalized yet" });
    return;
  }

  // Emit the update event to everyone in this room/game
  IO?.sockets.in(gameID).emit('update', game);

  console.log(sess.playerName + ' finish setup in game ' + gameID);
};

/**
 * Apply move to game
 * Emits an "update" event on success or an "error" event on failure
 */
const move = function (this: Socket, data: MoveData) {
  const sess = getSession(this);
  const debugInfo: DebugInfo = {
    socketID: this.id,
    event: 'move',
    gameID: data.gameID,
    move: data.move,
    session: sess
  };

  // Check if user has permission to access this game
  if (data.gameID !== sess.gameID) {
    console.log('ERROR: Access Denied', debugInfo);
    this.emit('error', { message: "You have not joined this game" });
    return;
  }

  // Lookup game in database
  const game = DB?.find(data.gameID);
  if (!game) {
    console.log('ERROR: Game Not Found', debugInfo);
    this.emit('error', { message: "Game not found" });
    return;
  }

  // Apply move to game
  const result = game.move(data.move);
  if (!result) {
    console.log('ERROR: Failed to Apply Move', debugInfo);
    this.emit('error', { message: "Invalid move, please try again" });
    return;
  }

  // Emit the update event to everyone in this room/game
  IO?.sockets.in(data.gameID).emit('update', game);

  console.log(data.gameID + ' ' + sess.playerName + ': ' + data.move);
};

/**
 * Forfeit a game
 * Emits an "update" event on success or an "error" event on failure
 */
const forfeit = function (this: Socket, gameID: string) {
  const sess = getSession(this);
  const debugInfo: DebugInfo = {
    socketID: this.id,
    event: 'forfeit',
    gameID: gameID,
    session: sess
  };

  // Check if user has permission to access this game
  if (gameID !== sess.gameID) {
    console.log('ERROR: Access Denied', debugInfo);
    this.emit('error', { message: "You have not joined this game" });
    return;
  }

  // Lookup game in database
  const game = DB?.find(gameID);
  if (!game) {
    console.log('ERROR: Game Not Found', debugInfo);
    this.emit('error', { message: "Game not found" });
    return;
  }

  // Forfeit game
  const result = game.forfeit(sess);
  if (!result) {
    console.log('ERROR: Failed to Forfeit', debugInfo);
    this.emit('error', { message: "Failed to forfeit game" });
    return;
  }

  // Emit the update event to everyone in this room/game
  IO?.sockets.in(gameID).emit('update', game);

  console.log(gameID + ' ' + sess.playerName + ': Forfeit');
};

/**
 * Remove player from game
 */
const disconnect = function (this: Socket) {
  const sess = getSession(this);
  const debugInfo: DebugInfo = {
    socketID: this.id,
    event: 'disconnect',
    session: sess
  };

  // Lookup game in database
  const game = DB?.find(sess.gameID);
  if (!game) {
    console.log('ERROR: Game Not Found', debugInfo);
    return;
  }

  // Remove player from game
  const result = game.removePlayer(sess);
  if (!result) {
    console.log('ERROR: ' + sess.playerName + ' failed to leave ' + sess.gameID);
    return;
  }

  console.log(sess.playerName + ' left ' + sess.gameID);
  console.log('Socket ' + this.id + ' disconnected');
};

/**
 * Attach route/event handlers for socket.io
 */
export function attach(io: Server, db: GameStore): void {
  IO = io;
  DB = db;

  // When a new socket connection is made
  io.sockets.on('connection', function (socket: Socket) {
    // Attach the event handlers
    socket.on('join', join);
    socket.on('finishSetup', finishSetup);
    socket.on('move', move);
    socket.on('forfeit', forfeit);
    socket.on('disconnect', disconnect);

    console.log('Socket ' + socket.id + ' connected');
  });
}

