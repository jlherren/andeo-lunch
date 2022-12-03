const {USERS} = require('../helpers/sql');

describe('Login', () => {
    beforeEach(() => {
        cy.task('db:purge');
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
        USERS.john.insert();
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
        USERS.john.insert();
        cy.login(USERS.john.username, USERS.john.password);
    });

    it('Hidden user can log in', () => {
        USERS.sarah.insert();
        cy.login(USERS.sarah.username, USERS.sarah.password);
    });

    it('Disabled user cannot log in', () => {
        USERS.mike.insert();
        cy.visit('/');
        cy.followLabel('Username')
            .type(USERS.mike.username);
        cy.followLabel('Password')
            .type(USERS.mike.password);
        cy.get('button[type=submit]')
            .click();
        cy.contains('Error: Invalid username or password');
    });
});
