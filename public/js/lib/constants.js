// Board dimensions
export const BOARD_ROWS = 12;
export const BOARD_COLUMNS = 5;

// Piece ranks
export const MAX_RANK = 11;
export const MAX_MOVABLE_RANK = 10;
export const MIN_RANK = 0;

// Player colors
export const COLORS = {
    RED: 'red',
    BLUE: 'blue'
};

export const COLOR_CHARS = {
    RED: 'r',
    BLUE: 'b'
};

export const COLOR_CLASSES = `${COLORS.RED} ${COLORS.BLUE}`;

// Map color characters to color names
export const COLOR_CHAR_TO_NAME = {
    [COLOR_CHARS.RED]: COLORS.RED,
    [COLOR_CHARS.BLUE]: COLORS.BLUE
};

// CSS class names
export const CSS_CLASSES = {
    // Board structure
    TOP_LEFT_CORNER: 'top-left-corner',
    TOP_EDGE: 'top-edge',
    TOP_RIGHT_CORNER: 'top-right-corner',
    BOTTOM_LEFT_CORNER: 'bottom-left-corner',
    BOTTOM_EDGE: 'bottom-edge',
    BOTTOM_RIGHT_CORNER: 'bottom-right-corner',
    LEFT_EDGE: 'left-edge',
    SQUARE: 'square',
    RIGHT_EDGE: 'right-edge',
    
    // Piece states
    EMPTY: 'empty',
    FACEDOWN: 'facedown',
    SELECTED: 'selected',
    NOT_MOVED: 'not-moved',
    
    // Move types
    VALID_MOVE: 'valid-move',
    VALID_ATTACK: 'valid-attack',
    VALID_SWAP: 'valid-swap',
    LAST_MOVE: 'last-move',
    
    // Player states
    ACTIVE_PLAYER: 'active-player',
    SETUP_PLAYER: 'setup-player',
    READY_PLAYER: 'ready-player',
    
    // Alert types
    ALERT_SUCCESS: 'alert-success',
    ALERT_DANGER: 'alert-danger',
    ALERT_WARNING: 'alert-warning',
    
    // Combined classes
    HIGHLIGHT: 'selected valid-move valid-attack valid-swap',
    ALL_GAME_CLASSES: 'not-moved empty selected valid-move valid-attack valid-swap last-move'
};

// Rank prefix for CSS classes
export const RANK_PREFIX = 'rank';

// Move symbols
export const MOVE_SYMBOLS = {
    MOVE: '-',
    ATTACK: 'x',
    SWAP: 's'
};

// Game status
export const GAME_STATUS = {
    CHECKMATE: 'checkmate',
    NOPIECES: 'nopieces',
    FORFEIT: 'forfeit',
    PENDING: 'pending'
};

// Game over types
export const GAME_OVER_TYPES = {
    CHECKMATE_WIN: 'checkmate-win',
    CHECKMATE_LOSE: 'checkmate-lose',
    FORFEIT_WIN: 'forfeit-win',
    FORFEIT_LOSE: 'forfeit-lose',
    NOPIECES_WIN: 'nopieces-win',
    NOPIECES_LOSE: 'nopieces-lose'
};

// Element IDs
export const ELEMENT_IDS = {
    GAME: 'game',
    MESSAGES: 'messages',
    BOARD: 'board',
    GAME_OVER: 'game-over',
    FORFEIT_GAME: 'forfeit-game',
    YOU: 'you',
    OPPONENT: 'opponent',
    FINISH_SETUP: 'finishSetup',
    FORFEIT: 'forfeit',
    CANCEL_FORFEIT: 'cancel-forfeit',
    CONFIRM_FORFEIT: 'confirm-forfeit'
};

// Selectors
export const SELECTORS = {
    SQUARE: '.square',
    EMPTY: '.empty',
    VALID_MOVE: '.valid-move',
    VALID_ATTACK: '.valid-attack',
    VALID_SWAP: '.valid-swap'
};

// Board labels
export const FILE_LABELS = ['A', 'B', 'C', 'D', 'E'];
export const RANK_LABELS = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

// Piece rank values
export const RANK_HIDDEN = 'hidden';

// Error messages
export const ERROR_MESSAGES = {
    HANDSHAKE_UNAUTHORIZED: 'handshake unauthorized',
    CLIENT_CONNECTION_FAILED: 'Client connection failed'
};

// Game over messages (matching GameUIManager structure)
export const GAME_OVER_MESSAGES = {
    [GAME_OVER_TYPES.CHECKMATE_WIN]: ['alert-success', 'Captured Flag'],
    [GAME_OVER_TYPES.CHECKMATE_LOSE]: ['alert-danger', 'Flag Lost'],
    [GAME_OVER_TYPES.FORFEIT_WIN]: ['alert-success', 'Your opponent has surrendered'],
    [GAME_OVER_TYPES.FORFEIT_LOSE]: ['alert-danger', 'You have surrendered'],
    [GAME_OVER_TYPES.NOPIECES_WIN]: ['alert-success', 'Your opponent has no moveable pieces'],
    [GAME_OVER_TYPES.NOPIECES_LOSE]: ['alert-danger', 'You have no moveable pieces left'],
};

