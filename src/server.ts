import express from 'express';
import session from 'express-session';
import { MemoryStore } from 'express-session';
import { createServer } from 'http';
import { Server } from 'socket.io';
import * as httpRoutes from './routes/http';
import bodyParser from 'body-parser';
import * as cookie from 'cookie';
import errorHandler from 'errorhandler';
import logger from 'morgan';
import methodOverride from 'method-override';
import path from 'path';
import favicon from 'serve-favicon';
import * as socketRoutes from './routes/socket';
import { GameStore } from './lib/GameStore';
import { SessionData, SocketHandshake } from './types';

const app = express();
const server = createServer(app);
// Create a Socket.IO server
const io = new Server(server);

const DB = new GameStore();

const sessionStore = new MemoryStore();

// Settings
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, '..', 'views'));
app.set('view engine', 'ejs');

// Middleware
app.use(favicon(path.join(__dirname, '..', 'public/img/favicon.ico')));
app.use(logger('dev'));
app.use(methodOverride());
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: 'mySecret',
  store: sessionStore
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));
if ('development' == app.get('env')) {
  app.use(errorHandler());
}

/*
 * Only allow socket connections that come from clients with an established session.
 */
io.use(function (socket, next) {
  const cookieHeader = socket.handshake.headers.cookie;
  if (!cookieHeader) {
    return next(new Error('No cookie header found'));
  }
  const cookies = cookie.parse(cookieHeader);
  // connect.sid comes with extra information
  const sessionId = cookies['connect.sid'];
  
  if (!sessionId) {
    return next(new Error('No session cookie found'));
  }
  
  const sessionIdParts = sessionId.split('.')[0].split(':');
  const sessionIdClean = sessionIdParts[1];
  
  if (!sessionIdClean) {
    return next(new Error('Invalid session ID format'));
  }

  sessionStore.load(sessionIdClean, function (err, session) {
    if (err) {
      return next(err);
    }
    
    // Check if session has our custom properties
    const customSession = session as any;
    if (customSession && customSession.gameID && customSession.playerColor && customSession.playerName) {
      // Create a proper SessionData object
      const sessionData: SessionData = {
        gameID: customSession.gameID,
        playerColor: customSession.playerColor,
        playerName: customSession.playerName
      };
      (socket.handshake as any).session = sessionData;
      next(); // Proceed to the next middleware
    } else {
      next(new Error('Not authorized')); // Pass an error if not authorized
    }
  });
});


// Attach routes
httpRoutes.attach(app, DB);
socketRoutes.attach(io, DB);

// Handle socket disconnection
io.sockets.on('disconnect', function (socket) {
  const sess = (socket.handshake as any).session as SessionData;
  if (sess && sess.gameID) {
    const game = DB.find(sess.gameID);
    if (game) {
      game.removePlayer(sess);
      
      // Send filtered updates to remaining players using the socket routes helper
      // We need to get all remaining sockets in the game room and send filtered updates
      const room = io.sockets.adapter.rooms.get(sess.gameID);
      if (room) {
        room.forEach(socketId => {
          const remainingSocket = io.sockets.sockets.get(socketId);
          if (remainingSocket && remainingSocket.id !== socket.id) {
            const remainingSession = (remainingSocket.handshake as any).session as SessionData;
            if (remainingSession && remainingSession.playerColor) {
              // Send filtered state for this specific player
              remainingSocket.emit('update', game.getState(remainingSession.playerColor));
            }
          }
        });
      }
    }
  }
});

// And away we go
const port = app.get('port');
if (port) {
  server.listen(port, () => {
    console.log('Online Junqi is listening on port ' + port);
  });
} else {
  console.error('Port is not defined');
}
