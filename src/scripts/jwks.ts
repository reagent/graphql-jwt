import path from 'path';
import fs from 'fs';

import { JWK } from 'node-jose';

const store = JWK.createKeyStore();

const jwksPath = path.resolve(__dirname, '..', 'config', 'jwks.json');

store.generate('RSA', 2048, { alg: 'RS256', use: 'sig' }).then((keys) => {
  const config = {
    public: keys.toJSON(),
    private: keys.toJSON(true),
  };

  fs.writeFileSync(jwksPath, JSON.stringify(config, null, 2));
});
