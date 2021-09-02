const {USERS} = require('../helpers/sql');

describe('Create events', () => {
    beforeEach(() => {
        cy.task('db:purge');
        USERS.john.insert();
        cy.login(USERS.john.username, USERS.john.password);
        cy.contains('.v-bottom-navigation a', 'Calendar')
            .click();
    });

    it('Use quick add button', () => {
        cy.get('.v-list-item a')
            .first()
            .click();

        cy.followLabel('Name')
            .type('Brunch');
        // Must have a preset date
        cy.followLabel('Date')
            .should('not.have.value', '')
            .click();
        // Note: This may fail, when the monday of the current week is in the last month.
        cy.get('button.v-date-picker-table__current')
            .click();
        cy.followLabel('Points')
            .type('6');
        cy.followLabel('Vegetarian factor')
            .should('have.value', 50);
        cy.contains('button', 'Save')
            .click();

        cy.contains('.headline', 'Brunch');
    });

    it('Manual lunch button', () => {
        cy.get('button.v-btn--fab')
            .click();
        cy.contains('a', 'Lunch')
            .click();

        cy.followLabel('Name')
            .type('Spätzli');
        cy.followLabel('Date')
            .should('have.value', '')
            .click();
        cy.get('button.v-date-picker-table__current')
            .click();
        cy.followLabel('Points')
            .type('0.5');
        cy.followLabel('Vegetarian factor')
            .type('{selectall}100');
        cy.contains('button', 'Save')
            .click();

        cy.contains('.headline', 'Spätzli');
    });

    it('Special event button', () => {
        cy.get('button.v-btn--fab')
            .click();
        cy.contains('a', 'Special')
            .click();

        cy.followLabel('Name')
            .type('AoE Zyt Pizza');
        cy.followLabel('Date')
            .click();
        cy.get('button.v-date-picker-table__current')
            .click();
        cy.followLabel('Points')
            .type('4');
        cy.followLabel('Vegetarian factor')
            .type('{selectall}100');
        cy.contains('button', 'Save')
            .click();

        cy.contains('.headline', 'AoE Zyt Pizza');
    });

    it('Label event', () => {
        cy.get('button.v-btn--fab')
            .click();
        cy.contains('a', 'Label')
            .click();

        cy.followLabel('Name')
            .type('Feiertag');
        cy.followLabel('Date')
            .click();
        cy.get('button.v-date-picker-table__current')
            .click();
        cy.contains('label', 'Points')
            .should('not.exist');
        cy.contains('label', 'Vegetarian factor')
            .should('not.exist');
        cy.contains('button', 'Save')
            .click();

        cy.contains('.headline', 'Feiertag');
    });
});
