# Andeo Lunch

## Development quick start

1. Make sure you have Node 14+ and Yarn installed.

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

       yarn

5. In the directory `backend/`, run:

       yarn db:init
       yarn db:createUser  # This will prompt for a username & password
       yarn serve:watch    # Leave this running

6. In the directory `app/`, run:

       yarn serve          # Leave this running

7. Visit `http://localhost:8080/` (or whatever URL step 6 showed).  You should be able to log in
   using the username and password you created in step 5.

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
* `lag` Artificial lag in milliseconds to delay each request. Allows simulating network lag.  Practical hint: During
  development, set this to a small value like `100` to simulate a realistic network lag which allows to more easily see
  quirks it causes in the app.

## Backend scripts

Run these from the `backend/` folder.

- `yarn serve` Launch backend
- `yarn serve:watch` Launch backend with auto-reload on file changes
- `yarn test` Run test suite using SQLite
- `yarn test:mariadb` Run test suite using MariaDB (this requires some environment variables to work)
- `yarn test:watch` Run test suite and re-run on every file change
- `yarn lint` Run linter
- `yarn lint:fix` Run linter and fix automatically
- `yarn db:createUser` Create a new user
- `yarn db:editUser` Edit a user
- `yarn db:init` Initialize the database by creating all tables and essential data.
  Note: This will do mostly nothing if already initialized.
- `yarn db:rebuild` Rebuild all transactions and all balances
- `yarn db:setPaymentInfo` Set up payment information for a user
- `yarn db:update` Re-initialize the database, trying to update any out-of-date structure. Note that
  it's a bit flaky.  **CURRENTLY BUGGY DUE TO A SEQUELIZE BUG**

## App scripts

Run these from the `app/` folder.

- `yarn serve` Launch development server (with auto-reload on file change)
- `yarn serve:public` Launch development server, binding to 0.0.0.0
- `yarn build` Create a development build into `dist/`
- `yarn lint` Run linter
- `yarn lint:fix` Run linter and fix automatically
- `yarn ui` Launch Vue UI
