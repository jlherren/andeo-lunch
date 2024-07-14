import {USERS} from '../helpers/sql';

describe('Profile', () => {
    before(() => {
        cy.task('db:purge');
        USERS.john.insert();
        cy.login(USERS.john.username, USERS.john.password);
    });

    it('Change password', () => {
        const NEW_PASSWORD = 's3cr3t!';

        cy.visit('/');
        cy.get('.v-app-bar button')
            .click();
        cy.contains('a', 'Account settings')
            .click();
        cy.contains('a', 'Change password')
            .click();
        cy.followLabel('Current password')
            .type(USERS.john.password);
        cy.followLabel('New password')
            .type(NEW_PASSWORD);
        cy.followLabel('Confirm new password')
            .type(NEW_PASSWORD);
        cy.contains('button', 'Save')
            .click();

        cy.contains('[role=status]', 'Password changed successfully!')
            .should('be.visible');

        cy.contains('[role=listitem]', 'Logout')
            .click();

        cy.getDialog()
            .within(() => {
                cy.contains('button', 'Yes, logout')
                    .click();
            });

        cy.contains('[role=status]', 'You have been logged out')
            .should('be.visible');

        // Should be back at the login screen.
        cy.contains('label', 'Username');

        cy.login(USERS.john.username, NEW_PASSWORD);
        cy.contains('.v-app-bar', USERS.john.name);
    });
});
