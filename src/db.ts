import { UserRecord } from './types';

type Records = {
  users: UserRecord[];
};

class RecordNotFoundError extends Error {
  constructor(id: string) {
    super(`Record not found for id=${id}`);
  }
}

class Datastore {
  private records: Records = {
    users: [
      { id: '1', email: 'user@host.example', password: 'password' },
      { id: '2', email: 'other@host.example', password: 'password' },
    ],
  };

  find(id: string): UserRecord {
    const record = this.records.users.find((u) => u.id === id);

    if (!record) {
      throw new RecordNotFoundError(id);
    }

    return record;
  }

  findByEmail(email: string): UserRecord | null {
    return this.records.users.find((u) => u.email === email) || null;
  }
}

const DB = new Datastore();

export { DB };
