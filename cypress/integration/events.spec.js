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
        cy.get('.v-list-item button')
            .first()
            .click();

        cy.getDialog().within(() => {
            cy.followLabel('Name')
                .type('Brunch');
            // Must have a preset date
            cy.followLabel('Date')
                .should('not.have.value', '')
                .click();
            // We need to temporarily escape the 'within' scope, since the calendar popup is not in the dialog
            cy.document()
                .its('body')
                .find('button.v-date-picker-table__current')
                .click();
            cy.followLabel('Points')
                .type('6');
            cy.followLabel('Vegetarian factor')
                .should('have.value', 50);
            cy.contains('button', 'Save')
                .click();
        });

        cy.noDialog();

        cy.contains('.v-list-item', 'Brunch');
    });

    it('Manual lunch button', () => {
        cy.get('button.v-btn--fab')
            .click();
        cy.contains('button', 'Lunch')
            .click();

        cy.getDialog().within(() => {
            cy.followLabel('Name')
                .type('Spätzli');
            cy.followLabel('Date')
                .should('have.value', '')
                .click();
            // We need to temporarily escape the 'within' scope, since the calendar popup is not in the dialog
            cy.document()
                .its('body')
                .find('button.v-date-picker-table__current')
                .click();
            cy.followLabel('Points')
                .type('0.5');
            cy.followLabel('Vegetarian factor')
                .clear()
                .type('100');
            cy.contains('button', 'Save')
                .click();
        });

        cy.noDialog();

        cy.contains('.v-list-item', 'Spätzli');
    });

    it('Special event button', () => {
        cy.get('button.v-btn--fab')
            .click();
        cy.contains('button', 'Special')
            .click();

        cy.getDialog().within(() => {
            cy.followLabel('Name')
                .type('AoE Zyt Pizza');
            cy.followLabel('Date')
                .click();
            // We need to temporarily escape the 'within' scope, since the calendar popup is not in the dialog
            cy.document()
                .its('body')
                .find('button.v-date-picker-table__current')
                .click();
            cy.followLabel('Points')
                .type('4');
            cy.followLabel('Vegetarian factor')
                .clear()
                .type('100');
            cy.contains('button', 'Save')
                .click();
        });

        cy.noDialog();

        cy.contains('.v-list-item', 'AoE Zyt Pizza');
    });

    it('Label event', () => {
        cy.get('button.v-btn--fab')
            .click();
        cy.contains('button', 'Label')
            .click();

        cy.getDialog().within(() => {
            cy.followLabel('Name')
                .type('Feiertag');
            cy.followLabel('Date')
                .click();
            // We need to temporarily escape the 'within' scope, since the calendar popup is not in the dialog
            cy.document()
                .its('body')
                .find('button.v-date-picker-table__current')
                .click();
            cy.contains('label', 'Points')
                .should('not.exist');
            cy.contains('label', 'Vegetarian factor')
                .should('not.exist');
            cy.contains('button', 'Save')
                .click();
        });

        cy.noDialog();

        cy.contains('.v-list-item', 'Feiertag');
    });
});
