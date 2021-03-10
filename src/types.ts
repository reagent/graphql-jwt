type UserRecord = {
  id: string;
  email: string;
  password: string;
};

interface Authenticatable {
  userId(): string;
  isAuthorized(): boolean;
}

type GraphQLContext = {
  user?: Authenticatable;
};

export { UserRecord, Authenticatable, GraphQLContext };
