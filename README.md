# Andeo Lunch

## Quick start

1. Make sure you have node 14+ and yarn.

2. Create a file `backend/config.json` with this content:

       {
            "database": {
                "dialect": "sqlite",
                "storage": "andeolunch.db"
            }
        }

3. Create a file `app/.env` with this content:

       VUE_APP_BACKEND_URL=http://127.0.0.1:3000/api
       VUE_APP_BRANDING_TITLE="Andeo Lunch (DEV)"

4. In the directory `backend`, run:

       yarn install
       yarn db:init
       yarn db:createUser  # This will prompt for a username & password
       yarn serve:watch

5. In the directory `app`, run:

       yarn install
       yarn serve

6. Visit `http://localhost:8080/` (or whatever URL step 5 showed).  You should be able to log in
   using the username and password you created in step 4.
   
## Cypress setup

1. Navigate to the `app` directory
2. If you haven't already, install Cypress on your local machine by running: 

       yarn run cypress install

4. Create a `cypress.env.json` file where you add this content, replacing "TestUserName" 
   and "TestUserPassword" with the values you entered when running `db:createUser`:

        {
            "username": "TestUserName",
            "password": "TestUserPassword"
        }

3. Open the test runner with

       yarn run cypress open

4. Furthermore, you can run the test in the command line

       yarn run cypress run

## Full backend config reference

* `database` Configuration of the database to use. This is a sequelize config object.

   * `database.dialect` Type of database to use. In production only the value `"mariadb"` is
     supported, and for development `"sqlite"` is additionally supported.
   * (MariaDB only) `database.host` Hostname to connect to
   * (MariaDB only) `database.database` DB name
   * (MariaDB only) `database.username` Username
   * (MariaDB only) `database.password` Password
   * (SQLite only) `database.storage` Path to the SQLite database file.
   * `database.logSql` Enable SQL logging to the console.

  The MariaDB configuration may omit any of `database`, `username` or `password` if desired, in
  which case the following environment variables will be read, allowing for easy integration with
  docker:

   * MARIADB_DATABASE
   * MARIADB_USER
   * MARIADB_PASSWORD

  Additional, each of these with a _FILE suffix will also be checked, making it easy to use docker secrets.

* `port` Port to use, defaults to `3000`.
* `bind` Interface to bind to, defaults to `"127.0.0.1"`
* `lag` Artificial lag in milliseconds to delay each request. Allows to simulate a bad network.

## Backend scripts

- `yarn serve` Launch backend
- `yarn serve:watch` Launch backend with auto-reload on file changes
- `yarn test` Run test suite
- `yarn test:watch` Run test suite and re-run on every file change
- `yarn lint` Run linter
- `yarn lint:fix` Run linter and fix automatically
- `yarn yarn-deduplicate` Run yarn package deduplicator
- `yarn db:init` Initialize an empty database. Note: This will do mostly nothing if already
  initialized.
- `yarn db:update` Re-initialize the database, trying to update out-of-date structure. Note that
  it's a bit flaky.  **CURRENTLY BUGGY DUE TO A SEQUELIZE BUG**
- `yarn db:createUser` Create a new user
- `yarn db:rebuild` Rebuild all transactions and all balances

## App scripts

- `yarn serve` Launch development server (with auto-reload on file change)
- `yarn serve:public` Launch development server, binding to 0.0.0.0
- `yarn build` Create a development build into `dist/`
- `yarn lint` Run linter
- `yarn lint:fix` Run linter and fix automatically
- `yarn yarn-deduplicate` Run yarn package deduplicator
- `yarn ui` Launch Vue UI
