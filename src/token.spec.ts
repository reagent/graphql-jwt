import faker from 'faker';
import jwt from 'jsonwebtoken';

import { BearerToken, EncodedToken, Token } from './token';

const key = faker.random.uuid(); // We just need a value for signing JWTs
const exp = Math.floor(Date.now() / 1000) + 3600; // Unix timestamp

describe(EncodedToken.name, () => {
  describe('decoded', () => {
    it('returns `null` when given an invalid JWT', () => {
      const subject = new EncodedToken('asdf');
      expect(subject.decoded).toBeNull();
    });

    it('returns the decoded token', () => {
      const token = jwt.sign({ sub: '1' }, key);
      const subject = new EncodedToken(token);

      expect(subject.decoded).toMatchObject({ sub: '1' });
    });
  });
});

describe(Token.name, () => {
  describe('sign()', () => {
    it('can sign the provided JWT', () => {
      const subject = new Token({ sub: '1', exp });
      const token = subject.sign(key);

      expect(jwt.decode(token)).toMatchObject({ sub: '1', exp: exp });
    });
  });
});

describe(BearerToken.name, () => {
  describe('token', () => {
    it('is null when there is no token', () => {
      const subject = new BearerToken(undefined);
      expect(subject.token).toBeNull();
    });

    it("is null when the token isn't a bearer token", () => {
      const subject = new BearerToken('Unknown d34db33f');
      expect(subject.token).toBeNull();
    });

    it('is null when the token is invalid', () => {
      const subject = new BearerToken('Bearer d34db33f');
      expect(subject.token?.decoded).toBeNull();
    });

    it('returns a decoded JWT when valid', () => {
      const token = jwt.sign({ sub: '1', exp }, key);
      const subject = new BearerToken(`Bearer ${token}`);

      expect(subject.token?.decoded).toMatchObject({ sub: '1', exp: exp });
    });
  });

  describe('user', () => {
    it('is null when there is no token', () => {
      const subject = new BearerToken(undefined);
      expect(subject.user).toBeNull();
    });

    it("is null when the JWT doesn't match an existing user", () => {
      const token = jwt.sign({ sub: 'asdf' }, key);

      const subject = new BearerToken(`Bearer ${token}`);
      expect(subject.user).toBeNull();
    });

    it('returns a matching user', () => {
      // using magic number for user ID -- not ideal
      const token = jwt.sign({ sub: '1' }, key);
      const subject = new BearerToken(`Bearer ${token}`);

      expect(subject.user).toEqual({
        id: '1',
        email: 'user@host.example',
        password: 'password',
      });
    });

    //   it('is null when the token is invalid', () => {});

    //   it('returns a user when the token is valid', () => {});
  });
});
