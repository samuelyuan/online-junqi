import Express from 'express';
import { GameStore } from '../lib/GameStore';

var DB: GameStore | null = null;

/**
 * Validate session data for "Game" page
 * Returns valid data on success or null on failure
 */
var validateGame = function (req: Express.Request) {

  // These must exist
  if (!req.session.gameID) { 
    return null; 
  }
  if (!req.session.playerColor) { 
    return null; 
  }
  if (!req.session.playerName) { 
    return null; 
  }
  if (!req.params.id) { 
    return null; 
  }

  // These must match
  if (req.session.gameID !== req.params.id) { 
    return null; 
  }

  return {
    gameID: req.session.gameID,
    playerColor: req.session.playerColor,
    playerName: req.session.playerName
  };
};

/**
 * Validate "Start Game" form input
 * Returns valid data on success or null on failure
 */
var validateStartGame = function (req: Express.Request) {

  // These must exist
  if (!req.body['player-color']) {
    return null;
  }

  // Player Color must be 'red' or 'blue'
  if (req.body['player-color'] !== 'red' && req.body['player-color'] !== 'blue') {
    return null;
  }

  // If Player Name consists only of whitespace, set as 'Player 1'
  if (/^\s*$/.test(req.body['player-name'])) {
    req.body['player-name'] = 'Player 1';
  }

  return {
    playerColor: req.body['player-color'],
    playerName: req.body['player-name']
  };
};

/**
 * Validate "Join Game" form input
 * Returns valid data on success or null on failure
 */
var validateJoinGame = function (req: Express.Request) {

  console.log(req.body['game-id']);

  // These must exist
  if (!req.body['game-id']) {
    return null;
  }

  // If Game ID consists of only whitespace, return null
  if (/^\s*$/.test(req.body['game-id'])) {
    return null;
  }

  // If Player Name consists only of whitespace, set as 'Player 2'
  if (/^\s*$/.test(req.body['player-name'])) {
    req.body['player-name'] = 'Player 2';
  }

  return {
    gameID: req.body['game-id'],
    playerName: req.body['player-name']
  };
};

/**
 * Render "Home" Page
 */
var home = function (req: Express.Request, res: Express.Response) {
  if (!DB) {
    return;
  }
  var listIDs = DB.list();

  // Welcome
  res.render('home', { listIDs: listIDs });
};

/**
 * Render "Game" Page (or redirect to home page if session is invalid)
 */
var game = function (req: Express.Request, res: Express.Response) {

  req.session.playerName = "Anonymous";

  // Validate session data
  var validData = validateGame(req);
  if (!validData) {
    res.redirect('/');
    return;
  }

  // Render the game page
  res.render('game', validData);
};

/**
 * Process "Start Game" form submission
 * Redirects to game page on success or home page on failure
 */
var startGame = function (req: Express.Request, res: Express.Response) {

  // Create a new session
  req.session.regenerate(function (err) {
    if (err) {
      res.redirect('/');
      return;
    }

    // Validate form input
    var validData = validateStartGame(req);
    if (!validData) {
      res.redirect('/');
      return;
    }

    // Create new game
    if (!DB) {
      res.redirect('/');
      return;
    }
    var gameID = DB.add(validData);

    // Save data to session
    req.session.gameID = gameID;
    req.session.playerColor = validData.playerColor;
    req.session.playerName = validData.playerName;

    // Redirect to game page
    res.redirect('/game/' + gameID);
  });
};

/**
 * Process "Join Game" form submission
 * Redirects to game page on success or home page on failure
 */
var joinGame = function (req: Express.Request, res: Express.Response) {

  // Create a new session
  req.session.regenerate(function (err) {
    if (err) { 
      res.redirect('/'); 
      return; 
    }

    // Validate form input
    var validData = validateJoinGame(req);
    if (!validData) { 
      res.redirect('/'); 
      return; 
    }

    // Find specified game
    if (!DB) {
      res.redirect('/');
      return;
    }
    var game = DB.find(validData.gameID);
    if (!game) { 
      res.redirect('/'); 
      return; 
    }

    // Determine which player (color) to join as
    var joinColor = (game.players[0].joined) ? game.players[1].color : game.players[0].color;

    // Save data to session
    req.session.gameID = validData.gameID;
    req.session.playerColor = joinColor;
    req.session.playerName = validData.playerName;

    // Redirect to game page
    res.redirect('/game/' + validData.gameID);
  });
};

/**
 * Redirect non-existent routes to the home page
 */
var invalid = function (req: Express.Request, res: Express.Response) {

  // Go home HTTP request, you're drunk
  res.redirect('/');
};

/**
 * Attach route handlers to the app
 */
exports.attach = function (app: Express.Application, db: GameStore) {
  DB = db;

  app.get('/', home);
  app.get('/game/:id', game);
  app.post('/start', startGame);
  app.post('/join', joinGame);
  app.all('*', invalid);
};
