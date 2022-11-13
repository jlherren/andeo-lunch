const {USERS} = require('../helpers/sql');

describe('Profile', () => {
    beforeEach(() => {
        cy.task('db:purge');
        USERS.john.insert();
        cy.login(USERS.john.username, USERS.john.password);
    });

    it('Default is undecided', () => {
        cy.visit('/');
        cy.get('.v-app-bar button')
            .click();
        cy.contains('a', 'Preferences')
            .click();
        cy.contains('a', 'Default opt-in')
            .click();

        for (let weekday of 'Monday Tuesday Wednesday Thursday Friday'.split(' ')) {
            cy.contains('div', weekday)
                .find('button[value=undecided]')
                .should('have.class', 'v-btn--active');
        }

        cy.contains('.v-input', 'Quick opt-in as vegetarian')
            .find('input[type=checkbox]')
            .should('not.be.checked');
    });

    it('Can set options', () => {
        cy.visit('/');
        cy.get('.v-app-bar button')
            .click();
        cy.contains('a', 'Preferences')
            .click();
        cy.contains('a', 'Default opt-in')
            .click();

        cy.contains('div', 'Monday')
            .find('button[value=omnivorous]')
            .click();
        cy.contains('div', 'Tuesday')
            .find('button[value=vegetarian]')
            .click();
        cy.contains('div', 'Wednesday')
            .find('button[value=opt-out]')
            .click();
        cy.contains('div', 'Thursday')
            .find('button[value=undecided]')
            .click();

        cy.contains('label', 'Quick opt-in as vegetarian')
            .click();

        cy.contains('button', 'Save')
            .click();

        cy.contains('a', 'Default opt-in')
            .click();

        cy.contains('div', 'Monday')
            .find('button[value=omnivorous]')
            .should('have.class', 'v-btn--active');
        cy.contains('div', 'Tuesday')
            .find('button[value=vegetarian]')
            .should('have.class', 'v-btn--active');
        cy.contains('div', 'Wednesday')
            .find('button[value=opt-out]')
            .should('have.class', 'v-btn--active');
        cy.contains('div', 'Thursday')
            .find('button[value=undecided]')
            .should('have.class', 'v-btn--active');
        cy.contains('div', 'Friday')
            .find('button[value=undecided]')
            .should('have.class', 'v-btn--active');
        cy.contains('.v-input', 'Quick opt-in as vegetarian')
            .find('input[type=checkbox]')
            .should('be.checked');
    });
});
