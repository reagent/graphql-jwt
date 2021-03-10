import path from 'path';
import fs from 'fs';

import { JWK } from 'node-jose';
import { gql, ApolloServer } from 'apollo-server-express';
import express from 'express';

import { DB } from './db';
import { GraphQLContext } from './types';
import { Token, BearerToken } from './token';

const jwksPath = path.resolve(__dirname, 'config', 'jwks.json');

const { public: publicKey, private: privateKey } = JSON.parse(
  fs.readFileSync(jwksPath, 'utf-8')
);

let pem: string;

JWK.asKey(privateKey, 'pem').then((value) => (pem = value.toPEM()));

const expireIn = (seconds: number): number => {
  return Math.floor(Date.now() / 1000) + seconds;
};

const assignCurrentUser: express.RequestHandler = (req, _resp, next) => {
  const token = new BearerToken(req.header('Authorization'));

  req.user = token.user;

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
  id: string;
  email: string;
};

class UnauthorizedError extends Error {
  constructor() {
    super('User not authorized');
  }
}

const resolvers = {
  Query: {
    currentUser: (
      _root: any,
      _input: any,
      context: GraphQLContext
    ): CurrentUser => {
      const { user } = context;

      if (!user?.isAuthorized()) {
        throw new UnauthorizedError();
      }

      const { id, email } = DB.find(user.userId());

      return { id, email };
    },
  },

  Mutation: {
    login: (
      _root: any,
      credentials: Credentials,
      context: GraphQLContext
    ): string | null => {
      const exp = expireIn(3600);
      const { user } = context;

      if (user?.isAuthorized()) {
        return Token.sign({ sub: user.userId(), exp }, pem);
      }

      const foundUser = DB.findByEmail(credentials.email);

      if (foundUser?.password !== credentials.password) {
        return null;
      }

      return Token.sign({ sub: foundUser.id, exp }, pem);
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req: { user } }): GraphQLContext => ({ user }),
});

const app = express();

app.use(assignCurrentUser);

server.applyMiddleware({ app });

export { app };
