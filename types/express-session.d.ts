// express-session.d.ts
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    gameID: string;
    playerName: string;
    playerColor: string | null;
    regenerate(callback?: (err: any) => void): void;
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    session: SessionData;
  }
}