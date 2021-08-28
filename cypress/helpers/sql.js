export const USERS = {
    john: {
        username: 'john.doe',
        password: 'andeolunchtest',
        insert() {
            cy.task('db:sql', `
                INSERT INTO user (id, username, password, name, active, createdAt, updatedAt)
                    VALUES (2, 'john.doe', '$2a$10$EOq4EMCEzqoyWX.RezHdnuc/.oukv2lR2nVV1d8RyKVHMHwAq2/Wi', 'John Doe', 1, NOW(), NOW());
            `);
        },
    },
};
