export const USERS = {
    john: {
        username: 'john.doe',
        password: 'andeolunchtest',
        name:     'John Doe',
        insert() {
            cy.task('db:sql', `
                INSERT INTO user (username, password, name, active, createdAt, updatedAt)
                    VALUES ('john.doe', '$2a$10$EOq4EMCEzqoyWX.RezHdnuc/.oukv2lR2nVV1d8RyKVHMHwAq2/Wi', 'John Doe', 1, NOW(), NOW());
            `);
        },
    },

    robert: {
        username: 'robert.smith',
        password: 'andeolunchtest',
        name:     'Robert Smith',
        insert() {
            cy.task('db:sql', `
                INSERT INTO user (username, password, name, active, createdAt, updatedAt)
                    VALUES ('robert.smith', '$2a$10$EOq4EMCEzqoyWX.RezHdnuc/.oukv2lR2nVV1d8RyKVHMHwAq2/Wi', 'Robert Smith', 1, NOW(), NOW());
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
}

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
