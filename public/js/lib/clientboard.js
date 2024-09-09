export class ClientBoard {
  generateBoardHtml(numRows, numColumns) {
    // Dynamically create board because most of the rows and columns are the same

    var boardHtml = "";

    // Top row border
    var topRow = this.generateBoardRow(numColumns, "top-left-corner", "top-edge", "top-right-corner");
    boardHtml += topRow;

    // Create a new row to display pieces
    for (var row = 1; row <= numRows; row++) {
      var curRow = this.generateBoardRow(numColumns, "left-edge", "square", "right-edge");
      boardHtml += curRow;
    }

    // Bottom row border
    var bottomRow = this.generateBoardRow(numColumns, "bottom-left-corner", "bottom-edge", "bottom-right-corner");
    boardHtml += bottomRow;

    return boardHtml;
  }

  generateBoardRow(numColumns, leftSquareClass, middleSquareClass, rightSquareClass) {
    var row = "";
    row += "<tr>";
    row += "<td class='" + leftSquareClass + "'></td>";
    for (var col = 1; col <= numColumns; col++) {
      row += "<td class='" + middleSquareClass + "'></td>";
    }
    row += "<td class='" + rightSquareClass + "'></td>";
    row += "</tr>";
    return row;
  }

  /**
 * Get the corresponding CSS classes for a given piece
 */
  getPieceClasses(piece, playerColor, gameState) {
    if (piece == null) {
      return 'empty';
    }

    var pieceColor = piece[0];
    var pieceRank = this.getPieceRank(piece);
    var colorNameMap = { 'r': 'red', 'b': 'blue' };
    var colorClassName = colorNameMap[pieceColor];
    const RANK_FLAG = "11";

    //Don't reveal any of your opponent's pieces (the only exception is the flag which can be revealed after the commander dies)
    if (playerColor[0] !== pieceColor) {
      // The piece doesn't have an owner
      if (!(pieceColor in gameState.colorMap)) {
        // Should not reach this point
        throw new Error(`Current piece color ${pieceColor} is not in color map ${JSON.stringify(gameState.colorMap)}`);
      }

      // Find the owner of that piece
      var pieceOwner = gameState.colorMap[pieceColor];

      //Check to make sure pieces are setup
      //If your opponent's pieces aren't setup, don't display anything
      if (gameState.players[pieceOwner].isSetup === false) {
        return '';
      }

      //Display flag when commander dies
      if (pieceRank === RANK_FLAG && gameState.players[pieceOwner].hasCommander === false) {
        return `${colorClassName} rank${RANK_FLAG}`;
      }

      //Never display any other piece's rank
      return `facedown ${colorClassName}`;
    }

    return `${colorClassName} rank${pieceRank}`;
  };

  getPieceRank(piece) {
    var lengthRank = piece.length - 1;
    if (piece[piece.length - 1] === '_') {
      lengthRank = piece.length - 2;
    }
    return piece.substr(1, lengthRank);
  };
}