import express from 'express';
import session from 'express-session';
import { MemoryStore } from 'express-session';
import { createServer } from 'http';
import { DefaultEventsMap, Server } from 'socket.io';
import * as httpRoutes from './routes/http';
import * as cookie from 'cookie';
import errorHandler from 'errorhandler';
import logger from 'morgan';
import path from 'path';
import * as socketRoutes from './routes/socket';
import { GameStore } from './lib/GameStore';
import { SessionData, SocketData } from './types';

const app = express();
const server = createServer(app);
// Create a Socket.IO server
const io = new Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketData>(server);

const DB = new GameStore();

const sessionStore = new MemoryStore();

// Settings
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, '..', 'views'));
app.set('view engine', 'ejs');

// Middleware
app.use(logger('dev'));
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: 'mySecret',
  store: sessionStore
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
    if (session && session.gameID && session.playerColor && session.playerName) {
      const sessionData: SessionData = {
        gameID: session.gameID,
        playerColor: session.playerColor,
        playerName: session.playerName
      };
      socket.data.session = sessionData;
      next(); // Proceed to the next middleware
    } else {
      next(new Error('Not authorized')); // Pass an error if not authorized
    }
  });
});


// Attach routes
httpRoutes.attach(app, DB);
socketRoutes.attach(io, DB);

// And away we go
const port = app.get('port');
if (port) {
  server.listen(port, () => {
    console.log('Online Junqi is listening on port ' + port);
  });
} else {
  console.error('Port is not defined');
}
