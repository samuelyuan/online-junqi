import {
  Piece,
  RANK_BOMB,
  RANK_ENGINEER,
  RANK_LANDMINE,
  RANK_FLAG,
} from './Piece';

export class BoardGenerator {
    generateBoard() {
        return {
            a12: new Piece('r', RANK_LANDMINE), b12: new Piece('r', RANK_FLAG), c12: new Piece('r', RANK_LANDMINE), d12: new Piece('r', RANK_BOMB), e12: new Piece('r', RANK_BOMB),
            a11: new Piece('r', RANK_ENGINEER), b11: new Piece('r', RANK_LANDMINE), c11: new Piece('r', RANK_ENGINEER), d11: new Piece('r', '2'), e11: new Piece('r', RANK_ENGINEER),
            a10: new Piece('r', '6'), b10: null, c10: new Piece('r', '6'), d10: null, e10: new Piece('r', '5'),
            a9: new Piece('r', '1'), b9: new Piece('r', '3'), c9: null, d9: new Piece('r', '3'), e9: new Piece('r', '5'),
            a8: new Piece('r', '8'), b8: null, c8: new Piece('r', '8'), d8: null, e8: new Piece('r', '8'),
            a7: new Piece('r', '7'), b7: new Piece('r', '7'), c7: new Piece('r', '7'), d7: new Piece('r', '4'), e7: new Piece('r', '4'),
            a6: new Piece('b', '7'), b6: new Piece('b', '2'), c6: new Piece('b', '7'), d6: new Piece('b', '3'), e6: new Piece('b', '7'),
            a5: new Piece('b', '4'), b5: null, c5: new Piece('b', '5'), d5: null, e5: new Piece('b', '4'),
            a4: new Piece('b', '8'), b4: new Piece('b', '3'), c4: null, d4: new Piece('b', '1'), e4: new Piece('b', '8'),
            a3: new Piece('b', '6'), b3: null, c3: new Piece('b', '8'), d3: null, e3: new Piece('b', '5'),
            a2: new Piece('b', RANK_ENGINEER), b2: new Piece('b', RANK_LANDMINE), c2: new Piece('b', RANK_LANDMINE), d2: new Piece('b', RANK_ENGINEER), e2: new Piece('b', RANK_ENGINEER),
            a1: new Piece('b', RANK_BOMB), b1: new Piece('b', RANK_FLAG), c1: new Piece('b', RANK_LANDMINE), d1: new Piece('b', RANK_BOMB), e1: new Piece('b', '6')
        }
    }
}