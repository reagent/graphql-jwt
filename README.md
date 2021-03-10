# GraphQL JWT Example

Basic example demonstrating generation of a JWT after a successful login and
attaching of an authenticated user to the GraphQL context. This example DOES
NOT handle verification (key and issuer) of the client-supplied JWT, and should
not be used as-is.

## Setup

```
$ yarn install && yarn start:dev
```

The server will be running on port `4000` and you can connect to the [GraphQL
playground][1].

## Usage

The application exposes both a GraphQL mutation and a resolver to simuluate a
user logging in and receiving a signed JWT, and then using the provided JWT to
get the currently logged-in user record.

Using cURL, we can attempt to check for the current user without providing a
JWT:

```
curl -s \
  -H "Content-Type: application/json" \
  -d '{"query": "query { currentUser { id } }"}' \
  "http://localhost:4000/graphql" | jq .
```

Which will return an unauthorized error as expected:

```
{
  "errors": [
    {
      "message": "User not authorized",
      "locations": [
        {
          "line": 1,
          "column": 9
        }
      ],
      "path": [
        "currentUser"
      ],
      ...
    }
  ],
  "data": null,
}
```

Providing valid user credentials will return a signed JWT:

```
curl -s \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { login(email:\"user@host.example\",password:\"password\") }"}' \
  "http://localhost:4000/graphql" | jq .

{
  "data": {
    "login": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZXhwIjoxNjE1NDAzOTA0LCJpYXQiOjE2MTU0MDAzMDR9.fA-D7MFDJuBU9YOKVck8NE7C0HO2PeVikER7DoKIOvs"
  }
}
```

We can then turn around and use this JWT in the `Authorization` header to fetch
the current user:

```
curl -s \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZXhwIjoxNjE1NDAzOTA0LCJpYXQiOjE2MTU0MDAzMDR9.fA-D7MFDJuBU9YOKVck8NE7C0HO2PeVikER7DoKIOvs" \
  -d '{"query": "query { currentUser { id, email } }"}' \
  "http://localhost:4000/graphql" | jq .

{
  "data": {
    "currentUser": {
      "id": "1",
      "email": "user@host.example"
    }
  }
}
```

[1]: http://localhost:4000/graphql
