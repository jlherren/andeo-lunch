const DEFAULT_PASSWORD_HASH = '$2a$10$EOq4EMCEzqoyWX.RezHdnuc/.oukv2lR2nVV1d8RyKVHMHwAq2/Wi';
const DEFAULT_PASSWORD = 'andeolunchtest';

export const USERS = {
    john: {
        username: 'john.doe',
        password: DEFAULT_PASSWORD,
        name:     'John Doe',
        insert() {
            cy.task('db:sql', `
                INSERT INTO user (username, password, name, active, createdAt, updatedAt)
                    VALUES ('john.doe', '${DEFAULT_PASSWORD_HASH}', 'John Doe', 1, NOW(), NOW());
            `);
        },
    },

    robert: {
        username: 'robert.smith',
        password: DEFAULT_PASSWORD,
        name:     'Robert Smith',
        insert() {
            cy.task('db:sql', `
                INSERT INTO user (username, password, name, active, createdAt, updatedAt)
                    VALUES ('robert.smith', '${DEFAULT_PASSWORD_HASH}', 'Robert Smith', 1, NOW(), NOW());
            `);
        },
    },

    sarah: {
        username: 'sarah.hidden',
        password: DEFAULT_PASSWORD,
        name:     'Sarah Hidden',
        insert() {
            cy.task('db:sql', `
                INSERT INTO user (username, password, name, active, hidden, createdAt, updatedAt)
                    VALUES ('sarah.hidden', '${DEFAULT_PASSWORD_HASH}', 'Sarah Hidden', 1, 1, NOW(), NOW());
            `);
        },
    },

    mike: {
        username: 'mike.inactive',
        password: DEFAULT_PASSWORD,
        name:     'Mike Inactive',
        insert() {
            cy.task('db:sql', `
                INSERT INTO user (username, password, name, active, createdAt, updatedAt)
                    VALUES ('mike.inactive', '${DEFAULT_PASSWORD_HASH}', 'Mike Inactive', 0, NOW(), NOW());
            `);
        },
    },
};

export const LUNCH = {
    lasagna: {
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
};

export const SPECIAL = {
    lasagna: {
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
