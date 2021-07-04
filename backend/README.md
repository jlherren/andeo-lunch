
# Database configuration

Create a file `config.json` and fill it with this for a MariaDB database:

    {
        "database": {
            "dialect": "mariadb",
            "host": "localhost",
            "database": "lunchmoney",
            "username": "lunchmoney",
            "password": "my-password"
        },
        "port": 3000,
        "host": "0.0.0.0"
    }

For development, you can also use sqlite:

    {
        "database": {
            "dialect": "sqlite",
            "storage": "andeolunch.db"
        },
        "port": 3000,
        "host": "0.0.0.0"
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

## Artificial lag

To make the backend artificially slow in order to simulate a slow network:

    {
        ...
        lag: 1000
    }
