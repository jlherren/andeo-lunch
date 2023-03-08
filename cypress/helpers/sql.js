const DEFAULT_PASSWORD_HASH = '$2a$10$EOq4EMCEzqoyWX.RezHdnuc/.oukv2lR2nVV1d8RyKVHMHwAq2/Wi';
const DEFAULT_PASSWORD = 'andeolunchtest';

export const USERS = {
    john: {
        id:       10,
        username: 'john.doe',
        password: DEFAULT_PASSWORD,
        name:     'John Doe',
        insert() {
            cy.task('db:sql', `
                INSERT INTO user (id, username, name, active, createdAt, updatedAt)
                    VALUES (10, 'john.doe', 'John Doe', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
            `);
            cy.task('db:sql', `
                INSERT INTO userPassword (user, password, createdAt, updatedAt)
                    VALUES (10, '${DEFAULT_PASSWORD_HASH}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
            `);
        },
    },

    robert: {
        id:       11,
        username: 'robert.smith',
        password: DEFAULT_PASSWORD,
        name:     'Robert Smith',
        insert() {
            cy.task('db:sql', `
                INSERT INTO user (id, username, name, active, createdAt, updatedAt)
                    VALUES (11, 'robert.smith', 'Robert Smith', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
            `);
            cy.task('db:sql', `
                INSERT INTO userPassword (user, password, createdAt, updatedAt)
                    VALUES (11, '${DEFAULT_PASSWORD_HASH}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
            `);
        },
    },

    sarah: {
        id:       12,
        username: 'sarah.hidden',
        password: DEFAULT_PASSWORD,
        name:     'Sarah Hidden',
        insert() {
            cy.task('db:sql', `
                INSERT INTO user (id, username, name, active, hidden, createdAt, updatedAt)
                    VALUES (12, 'sarah.hidden', 'Sarah Hidden', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
            `);
            cy.task('db:sql', `
                INSERT INTO userPassword (user, password, createdAt, updatedAt)
                    VALUES (12, '${DEFAULT_PASSWORD_HASH}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
            `);
        },
    },

    mike: {
        id:       13,
        username: 'mike.inactive',
        password: DEFAULT_PASSWORD,
        name:     'Mike Inactive',
        insert() {
            cy.task('db:sql', `
                INSERT INTO user (id, username, name, active, createdAt, updatedAt)
                    VALUES (13, 'mike.inactive', 'Mike Inactive', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
            `);
            cy.task('db:sql', `
                INSERT INTO userPassword (user, password, createdAt, updatedAt)
                    VALUES (13, '${DEFAULT_PASSWORD_HASH}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
            `);
        },
    },
};

export const EVENTS = {
    lasagna: {
        id: 1,
        insert() {
            cy.task('db:sql', `
                INSERT INTO event (id, type, date, name, createdAt, updatedAt)
                    VALUES (1, 1, '2022-02-16T12:00:00', 'Lasagna', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
            `);
            cy.task('db:sql', `
                INSERT INTO lunch (event, pointsCost, vegetarianMoneyFactor, participationFlatRate, createdAt, updatedAt)
                    VALUES (1, 8, 0.75, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
            `);
        },
    },

    groceries: {
        id: 2,
        insert() {
            cy.task('db:sql', `
                INSERT INTO event (id, type, date, name, createdAt, updatedAt)
                    VALUES (2, 2, '2022-02-17T12:00:00', 'Groceries', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
            `);
            cy.task('db:sql', `
                INSERT INTO lunch (event, createdAt, updatedAt)
                    VALUES (2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
            `);
        },
    },
};
