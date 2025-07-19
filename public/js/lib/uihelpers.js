/**
 * Remove all visual move highlights from board squares.
 * @param {jQuery} squares - A jQuery collection of all board square elements.
 */
export function clearHighlights(squares) {
    squares.removeClass('selected valid-move valid-attack valid-swap');
}

/**
 * Show an error message in the UI.
 * @param {jQuery} messages - The container to display the error message in.
 * @param {Object|string} data - Error message or error object.
 */
export function showErrorMessage(messages, data) {
    const msg = (data === 'handshake unauthorized')
        ? 'Client connection failed'
        : data.message;

    messages.append(`<div class="alert alert-danger">${msg}</div>`);
}

/**
 * Display the game over modal with a specific result message.
 * @param {jQuery} gameOverMessage - The modal element to display.
 * @param {'checkmate-win' | 'checkmate-lose' | 'forfeit-win' | 'forfeit-lose' | 'nopieces-win' | 'nopieces-lose'} type - The type of game over outcome.
 */
export function showGameOverMessage(gameOverMessage, type) {
    const header = gameOverMessage.find('h2');
    header.removeClass('alert-success alert-danger alert-warning');

    const typeToText = {
        'checkmate-win': ['alert-success', 'Captured Flag'],
        'checkmate-lose': ['alert-danger', 'Flag Lost'],
        'forfeit-win': ['alert-success', 'Your opponent has surrendered'],
        'forfeit-lose': ['alert-danger', 'You have surrendered'],
        'nopieces-win': ['alert-success', 'Your opponent has no moveable pieces'],
        'nopieces-lose': ['alert-danger', 'You have no moveable pieces left'],
    };

    const [cls, text] = typeToText[type];
    header.addClass(cls).text(text);
    gameOverMessage.modal('show');
}

/**
 * Show a confirmation modal asking the player to forfeit the game.
 * @param {jQuery} forfeitPrompt - The modal DOM element for the confirmation prompt.
 * @param {(confirmed: boolean) => void} callback - Called with true if player confirms, false if canceled.
 */
export function showForfeitPrompt(forfeitPrompt, callback) {
    forfeitPrompt.one('click', '#cancel-forfeit', function () {
        callback(false);
        forfeitPrompt.modal('hide');
    });

    forfeitPrompt.one('click', '#confirm-forfeit', function () {
        callback(true);
        forfeitPrompt.modal('hide');
    });

    forfeitPrompt.modal('show');
}
