// import { Authenticatable } from '../../src/types';

const { Authenticatable } = require('../../src/types');

// declare global {
//   declare module 'express' {
//     export interface Request {
//       user?: { id: number };
//     }
//   }
// }

// declare module 'express' {
//   interface Request {
//     user?: { id: number };
//   }
// }

declare namespace Express {
  interface Request {
    user: Authenticatable;
  }
}
