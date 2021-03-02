import path from 'path';
import fs from 'fs';

import jwt from 'jsonwebtoken';

import { JWK } from 'node-jose';
import { gql, ApolloServer } from 'apollo-server-express';
import express from 'express';

import { Authenticatable, User } from './types';

const jwksPath = path.resolve(__dirname, 'config', 'jwks.json');

const { public: publicKey, private: privateKey } = JSON.parse(
  fs.readFileSync(jwksPath, 'utf-8')
);

let pem: string;

type CTX = {
  user: Authenticatable;
};

JWK.asKey(privateKey, 'pem').then((value) => (pem = value.toPEM()));

type DB = {
  users: User[];
};

const db: DB = {
  users: [
    { id: 1, email: 'user@host.example', password: 'password' },
    { id: 2, email: 'other@host.example', password: 'password' },
  ],
};

type JWT = {
  sub: number;
  iat: number;
};

class JWTUser implements Authenticatable {
  constructor(readonly _user: User) {}

  user(): User {
    return this._user;
  }

  isAuthorized(): boolean {
    return !!this.user;
  }
}

class NullUser implements Authenticatable {
  user(): null {
    return null;
  }

  isAuthorized(): boolean {
    return false;
  }
}

class EncodedToken {
  // ??
  constructor(private readonly encoded: string) {}

  // decoded ...
}

const assignCurrentUser: express.RequestHandler = (req, _resp, next) => {
  req.user = new NullUser(); // default user

  const authorization = req.header('Authorization');

  if (authorization) {
    const [_, token] = authorization.split(/\s+/);

    if (token) {
      const decoded = jwt.decode(token);

      if (decoded) {
        const record = db.users.find((u) => u.id === decoded.sub);

        if (record) {
          req.user = new JWTUser(record);
        }
      }
    }
  }

  next();
};

const typeDefs = gql`
  type User {
    id: ID!
    email: String!
  }

  input Credentials {
    email: String!
    password: String!
  }

  type Query {
    currentUser: User!
  }

  type Mutation {
    login(email: String!, password: String!): String
  }
`;

// Duplicate types / need to clean up
type Credentials = {
  email: string;
  password: string;
};

type CurrentUser = {
  id: number;
  email: string;
};

class UnauthorizedError extends Error {
  constructor() {
    super('User not authorized');
  }
}

const resolvers = {
  Query: {
    currentUser: (_: any, _b: any, context: CTX): CurrentUser => {
      const { user } = context;

      if (!user.isAuthorized()) {
        throw new UnauthorizedError();
      }

      return user.user()!; // ugh
    },
  },

  Mutation: {
    login: (_: any, credentials: Credentials): string | undefined => {
      const user = db.users.find(
        (u) =>
          u.email === credentials.email && u.password === credentials.password
      );

      if (!user) {
        return;
      }

      return jwt.sign({ sub: user.id }, pem);
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req: { user } }): CTX => ({ user }),
});

const app = express();

app.use(assignCurrentUser);

server.applyMiddleware({ app });

export { app };
