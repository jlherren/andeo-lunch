const {USERS} = require('../helpers/sql');

describe('Misc', () => {
    before(() => {
        cy.task('db:purge');
        USERS.john.insert();
    });

    beforeEach(() => {
        cy.login(USERS.john.username, USERS.john.password);
    });

    it('View about page', () => {
        cy.visit('/');
        cy.get('.v-app-bar button')
            .click();
        cy.contains('a', 'About')
            .click();

        cy.contains('About Andeo Lunch')
            .should('be.visible');
        cy.contains('GNU General Public License')
            .should('be.visible');
        cy.contains('WITHOUT ANY WARRANTY')
            .should('be.visible');
    });
});
