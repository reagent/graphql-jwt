type User = {
  id: number;
  email: string;
  password: string;
};

interface Authenticatable {
  user(): User | null;
  isAuthorized(): boolean;
}

export { User, Authenticatable };
