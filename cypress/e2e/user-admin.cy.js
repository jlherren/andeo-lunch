const {USERS} = require('../helpers/sql');

describe('User admin', () => {
    beforeEach(() => {
        cy.task('db:purge');
        USERS.john.insert();
        USERS.anna.insert();
        cy.login(USERS.anna.username, USERS.anna.password);
        cy.get('.v-app-bar button')
            .click();
        cy.contains('a', 'Admin')
            .click();
        cy.contains('[role=listitem]', 'Users')
            .click();
    });

    it('Create user', () => {
        cy.contains('header button', 'Add')
            .click();
        cy.followLabel('Username')
            .type('nora.new');
        cy.followLabel('Display name')
            .type('Nora New');
        cy.followLabel('Password')
            .type('password');
        cy.contains('header button', 'Save')
            .click();

        cy.logout();
        cy.login('nora.new', 'password');
    });

    it('Edit user', () => {
        cy.contains('tr', 'John Doe')
            .click();
        cy.followLabel('Display name')
            .type('{selectall}John Miller');
        cy.contains('label', 'Active')
            .click();
        cy.contains('label', 'Hidden')
            .click();
        cy.contains('header button', 'Save')
            .click();
        cy.contains('tr', 'John Miller')
            .within(() => {
                cy.contains('Inactive');
                cy.contains('Hidden');
            });
    });

    it('Reset password', () => {
        cy.contains('tr', 'John Doe')
            .click();
        cy.contains('a', 'Reset password')
            .click();
        cy.followLabel('New password for John Doe')
            .type('Qwe12345_');
        cy.followLabel('Own password')
            .type(USERS.anna.password);
        cy.contains('header button', 'Reset password')
            .click();
        cy.contains('Password reset successfully');

        cy.logout();
        cy.login(USERS.john.username, 'Qwe12345_');
    });
});
