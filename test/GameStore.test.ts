import { strict as assert } from 'assert';
import { GameStore } from '../src/lib/GameStore';
import { PlayerSession } from '../src/types';

describe('GameStore', function () {
  describe('#addAndRemoveGame()', function () {
    it('Add and remove game', function () {
      const gameStore = new GameStore();
      const gameKey1 = gameStore.add({
        playerName: '',
        playerColor: 'red'
      });
      assert.equal(Object.keys(gameStore.games).length, 1);
      const gameKey2 = gameStore.add({
        playerName: '',
        playerColor: 'red'
      });
      assert.equal(Object.keys(gameStore.games).length, 2);

      let status = gameStore.remove('unknown key');
      assert.equal(status, false);
      status = gameStore.remove(gameKey1);
      assert.equal(status, true);
      assert.equal(Object.keys(gameStore.games).length, 1);
      status = gameStore.remove(gameKey2);
      assert.equal(status, true);
      assert.equal(Object.keys(gameStore.games).length, 0);

      clearInterval(gameStore.intervalId);
    });
  });

  describe('#findGame()', function () {
    it('Find game', function () {
      const gameStore = new GameStore();
      const gameKey = gameStore.add({
        playerName: '',
        playerColor: 'red'
      });
      assert.notEqual(gameStore.find(gameKey), false);
      assert.equal(gameStore.find('unknown key'), false);

      clearInterval(gameStore.intervalId);
    });
  });

  describe('#listGame()', function () {
    it('List game', function () {
      const gameStore = new GameStore();
      const redPlayerSession: PlayerSession = {
        playerName: '',
        playerColor: 'red'
      };
      const gameKey = gameStore.add(redPlayerSession);
      const currentGame = gameStore.games[gameKey];
      currentGame.addPlayer(redPlayerSession);

      let gameIds = gameStore.list()
      assert.equal(gameIds.length, 1);
      assert.equal(gameIds[0], gameKey);

      // Game will be removed from GameStore if no players joined
      currentGame.removePlayer(redPlayerSession);

      gameIds = gameStore.list()
      assert.equal(gameIds.length, 0);

      clearInterval(gameStore.intervalId);
    });
  });
});
