import { Game, PlayerSession } from './Game';

export class GameStore {
  games: { [key: string]: Game };
  intervalId: ReturnType<typeof setInterval>;

  constructor() {
    this.games = {};

    // Periodically check for inactive games, and delete them
    this.intervalId = setInterval(games => {
      Object.keys(this.games).forEach(key => {
        if (Date.now() - games[key].modifiedOn > (12 * 60 * 60 * 1000)) {
          console.log("Deleting game " + key + ". No activity for atleast 12 hours.");
          delete games[key];
        }
      });
    }, (1 * 60 * 60 * 1000), this.games);
  }

  add(gameParams: PlayerSession): string {
    var key = '';
    var keyLength = 7;
    var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';

    // Generate a key until we get a unique one
    do {
      for (var i = 0; i < keyLength; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
      };
    } while (this.games.hasOwnProperty(key))

    // Create a new game and save using key
    this.games[key] = new Game(gameParams);

    return key;
  }

  remove(key: string): boolean {
    if (this.games.hasOwnProperty(key)) {
      delete this.games[key];
      return true;
    } else {
      return false;
    }
  }

  find(key: string) {
    return (this.games.hasOwnProperty(key)) ? this.games[key] : false;
  }

  list(): string[] {
    var listIDs: string[] = [];
    Object.keys(this.games).forEach(key => {
      //if the room is empty, then remove it from the list
      if (
        this.games[key].players[0].joined === false &&
        this.games[key].players[1].joined === false
      ) {
        delete this.games[key];
        return;
      }
      listIDs.push(key);
    });
    console.log(listIDs);
    return listIDs;
  };
}

module.exports = GameStore;
