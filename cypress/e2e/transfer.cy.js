const {USERS} = require('../helpers/sql');

describe('Transfers', () => {
    before(() => {
        cy.task('db:purge');
        USERS.john.insert();
        USERS.robert.insert();
    });

    it('Can create an expense', () => {
        cy.login(USERS.john.username, USERS.john.password);
        cy.contains('.v-bottom-navigation a', 'Transfers')
            .click();
        cy.get('.v-btn--fab')
            .click();
        cy.contains('Log an expense')
            .click();
        cy.contains('[role=button]', 'At the expense of')
            .click();
        cy.contains('[role=option]', USERS.robert.name)
            .click();
        cy.followLabel('Amount in CHF')
            .type('10.50');
        cy.followLabel('Reason')
            .type('Burger King');
        cy.contains('button', 'Save')
            .click();

        cy.contains('[role=listitem]', 'Robert Smith → John Doe')
            .contains('10.50');
    });

    it('Can create a virtual money transfer', () => {
        cy.login(USERS.john.username, USERS.john.password);
        cy.contains('.v-bottom-navigation a', 'Transfers')
            .click();
        cy.get('.v-btn--fab')
            .click();
        cy.contains('Virtual money or point transfer')
            .click();
        cy.contains('[role=button]', 'Recipient')
            .click();
        cy.contains('[role=option]', USERS.robert.name)
            .click();
        cy.followLabel('Amount')
            .type('5');
        cy.followLabel('Reason')
            .type('Points as a gift');
        cy.contains('button', 'Save')
            .click();

        cy.contains('[role=listitem]', 'John Doe → Robert Smith')
            .contains('5.00');
    });

    it('Can create a pay up transfer', () => {
        cy.login(USERS.john.username, USERS.john.password);
        cy.contains('.v-bottom-navigation a', 'Transfers')
            .click();
        cy.get('.v-btn--fab')
            .click();
        cy.contains('Pay up')
            .click();
        cy.contains('[role=button]', 'Recipient of real money')
            .click();
        cy.contains('[role=option]', USERS.robert.name)
            .click();
        cy.followLabel('Amount in CHF')
            .type('100');
        cy.contains('button', 'Save')
            .click();

        cy.contains('[role=listitem]', 'Robert Smith → John Doe')
            .contains('100.00');
    });

    it('Can create a trade transfer', () => {
        cy.login(USERS.john.username, USERS.john.password);
        cy.contains('.v-bottom-navigation a', 'Transfers')
            .click();
        cy.get('.v-btn--fab')
            .click();
        cy.contains('Trade points')
            .click();
        cy.contains('[role=button]', 'Buyer')
            .click();
        cy.contains('[role=option]:visible', USERS.john.name)
            .click();
        // Wait until it's closed, otherwise the next one will fail
        cy.get('[role=option]:visible')
            .should('not.exist');
        cy.contains('[role=button]', 'Seller')
            .click();
        cy.contains('[role=option]:visible', USERS.robert.name)
            .click();
        cy.followLabel('Points')
            .type('4');
        cy.followLabel('Total money')
            .type('40');
        cy.contains('button', 'Save')
            .click();

        cy.contains('[role=listitem]', 'John Doe → Robert Smith')
            .contains('40.00');
        cy.contains('[role=listitem]', 'Robert Smith → John Doe')
            .contains('4.00');
    });
});
