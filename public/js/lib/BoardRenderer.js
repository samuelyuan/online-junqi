import {
    CSS_CLASSES,
    COLORS,
    COLOR_CHAR_TO_NAME,
    RANK_PREFIX,
    RANK_HIDDEN,
    FILE_LABELS,
    RANK_LABELS,
    MIN_RANK,
    MAX_RANK,
    COLOR_CLASSES
} from './constants.js';

export class BoardRenderer {
  // Generate the board HTML with dynamic rows and columns
  generateBoardHtml(numRows, numColumns) {
    const topRow = this.generateBoardRow(numColumns, CSS_CLASSES.TOP_LEFT_CORNER, CSS_CLASSES.TOP_EDGE, CSS_CLASSES.TOP_RIGHT_CORNER);
    const bottomRow = this.generateBoardRow(numColumns, CSS_CLASSES.BOTTOM_LEFT_CORNER, CSS_CLASSES.BOTTOM_EDGE, CSS_CLASSES.BOTTOM_RIGHT_CORNER);

    const rows = [];
    // Create the rows for the board
    for (let row = 1; row <= numRows; row++) {
      rows.push(this.generateBoardRow(numColumns, CSS_CLASSES.LEFT_EDGE, CSS_CLASSES.SQUARE, CSS_CLASSES.RIGHT_EDGE));
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
      return CSS_CLASSES.EMPTY;
    }

    const pieceColor = piece[0];
    const pieceRank = this.getPieceRank(piece);
    const colorClassName = this.getColorClass(pieceColor);

    // Don't reveal opponent's pieces unless they are set up or the flag is revealed
    if (playerColor[0] !== pieceColor) {
      const pieceOwner = gameState.colorMap[pieceColor];
      if (!gameState.players[pieceOwner].isSetup) {
        return '';
      }

      // If rank is hidden, show facedown
      if (!pieceRank || pieceRank === RANK_HIDDEN) {
        return `${CSS_CLASSES.FACEDOWN} ${colorClassName}`;
      }
    }

    // Return revealed piece classes
    return `${colorClassName} ${RANK_PREFIX}${pieceRank}`;
  }

  // Utility function to map color to class name
  getColorClass(pieceColor) {
    return COLOR_CHAR_TO_NAME[pieceColor] || '';
  }

  // Get the rank of the piece from its string
  getPieceRank(piece) {
    const lengthRank = piece.endsWith('_') ? piece.length - 2 : piece.length - 1;
    return piece.slice(1, 1 + lengthRank);
  }

  // Generate all game CSS classes (colors, ranks, and game state classes)
  generateAllGameClasses() {
    let rankClasses = "";
    for (let i = MIN_RANK; i <= MAX_RANK; i++) {
      rankClasses += `${RANK_PREFIX}${i} `;
    }
    return `${COLOR_CLASSES} ${rankClasses}${CSS_CLASSES.ALL_GAME_CLASSES}`;
  }

  // Assign square IDs and labels based on player's perspective
  assignSquareIds(squares, playerColor) {
    const fileLabels = [...FILE_LABELS];
    const rankLabels = [...RANK_LABELS];
    const squareIDs = this.generateSquareIds(fileLabels, rankLabels, playerColor);

    squares.each((i) => {
      $(squares[i]).attr('id', squareIDs[i]);
    });
  }

  // Generate square IDs based on player color (mirroring for opponent's perspective)
  generateSquareIds(fileLabels, rankLabels, playerColor) {
    // Generate square IDs programmatically: for each rank, for each file
    const squareIDs = [];
    for (const rank of rankLabels) {
      for (const file of fileLabels) {
        squareIDs.push(`${file.toLowerCase()}${rank}`);
      }
    }

    if (playerColor === COLORS.RED) {
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

