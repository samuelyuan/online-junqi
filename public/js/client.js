var Client = (function(window) {

    var socket      = null;
    var gameState   = null;

    var gameID      = null;
    var playerColor = null;
    var playerName  = null;

    var container   = null;
    var messages    = null;
    var board       = null;
    var squares     = null;

    var gameClasses = null;

    var selection   = null;

    var prevSelectedSquare = null;
    var curSelectedSquare = null;
    var swapStr = null;

    var gameOverMessage     = null;
    var forfeitPrompt       = null;

    /**
    * Initialize the UI
    */
    var init = function(config)
    {
        gameID      = config.gameID;
        playerColor = config.playerColor;
        playerName  = config.playerName;

        container   = $('#game');
        messages    = $('#messages');
        board       = $('#board');

        // Dynamically create board because most of the rows and columns are the same

        // Top row border
        var topRow = "";
        topRow += "<tr>";
        topRow += "<td class='top-left-corner'></td>";
        for (var col = 1; col <= 5; col++) {
          topRow += "<td class='top-edge'></td>";
        }
        topRow += "<td class='top-right-corner'></td>";
        topRow += "</tr>";
        board.append(topRow);

        // Create a new row to display pieces
        for (var row = 1; row <= 12; row++) {
          var curRow = "";
          curRow += "<tr>";
          curRow += "<td class='left-edge'></td>";
          for (var col = 1; col <= 5; col++) {
            curRow += "<td class='square'></td>";
          }
          curRow += "<td class='right-edge'></td>";
          curRow += "</tr>";
          board.append(curRow);
        }

        // Bottom row border
        var bottomRow = "<tr>";
        bottomRow += "<td class='bottom-left-corner'></td>";
        for (var col = 1; col <= 5; col++) {
          bottomRow += "<td class='bottom-edge'></td>";
        }
        bottomRow += "<td class='bottom-right-corner'></td>";
        bottomRow += "</tr>";
        board.append(bottomRow);

        squares     = board.find('.square');
        setupButton = $('#finishSetup');

        gameOverMessage     = $('#game-over');
        forfeitPrompt       = $('#forfeit-game');

        gameClasses = "red blue rank0 rank1 rank2 rank3 rank4 rank5 rank6 rank7 rank8 rank9 rank10 rank11 not-moved empty selected " +
                      "valid-move valid-capture valid-dies valid-equal valid-swap last-move";

        // Create socket connection
        socket = io.connect();

        // Define board based on player's perspective
        assignSquares();

        // Attach event handlers
        attachDOMEventHandlers();
        attachSocketEventHandlers();

        // Initialize modal popup windows
        gameOverMessage.modal({show: false, keyboard: false, backdrop: 'static'});
        forfeitPrompt.modal({show: false, keyboard: false, backdrop: 'static'});

        // Join game
        socket.emit('join', gameID);
    };

    /**
    * Assign square IDs and labels based on player's perspective
    */
    var assignSquares = function()
    {
        var fileLabels = ['A', 'B', 'C', 'D', 'E'];
        var rankLabels = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
        var squareIDs  = [
            'a12', 'b12', 'c12', 'd12', 'e12',
            'a11', 'b11', 'c11', 'd11', 'e11',
            'a10', 'b10', 'c10', 'd10', 'e10',
            'a9', 'b9', 'c9', 'd9', 'e9',
            'a8', 'b8', 'c8', 'd8', 'e8',
            'a7', 'b7', 'c7', 'd7', 'e7',
            'a6', 'b6', 'c6', 'd6', 'e6',
            'a5', 'b5', 'c5', 'd5', 'e5',
            'a4', 'b4', 'c4', 'd4', 'e4',
            'a3', 'b3', 'c3', 'd3', 'e3',
            'a2', 'b2', 'c2', 'd2', 'e2',
            'a1', 'b1', 'c1', 'd1', 'e1'
        ];

        if (playerColor === 'red')
        {
            fileLabels.reverse();
            rankLabels.reverse();
            squareIDs.reverse();
        }

        // Set file and rank labels
       /* $('.top-edge').each(function(i) { $(this).text(fileLabels[i]); });
        $('.right-edge').each(function(i) { $(this).text(rankLabels[i]); });
        $('.bottom-edge').each(function(i) { $(this).text(fileLabels[i]); });
        $('.left-edge').each(function(i) { $(this).text(rankLabels[i]); });*/

        // Set square IDs
        squares.each(function(i) { $(this).attr('id', squareIDs[i]); });
    };

    var callbackHighlightSwap = function(color, rank)
    {
        return function(ev) {
            //for setup, swap pieces
            for (var i = 0; i < gameState.players.length; i++)
            {
                if (gameState.players[i].color === playerColor && gameState.players[i].isSetup === false)
                {
                    highlightValidSwap(color + rank, ev.target);
                }
            }
        }
    }

    var callbackHighlightMoves = function(color, rank)
    {
        return function(ev) {
            //Show moves for player
            if (gameState.activePlayer && gameState.activePlayer.color === playerColor)
            {
                highlightValidMoves(color + rank, ev.target);
            }
        }
    };

  /**
   * Attach DOM event handlers
   */
  var attachDOMEventHandlers = function()
  {
    // Highlight valid moves for red pieces
    if (playerColor === 'red')
    {
        var baseString = '.red.rank';
        for (var i = 0; i <= 11; i++)
        {
            container.on('click', baseString + i.toString(), callbackHighlightSwap('r', i.toString()));
        }

        for (var i = 0; i < 10; i++)
        {
            container.on('click', baseString + i.toString(), callbackHighlightMoves('r', i.toString()));
        }
    }

    // Highlight valid moves for blue pieces
    if (playerColor === 'blue')
    {
        var baseString = '.blue.rank';
        for (var i = 0; i <= 11; i++)
        {
            container.on('click', baseString + i.toString(), callbackHighlightSwap('b', i.toString()));
        }

        for (var i = 0; i < 10; i++)
        {
            container.on('click', baseString + i.toString(), callbackHighlightMoves('b', i.toString()));
        }
    }

    // Clear all move highlights
    container.on('click', '.empty', function(ev) {
      clearHighlights();
    });

    // Perform a regular move
    container.on('click', '.valid-move', function(ev) {
        var m = generateMoveString(ev.target, '-');

        messages.empty();
        socket.emit('move', {gameID: gameID, move: m});
    });

    // Perform a regular capture
    container.on('click', '.valid-capture', function(ev) {
        var m = generateMoveString(ev.target, 'x');

        messages.empty();
        socket.emit('move', {gameID: gameID, move: m});
    });

    //dies to a higher rank
    container.on('click', '.valid-dies', function(ev) {
        var m = generateMoveString(ev.target, 'o');

        messages.empty();
        socket.emit('move', {gameID: gameID, move: m});
    });

    //both attacker and defender die
    container.on('click', '.valid-equal', function(ev) {
        var m = generateMoveString(ev.target, '=');

        messages.empty();
        socket.emit('move', {gameID: gameID, move: m});
    });


    //Swap pieces
    container.on('click', '.valid-swap', function(ev) {
        var m = swapStr;

        messages.empty();
        socket.emit('move', {gameID: gameID, move: m});
    });

    //Finish setup
      container.on('click', '#finishSetup', function(ev) {
           socket.emit('finishSetup', gameID);
      });


    // Forfeit game
    container.on('click', '#forfeit', function(ev) {
        showForfeitPrompt(function(confirmed) {
            if (confirmed)
            {
              messages.empty();
              socket.emit('forfeit', gameID);
            }
        });

        });
    };

    var generateMoveString = function(destinationSquare, symbol)
    {
        var piece = selection.color+selection.piece;
        var src   = $('#'+selection.file+selection.rank);
        var dest  = $(destinationSquare);

        clearHighlights();

        // Move piece on board
        src.removeClass(getPieceClasses(piece)).addClass('empty');
        dest.removeClass('empty').addClass(getPieceClasses(piece));

        // Return move string
        return piece + ' ' + selection.file + selection.rank + ' ' + symbol + ' ' + dest.attr('id');
    }

    /**
    * Attach Socket.IO event handlers
    */
    var attachSocketEventHandlers = function()
    {
        // Update UI with new game state
        socket.on('update', function(data) {
            //console.log(data);
            gameState = data;
            update();
        });

        // Display an error
        socket.on('error', function(data) {
            //console.log(data);
            showErrorMessage(data);
        });
    };

    var highlightValidSwap = function(piece, selectedSquare)
    {
        var square = $(selectedSquare);
        var move   = null;

        // Set selection object
        selection = {
            color: piece[0],
            piece: piece[1],
            file:  square.attr('id')[0],
            rank:  square.attr('id').substr(1, square.attr('id').length - 1)
        };

        // Highlight the selected square
        squares.removeClass('selected');
        square.addClass('selected');

        curSelectedSquare = square.attr('id');
        swapStr = piece + ' ' + curSelectedSquare + ' ' + 's' + ' ' + prevSelectedSquare;

        // Highlight any valid moves
        squares.removeClass('valid-swap');
        for (var i = 0; i < gameState.validSwap.length; i++)
        {
            move = gameState.validSwap[i];

            if (move.type === 'swap')
            {
                if (move.pieceCode === piece && move.startSquare === square.attr('id'))
                {
                    prevSelectedSquare = square.attr('id');
                    $('#'+move.endSquare).addClass('valid-swap');
                }
            }
        }
    }

    /**
    * Highlight valid moves for the selected piece
    */
    var highlightValidMoves = function(piece, selectedSquare)
    {
        var square = $(selectedSquare);
        var move   = null;

        // Set selection object
        selection = {
            color: piece[0],
            piece: piece[1],
            file:  square.attr('id')[0],
            rank:  square.attr('id').substr(1, square.attr('id').length - 1)
        };

        // Highlight the selected square
        squares.removeClass('selected');
        square.addClass('selected');

        // Highlight any valid moves
        squares.removeClass('valid-move valid-capture valid-equal valid-dies');
        for (var i=0; i<gameState.validMoves.length; i++)
        {
            move = gameState.validMoves[i];

            if (move.type === 'move')
            {
                if (move.pieceCode === piece && move.startSquare === square.attr('id'))
                {
                    $('#'+move.endSquare).addClass('valid-move');
                }
            }

            if (move.type === 'capture')
            {
                if (move.pieceCode === piece && move.startSquare === square.attr('id'))
                {
                    if (move.captureSquare === move.endSquare)
                    {
                        $('#'+move.endSquare).addClass('valid-capture');
                    }
                }
            }

            if (move.type === 'dies')
            {
                if (move.pieceCode === piece && move.startSquare === square.attr('id'))
                {
                    if (move.dieSquare === move.startSquare)
                    {
                        $('#'+move.endSquare).addClass('valid-dies');
                    }
                }
            }

            if (move.type === 'equal')
            {
                if (move.pieceCode === piece && move.startSquare === square.attr('id'))
                {
                    if (move.dieSquare1 === move.startSquare && move.dieSquare2 === move.endSquare)
                    {
                        $('#'+move.endSquare).addClass('valid-equal');
                    }
                }
            }
        }
    };

    /**
    * Clear valid move highlights
    */
    var clearHighlights = function()
    {
        squares.removeClass('selected');
        squares.removeClass('valid-move');
        squares.removeClass('valid-capture');
        squares.removeClass('valid-dies');
        squares.removeClass('valid-equal');
        squares.removeClass('valid-swap');
    };

  /**
   * Update UI from game state
   */
  var update = function() {
    var you, opponent = null;

    var container, name, status, captures = null;

    // Update player info
    for (var i = 0; i < gameState.players.length; i++)
    {
        // Determine if player is you or opponent
        if (gameState.players[i].color === playerColor)
        {
          you = gameState.players[i];
          container = $('#you');
        }
        else if (gameState.players[i].color !== playerColor)
        {
          opponent = gameState.players[i];
          container = $('#opponent');
        }

        name     = container.find('strong');
        status   = container.find('.status');
        captures = container.find('ul');

        // Name
        if (gameState.players[i].name)
        {
            //if the player quits midgame, don't show any name
            if (gameState.players[i].joined === false)
            {
                name.text("...");
                gameState.players[i].name = null;
            }
            else
            {
                name.text(gameState.players[i].name);
            }
        }

        // Active Status
        container.removeClass('active-player');
        if (gameState.activePlayer && gameState.activePlayer.color === gameState.players[i].color)
        {
          container.addClass('active-player');
        }

        //Setup Status
        container.removeClass('setup-player ready-player');
        if (gameState.players[i].isSetup === false)
        {
            container.addClass('setup-player');
        }
        else if (gameState.players[i].isSetup === true && gameState.status === 'pending')
        {
            container.addClass('ready-player');
        }

      // Check Status
      /*status.removeClass('label label-danger').text('');
      if (gameState.players[i].inCheck) {
        status.addClass('label label-danger').text('Check');
      }*/

      // Captured Pieces
      /*captures.empty();
      for (var j=0; j<gameState.capturedPieces.length; j++) {
        if (gameState.capturedPieces[j][0] !== gameState.players[i].color[0]) {
          captures.append('<li class="'+getPieceClasses(gameState.capturedPieces[j])+'"></li>');
        }
      }*/
    }

    // Update board
    for (var sq in gameState.board.boardState)
    {
        $('#'+sq).removeClass(gameClasses).addClass(getPieceClasses(gameState.board.boardState[sq]));
    }

    // Highlight last move
    if (gameState.lastMove)
    {
        if (gameState.lastMove.type === 'move' || gameState.lastMove.type === 'capture' ||
           gameState.lastMove.type === 'dies' || gameState.lastMove.type === 'equal')
        {
            $('#'+gameState.lastMove.startSquare).addClass('last-move');
            $('#'+gameState.lastMove.endSquare).addClass('last-move');
        }
    }

    // Test for checkmate
    if (gameState.status === 'checkmate')
    {
        if (opponent.inCheck) { showGameOverMessage('checkmate-win');  }
        if (you.inCheck)      { showGameOverMessage('checkmate-lose'); }
    }

    // Test for stalemate
    if (gameState.status === 'nopieces')
    {
        if (opponent.hasMoveablePieces === false) { showGameOverMessage('nopieces-win'); }
        if (you.hasMoveablePieces === false) { showGameOverMessage('nopieces-lose'); }
    }

    // Test for forfeit
    if (gameState.status === 'forfeit')
    {
        if (opponent.forfeited) { showGameOverMessage('forfeit-win');  }
        if (you.forfeited)      { showGameOverMessage('forfeit-lose'); }
    }
  };

  /**
   * Display an error message on the page
   */
  var showErrorMessage = function(data) {
    var msg, html = '';

    if (data == 'handshake unauthorized') {
      msg = 'Client connection failed';
    } else {
      msg = data.message;
    }

    html = '<div class="alert alert-danger">'+msg+'</div>';
    messages.append(html);
  };

  /**
   * Display the "Game Over" window
   */
  var showGameOverMessage = function(type) {
        var header = gameOverMessage.find('h2');

        // Set the header's content and CSS classes
        header.removeClass('alert-success alert-danger alert-warning');
        switch (type) {
            case 'checkmate-win'  : header.addClass('alert-success').text('Captured Flag'); break;
            case 'checkmate-lose' : header.addClass('alert-danger').text('Flag Lost'); break;
            case 'forfeit-win'    : header.addClass('alert-success').text('Your opponent has surrendered'); break;
            case 'forfeit-lose'   : header.addClass('alert-danger').text('You have surrendered'); break;
            case 'nopieces-win'  : header.addClass('alert-success').text('Your opponent has no moveable pieces'); break;
            case 'nopieces-lose' : header.addClass('alert-danger').text('You have no moveable pieces left'); break;
        }
        gameOverMessage.modal('show');
  };

  /**
   * Display the "Forfeit Game" confirmation prompt
   */
  var showForfeitPrompt = function(callback) {
        // Temporarily attach click handler for the Cancel button, note the use of .one()
        forfeitPrompt.one('click', '#cancel-forfeit', function(ev) {
            callback(false);
            forfeitPrompt.modal('hide');
        });

        // Temporarily attach click handler for the Confirm button, note the use of .one()
        forfeitPrompt.one('click', '#confirm-forfeit', function(ev) {
            callback(true);
            forfeitPrompt.modal('hide');
        });

        forfeitPrompt.modal('show');
  };

  /**
   * Get the corresponding CSS classes for a given piece
   */
  var getPieceClasses = function(piece) {
      if (piece == null)
      {
          return 'empty';
      }

      var pieceColor = piece[0];
      var className = '';
      var pieceRank = getPieceRank(piece);

      //Check to make sure pieces are setup
      //If your opponent's pieces aren't setup, don't display anything
      if (playerColor[0] !== pieceColor)
      {
            for (var i = 0; i < gameState.players.length; i++)
            {
                // Determine if player is you or opponent
                if (gameState.players[i].color !== playerColor)
                {
                    //Not finished setup, so don't show anything
                    if (gameState.players[i].isSetup === false)
                    {
                        return '';
                    }
                }
            }
      }

      //Don't reveal any of your opponent's pieces (the only exception is the flag which can be revealed after the commander dies)
      if (playerColor[0] !== pieceColor)
      {
          //Display flag when commander dies
          if (pieceRank === '11')
          {
                for (var i = 0; i < gameState.players.length; i++)
                {
                    // Determine if player is you or opponent
                    if (gameState.players[i].color !== playerColor)
                    {
                        //If the opponent lost the commander, then reveal flag
                        if (gameState.players[i].hasCommander === false)
                        {
                            //Determine the opponent's color (if you're blue, the opponent must be red)
                            if (playerColor[0] === 'r')
                            {
                                return 'blue rank11';
                            }
                            else if (playerColor[0] === 'b')
                            {
                                return 'red rank11';
                            }
                        }
                    }
                }
          }

          //Never display any other piece's rank
          if (playerColor[0] !== 'b')
          {
              return 'facedown blue';
          }
          else if (playerColor[0] !== 'r')
          {
              return 'facedown red';
          }
      }

      if (pieceColor === 'b')
      {
          className += 'blue ';
      }
      else if (pieceColor === 'r')
      {
          className += 'red ';
      }

      className += 'rank' + pieceRank;

      if (piece[piece.length - 1] === '_')
      {
         className += ' not-moved';
      }

      return className;
  };

    var getPieceRank = function(piece)
    {
        if (piece[piece.length - 1] === '_')
        {
            lengthRank = piece.length - 2;
        }
        else
        {
            lengthRank = piece.length - 1;
        }

        return piece.substr(1, lengthRank);
    };

  return init;

}(window));
