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
                INSERT INTO user (id, username, password, name, active, createdAt, updatedAt)
                    VALUES (10, 'john.doe', '${DEFAULT_PASSWORD_HASH}', 'John Doe', 1, NOW(), NOW());
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
                INSERT INTO user (id, username, password, name, active, createdAt, updatedAt)
                    VALUES (11, 'robert.smith', '${DEFAULT_PASSWORD_HASH}', 'Robert Smith', 1, NOW(), NOW());
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
                INSERT INTO user (id, username, password, name, active, hidden, createdAt, updatedAt)
                    VALUES (12, 'sarah.hidden', '${DEFAULT_PASSWORD_HASH}', 'Sarah Hidden', 1, 1, NOW(), NOW());
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
                INSERT INTO user (id, username, password, name, active, createdAt, updatedAt)
                    VALUES (13, 'mike.inactive', '${DEFAULT_PASSWORD_HASH}', 'Mike Inactive', 0, NOW(), NOW());
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
                    VALUES (1, 1, '2022-02-16T12:00:00', 'Lasagna', NOW(), NOW());
            `);
            cy.task('db:sql', `
                INSERT INTO lunch (event, pointsCost, vegetarianMoneyFactor, participationFlatRate, createdAt, updatedAt)
                    VALUES (1, 8, 0.75, NULL, NOW(), NOW());
            `);
        },
    },

    groceries: {
        id: 2,
        insert() {
            cy.task('db:sql', `
                INSERT INTO event (id, type, date, name, createdAt, updatedAt)
                    VALUES (2, 2, '2022-02-17T12:00:00', 'Groceries', NOW(), NOW());
            `);
            cy.task('db:sql', `
                INSERT INTO lunch (event, createdAt, updatedAt)
                    VALUES (2, NOW(), NOW());
            `);
        },
    },
};
