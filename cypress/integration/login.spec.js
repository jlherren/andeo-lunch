const {USERS} = require('../helpers/sql');

describe('login', () => {
    before(() => {
        cy.task('db:purge');
        USERS.john.insert();
    });

    it('Disables login button when not entering a password', () => {
        cy.visit('/');
        cy.followLabel('Username')
            .type('random.username');
        cy.get('button[type=submit]')
            .should('be.disabled');
    });

    it('Disables login button when not entering a username', () => {
        cy.visit('/');
        cy.followLabel('Password')
            .type('random.password');
        cy.get('button[type=submit]')
            .should('be.disabled');
    });

    it('Provides feedback for incorrect credentials', () => {
        cy.visit('/');
        cy.followLabel('Username')
            .type(USERS.john.username);
        cy.followLabel('Password')
            .type('wrong-password');
        cy.get('button[type=submit]')
            .click();
        cy.contains('Error: Invalid username or password');
    });

    it('Successfully logs in with correct credentials', () => {
        cy.login(USERS.john.username, USERS.john.password);
    });
});
