import { Authenticatable, UserRecord } from './types';
import jwt from 'jsonwebtoken';

import { DB } from './db';

type JWT = {
  sub: string;
  exp: number;
};

type DecodedJWT = {
  sub: string;
  iat: number;
  exp?: number;
};

class Token {
  constructor(readonly jwt: JWT) {}

  static sign(jwt: JWT, key: string): string {
    return new Token(jwt).sign(key);
  }

  sign(privateKey: string): string {
    return jwt.sign(this.jwt, privateKey);
  }
}

class EncodedToken {
  constructor(private readonly value: string) {}

  get decoded(): DecodedJWT | null {
    // TODO: jwt.verify w/ key
    const decoded = jwt.decode(this.value);

    if (!decoded || !(decoded instanceof Object)) {
      return null;
    }

    return {
      sub: decoded.sub,
      iat: decoded.iat,
      exp: decoded.exp,
    };
  }
}

class User implements Authenticatable {
  constructor(private readonly record: UserRecord) {}

  userId(): string {
    return this.record.id;
  }

  isAuthorized(): boolean {
    return true;
  }
}

class BearerToken {
  private _user?: User | null;

  constructor(private readonly rawToken: string | undefined) {}

  get user(): User | null {
    if (this._user === undefined) {
      const decoded = this.token?.decoded;

      this._user = null;

      if (decoded) {
        const record = DB.find(decoded.sub);

        if (record) {
          this._user = new User(record);
        }
      }
    }

    return this._user;
  }

  get token(): EncodedToken | null {
    let token: EncodedToken | null = null;

    const pattern = /^Bearer\s+(?<token>.+)$/;
    const match = this.rawToken?.match(pattern);

    if (match) {
      token = new EncodedToken(match.groups!.token);
    }

    return token;
  }
}

export { Token, EncodedToken, BearerToken };
