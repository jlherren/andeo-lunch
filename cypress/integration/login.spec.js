const enterUserName = () => {
    return cy.get('label')
        .contains('Username')
        .siblings()
        .first()
        .type('john.doe');
};

const pressLoginButton = () => {
    return cy.get('button[type=submit]')
        .should('not.be.disabled')
        .click();
};

describe('login', () => {
    before(() => {
        cy.task('db:purge');
        cy.task('db:sql', `
            INSERT INTO user (id, username, password, name, active, createdAt, updatedAt)
                VALUES (2, 'john.doe', '$2a$10$EOq4EMCEzqoyWX.RezHdnuc/.oukv2lR2nVV1d8RyKVHMHwAq2/Wi', 'John Doe', 1, NOW(), NOW());
        `);
    });

    it('Disables Login button when not entering a password.', () => {
        cy.visit('/');
        cy.get('label')
            .contains('Username')
            .siblings()
            .first()
            .type('Random UserName.');

        cy.get('button[type=submit]')
            .should('be.disabled');
    });

    it('Provides feedback for incorrect credentials', () => {
        cy.visit('/');

        enterUserName();

        cy.get('label')
            .contains('Password')
            .siblings()
            .first()
            .type('Password');

        pressLoginButton();

        cy.get('#app')
            .should('contain.text', 'Error: Invalid username or password ');
    });

    it('Successfully logs in with correct credentials', () => {
        cy.visit('/');

        enterUserName();

        cy.get('label')
            .contains('Password')
            .siblings()
            .first()
            .type('andeolunchtest');

        pressLoginButton();

        cy.get('#app').should('contain.text', 'John Doe');

        cy.window().then(window => {
            // eslint-disable-next-line no-unused-expressions
            expect(window.localStorage.getItem('token')).to.not.be.empty;
            Cypress.env('token', window.localStorage.getItem('token'));
        });
    });
});
