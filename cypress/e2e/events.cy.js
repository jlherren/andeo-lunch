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
        cy.contains('a', 'Add new lunch')
            .first()
            .click();

        cy.followLabel('Name')
            .type('Brunch');
        // Must have a preset date
        cy.followLabel('Date')
            .should('not.have.value', '');
        cy.followLabel('Points')
            .type('6');
        cy.followLabel('Vegetarian money factor')
            .should('have.value', 50);
        cy.contains('button', 'Save')
            .click();

        cy.contains('.v-list-item', 'Brunch')
            .click();
        cy.contains('.headline', 'Brunch');
        cy.contains('Participation flat-rate: 0.75')
            .should('be.visible');
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
        cy.followLabel('Vegetarian money factor')
            .type('{selectall}100');
        cy.contains('button', 'Save')
            .click();

        cy.contains('.v-list-item', 'Spätzli')
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
        cy.contains('button', 'Save')
            .click();

        cy.contains('.v-list-item', 'AoE Zyt Pizza')
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
        cy.contains('label', 'Vegetarian money factor')
            .should('not.exist');
        cy.contains('button', 'Save')
            .click();

        cy.contains('.v-list-item', 'Feiertag')
            .click();
        cy.contains('.headline', 'Feiertag');
    });

    it('Add a comment', () => {
        cy.contains('a', 'Add new lunch')
            .first()
            .click();
        cy.followLabel('Name')
            .type('Complex menu');
        cy.followLabel('Comment')
            .type('Here is how to do it...');
        cy.contains('button', 'Save')
            .click();
        cy.contains('.v-list-item', 'Complex menu')
            .click();
        cy.contains('Here is how to do it...')
            .should('be.visible');
    });

    it('Alternate flat-rate', () => {
        cy.contains('a', 'Add new lunch')
            .first()
            .click();
        cy.followLabel('Name')
            .type('Gratin');
        cy.followLabel('Participation cost')
            .type('{selectall}{backspace}0.5');
        cy.contains('button', 'Save')
            .click();
        cy.contains('.v-list-item', 'Gratin')
            .click();
        cy.contains('Participation flat-rate: 0.5')
            .should('be.visible');
    });

    it('Non-flat-rate lunch', () => {
        cy.contains('a', 'Add new lunch')
            .first()
            .click();

        cy.followLabel('Name')
            .type('Pizza');
        cy.followLabel('Participation flat-rate')
            .uncheck({force: true});
        cy.contains('button', 'Save')
            .click();

        cy.contains('.v-list-item', 'Pizza')
            .click();
        cy.contains('Participation flat-rate')
            .should('not.exist');
    });

    it('Test helper regression', () => {
        // There was a bug where unsetting a helper would still add it as a helper.
        cy.contains('a', 'Add new lunch')
            .first()
            .click();
        cy.followLabel('Name')
            .type('Brunch');
        cy.followLabel('Points')
            .type('6');
        cy.contains('button', 'Andeo')
            .click();
        cy.contains('button', 'John Doe')
            .click();
        cy.contains('button', 'Andeo')
            .click();
        cy.contains('button', 'Save')
            .click();
        cy.contains('.v-list-item', 'Brunch')
            .click();
        cy.contains('.v-list-item:visible', 'John Doe')
            .contains('.v-chip', '+6');
        cy.contains('.v-list-item', 'Andeo')
            .find('.v-chip')
            .should('not.exist');
    });
});
