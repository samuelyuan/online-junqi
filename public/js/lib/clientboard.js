export class ClientBoard {
  // Generate the board HTML with dynamic rows and columns
  generateBoardHtml(numRows, numColumns) {
    const topRow = this.generateBoardRow(numColumns, "top-left-corner", "top-edge", "top-right-corner");
    const bottomRow = this.generateBoardRow(numColumns, "bottom-left-corner", "bottom-edge", "bottom-right-corner");

    const rows = [];
    // Create the rows for the board
    for (let row = 1; row <= numRows; row++) {
      rows.push(this.generateBoardRow(numColumns, "left-edge", "square", "right-edge"));
    }

    // Return the entire board HTML
    return `${topRow}${rows.join('')}${bottomRow}`;
  }

  // Generate a single row of the board
  generateBoardRow(numColumns, leftSquareClass, middleSquareClass, rightSquareClass) {
    let row = `<tr><td class='${leftSquareClass}'></td>`;
    for (let col = 1; col <= numColumns; col++) {
      row += `<td class='${middleSquareClass}'></td>`;
    }
    row += `<td class='${rightSquareClass}'></td></tr>`;
    return row;
  }

  // Get the corresponding CSS classes for a given piece
  getPieceClasses(piece, playerColor, gameState) {
    if (!piece) {
      return 'empty';
    }

    const pieceColor = piece[0];
    const pieceRank = this.getPieceRank(piece);
    const colorClassName = this.getColorClass(pieceColor);
    const RANK_FLAG = "11";

    // Don't reveal opponent's pieces unless they are set up or the flag is revealed
    if (playerColor[0] !== pieceColor) {
      const pieceOwner = gameState.colorMap[pieceColor];
      if (!gameState.players[pieceOwner].isSetup) {
        return '';
      }

      //Display flag when commander dies
      if (pieceRank === RANK_FLAG && !gameState.players[pieceOwner].hasCommander) {
        return `${colorClassName} rank${RANK_FLAG}`;
      }

      //Never display any other piece's rank
      return `facedown ${colorClassName}`;
    }

    return `${colorClassName} rank${pieceRank}`;
  }

  // Utility function to map color to class name
  getColorClass(pieceColor) {
    const colorNameMap = { 'r': 'red', 'b': 'blue' };
    return colorNameMap[pieceColor] || '';
  }

  // Get the rank of the piece from its string
  getPieceRank(piece) {
    const lengthRank = piece.endsWith('_') ? piece.length - 2 : piece.length - 1;
    return piece.substr(1, lengthRank);
  }

  // Assign square IDs and labels based on player's perspective
  assignSquareIds(squares, playerColor) {
    const fileLabels = ['A', 'B', 'C', 'D', 'E'];
    const rankLabels = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    const squareIDs = this.generateSquareIds(fileLabels, rankLabels, playerColor);

    squares.each((i) => {
      $(squares[i]).attr('id', squareIDs[i]);
    });
  }

  // Generate square IDs based on player color (mirroring for opponent's perspective)
  generateSquareIds(fileLabels, rankLabels, playerColor) {
    const squareIDs = [
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

    if (playerColor === 'red') {
      fileLabels.reverse();
      rankLabels.reverse();
      squareIDs.reverse();
    }

    // Set file and rank labels
    /* $('.top-edge').each(function(i) { $(this).text(fileLabels[i]); });
     $('.right-edge').each(function(i) { $(this).text(rankLabels[i]); });
     $('.bottom-edge').each(function(i) { $(this).text(fileLabels[i]); });
     $('.left-edge').each(function(i) { $(this).text(rankLabels[i]); });*/

    return squareIDs;
  }
}