
# Database configuration

Create a file `config.json` and fill it with this for a MySQL database:

    {
        "database": {
            "dialect": "mysql",
            "host": "localhost",
            "database": "lunchmoney",
            "username": "lunchmoney",
            "password": "my-password"
        },
        "port": 3000,
        "host": "0.0.0.0",
        "secret": "SOME_RANDOMLY_GENERATED_BASE_64_STRING_WITH_AT_LEAST_256_BITS"
    }

Or if sqlite is preferred:

    {
        "database": {
            "dialect": "sqlite",
            "storage": "lunchmoney.db"
        },
        "port": 3000,
        "host": "0.0.0.0",
        "secret": "SOME_RANDOMLY_GENERATED_BASE_64_STRING_WITH_AT_LEAST_256_BITS"
    }

Note that `host` is optional and defaults to `"0.0.0.0"`.

## Create tables

If the database is still empty, the following command will create all tables and defaults:

    yarn db:init

## Create a user

To create a new user:

    yarn db:createUser

# Yarn scripts

- `yarn serve` will launch the server.
- `yarn serve:watch` will launch the server and relaunch it every time a file
  changes, which is useful during development.
- `yarn test` runs the tests 
- `yarn test:watch` runs the tests and re-runs them every time a file changes,
  useful during debugging.
- `yarn lint` will run eslint and output all errors
- `yarn lint --fix` will fix all errors that eslint can fix by itself.
- `yarn db:rebuild` will rebuild all balances

# Development

## Database debugging

To log all SQL queries, you can enable logging in the config:

    {
        "database": {
            ...
            logSql: true
        }
    }
