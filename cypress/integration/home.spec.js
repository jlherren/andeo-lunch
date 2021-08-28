const {USERS} = require('../helpers/sql');

describe('Home screen', () => {
    before(() => {
        cy.task('db:purge');
        USERS.john.insert();
    });

    it('Contains all expected elements', () => {
        cy.login(USERS.john.username, USERS.john.password);
        cy.contains('header', 'John Doe');
        cy.contains('main', 'Your balance');
        cy.contains('main', 'Next 7 days');
        cy.contains('main', 'No upcoming events');
        cy.contains('.v-bottom-navigation a', 'Home');
        cy.contains('.v-bottom-navigation a', 'Calendar');
        cy.contains('.v-bottom-navigation a', 'Transfers');
        cy.contains('.v-bottom-navigation a', 'Stats');
    });
});
