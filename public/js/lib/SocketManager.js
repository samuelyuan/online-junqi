class SocketManager {
    constructor() {
        this.socket = null;
        this.listeners = {};
    }

    connect(gameID) {
        this.socket = io.connect();
        this.socket.emit('join', gameID);

        this.socket.on('update', (data) => {
            this._trigger('update', data);
        });

        this.socket.on('error', (data) => {
            this._trigger('error', data);
        });
    }

    // External modules can subscribe to socket events
    on(eventName, callback) {
        this.listeners[eventName] = callback;
    }

    _trigger(eventName, data) {
        if (this.listeners[eventName]) {
            this.listeners[eventName](data);
        }
    }

    sendMove(gameID, moveString) {
        this.socket.emit('move', { gameID, move: moveString });
    }

    finishSetup(gameID) {
        this.socket.emit('finishSetup', gameID);
    }

    forfeit(gameID) {
        this.socket.emit('forfeit', gameID);
    }
}

export default SocketManager;
