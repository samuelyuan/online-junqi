import express from 'express';
import session from 'express-session';
import { MemoryStore } from 'express-session';
import { createServer } from 'http';
import { Server } from 'socket.io';

var bodyParser = require('body-parser'),
  cookie = require('cookie'),
  errorHandler = require('errorhandler'),
  logger = require('morgan'),
  methodOverride = require('method-override'),
  path = require('path'),
  favicon = require('serve-favicon');

var httpRoutes = require('./routes/http'),
  socketRoutes = require('./routes/socket'),
  GameStore = require('./lib/GameStore');

var app = express();
var server = createServer(app);
// Create a Socket.IO server
var io = new Server(server);

var DB = new GameStore();

var sessionStore = new MemoryStore();

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
  var cookies = cookie.parse(socket.handshake.headers.cookie);
  // connect.sid comes with extra information
  var sessionId: string = cookies['connect.sid'].split('.')[0].split(':')[1];

  sessionStore.load(sessionId, function (err, session) {
    if (err) {
      return next(err);
    }
    (socket.handshake as any).session = session;
    var authorized = (socket.handshake as any).session ? true : false;
    if (authorized) {
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
server.listen(app.get('port'), () => {
  console.log('Online Junqi is listening on port ' + app.get('port'));
});
