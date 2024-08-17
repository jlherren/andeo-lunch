# Andeo Lunch

## Development quick start

1. Make sure you have Node 16+ and Yarn installed.

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

4. Install all dependencies:

       yarn install

5. In the directory `backend/`, run:

       bin/createUser      # This will prompt for a username & password
       yarn serve:watch    # Leave this running

6. In the directory `app/`, run:

       yarn serve          # Leave this running

7. Visit `http://localhost:8080/` (or whatever URL step 6 showed). You should be
   able to log in using the username and password you created in step 5.

## Full backend config reference

* `database` Configuration of the database to use. This is a sequelize config
  object.

    * `database.dialect` Type of database to use. In production only the
      value `"mariadb"` is supported, and for development `"sqlite"` is
      additionally supported.
    * (MariaDB only) `database.host` Hostname to connect to
    * (MariaDB only) `database.port` Port to connect to
    * (MariaDB only) `database.database` DB name
    * (MariaDB only) `database.username` Username
    * (MariaDB only) `database.password` Password
    * (SQLite only) `database.storage` Path to the SQLite database file.
    * `database.logSql` Enable SQL logging to the console.

  The MariaDB configuration may omit any of `database`, `username` or `password`
  if desired, in which case the following environment variables will be read,
  allowing for easy integration with docker:

    * MARIADB_HOST
    * MARIADB_PORT
    * MARIADB_DATABASE
    * MARIADB_USER
    * MARIADB_PASSWORD

  Additional, each of these with a _FILE suffix will also be checked, making it
  easy to use docker secrets.

* `port` Port to use, defaults to `3000`.
* `bind` Interface to bind to, defaults to `"127.0.0.1"`
* `lag` Artificial lag in milliseconds to delay each request. Allows simulating
  network lag. Practical hint: During development, set this to a small value
  like `100` to simulate a realistic network lag which allows to more easily see
  quirks it causes in the app.

## Root level scripts

Run these from the root directory.

- `yarn check` Performs various checks that should be run before committing,
  including:
    - Check for duplicate Yarn packages
    - Lint all the code
    - Run the backend tests

## Backend scripts

Run these from the `backend/` directory.

- `yarn serve` Launch backend
- `yarn serve:watch` Launch backend with auto-reload on file changes
- `yarn test` Run test suite using SQLite
- `yarn test:watch` Run test suite and re-run on every file change
- `yarn lint` Run linter
- `yarn lint:fix` Run linter and fix automatically
- `tests/run-tests-with-mariadb.sh` Run test suite using MariaDB

These are also available in production:

- `bin/createUser` Create a new user
- `bin/editUser` Edit a user
- `bin/rebuild` Rebuild all transactions and all balances
- `bin/setPaymentInfo` Set up payment information for a user
- `bin/validate` Validate the DB structure

## App scripts

Run these from the `app/` directory.

- `yarn serve` Launch development server (with auto-reload on file change)
- `yarn serve:public` Launch development server, binding to 0.0.0.0
- `yarn build` Create a development build into `dist/`
- `yarn lint` Run linter
- `yarn lint:fix` Run linter and fix automatically
- `yarn ui` Launch Vue UI

## Run cypress tests

Cypress tests are run against a full build running in docker images.

1. Build the docker images used for the Cypress tests:

       ./docker/build-docker-cypress.sh

2. Start the containers to obtain a fully functional Andeo Lunch instance:

       ./cypress/start-cypress-container.sh

3. Open the Cypress GUI

       yarn workspace andeo-lunch-cypress run cypress:open

Important: Modifications to tests will have effect immediately, but
modifications to the app or backend will not have effect and will require the
image to be re-build and re-started.

To shut down the docker containers again:

    ./cypress/stop-cypress-container.sh
