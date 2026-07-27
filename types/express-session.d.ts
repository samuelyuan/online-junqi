// @types/express-session already augments express.Request.session globally as
// `Session & Partial<SessionData>`, so only SessionData itself needs extending here.
import 'express-session';
import { SessionData as AppSessionData } from '../src/types';

declare module 'express-session' {
  interface SessionData extends AppSessionData {}
}