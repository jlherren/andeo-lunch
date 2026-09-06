import {USERS} from '../helpers/sql';

describe('Events', () => {
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
        cy.contains('.v-btn', 'Save')
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
        cy.contains('.v-btn', 'Save')
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
        cy.contains('.v-btn', 'Save')
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
        cy.contains('.v-btn', 'Save')
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
        cy.contains('.v-btn', 'Save')
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
        cy.contains('.v-btn', 'Save')
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
        cy.contains('.v-btn', 'Save')
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
        cy.contains('.v-btn', 'Andeo')
            .click();
        cy.contains('.v-btn', 'John Doe')
            .click();
        cy.contains('.v-btn', 'Andeo')
            .click();
        cy.contains('.v-btn', 'Save')
            .click();
        cy.contains('.v-list-item', 'Brunch')
            .click();
        cy.contains('.v-list-item:visible', 'John Doe')
            .contains('.v-chip', '+6');
        cy.contains('.v-list-item', 'Andeo')
            .find('.v-chip')
            .should('not.exist');
    });

    it('Auto-fix vegetarian factor', () => {
        cy.contains('a', 'Add new lunch')
            .first()
            .click();
        cy.followLabel('Name')
            .type('Stew');
        cy.followLabel('Points')
            .type('6');
        cy.followLabel('Vegetarian money factor')
            .type('{selectall}0.8');
        cy.contains('.v-btn', 'Save')
            .click();

        cy.contains('.v-list-item', 'Stew')
            .click();
        cy.contains('.v-btn', 'Edit')
            .click();
        cy.followLabel('Vegetarian money factor')
            .should('have.value', 80);
    });

    it('Loads and persists edited event values', () => {
        cy.contains('a', 'Add new lunch')
            .first()
            .click();
        cy.followLabel('Name')
            .type('Original lunch');
        cy.followLabel('Points')
            .type('6');
        cy.followLabel('Vegetarian money factor')
            .type('{selectall}80');
        cy.followLabel('Comments')
            .type('Original comment');
        cy.followLabel('Participation costs')
            .type('{selectall}0.5');
        cy.followLabel('Participation fee')
            .type('{selectall}1.5');
        cy.contains('.v-btn', 'Save')
            .click();
        cy.contains('.v-list-item', 'Original lunch')
            .click();
        cy.contains('.v-btn', 'Edit')
            .click();

        cy.followLabel('Name')
            .should('have.value', 'Original lunch')
            .type('{selectall}Edited lunch');
        cy.followLabel('Date')
            .should('be.disabled')
            .and('not.have.value', '');
        cy.followLabel('Points')
            .should('have.value', 6)
            .type('{selectall}7');
        cy.followLabel('Vegetarian money factor')
            .should('have.value', 80)
            .type('{selectall}60');
        cy.followLabel('Comments')
            .should('have.value', 'Original comment')
            .type('{selectall}Updated comment');
        cy.followLabel('Participation costs')
            .should('have.value', 0.5)
            .type('{selectall}1.25');
        cy.followLabel('Participation fee')
            .should('have.value', 1.5)
            .type('{selectall}2.5');
        cy.contains('.v-btn', 'Save')
            .click();

        cy.contains('.headline', 'Edited lunch');
        cy.contains('Updated comment');
        cy.contains('Participation flat-rate: 1.25');
        cy.reload();
        cy.contains('.v-btn', 'Edit')
            .click();
        cy.followLabel('Name')
            .should('have.value', 'Edited lunch');
        cy.followLabel('Points')
            .should('have.value', 7);
        cy.followLabel('Vegetarian money factor')
            .should('have.value', 60);
        cy.followLabel('Comments')
            .should('have.value', 'Updated comment');
        cy.followLabel('Participation costs')
            .should('have.value', 1.25);
        cy.followLabel('Participation fee')
            .should('have.value', 2.5);
    });

    it('Disables and restores participation flat-rate input', () => {
        cy.contains('a', 'Add new lunch')
            .first()
            .click();
        cy.followLabel('Participation flat-rate')
            .should('be.checked');
        cy.followLabel('Participation costs')
            .should('not.be.disabled')
            .type('{selectall}0.5');

        cy.followLabel('Participation flat-rate')
            .uncheck({force: true});
        cy.followLabel('Participation costs')
            .should('be.disabled')
            .and('have.value', 0.5);

        cy.followLabel('Participation flat-rate')
            .check({force: true});
        cy.followLabel('Participation costs')
            .should('not.be.disabled')
            .and('have.value', 0.5);
    });

    it('Can cancel and confirm deleting an event', () => {
        cy.contains('a', 'Add new lunch')
            .first()
            .click();
        cy.followLabel('Name')
            .type('Lunch to delete');
        cy.contains('.v-btn', 'Save')
            .click();
        cy.contains('.v-list-item', 'Lunch to delete')
            .click();

        cy.contains('.v-btn', 'Delete')
            .click();
        cy.getDialog()
            .within(() => {
                cy.contains('Delete this event?');
                cy.contains('.v-btn', 'No, keep it')
                    .click();
            });
        cy.noDialog();
        cy.contains('.headline', 'Lunch to delete');

        cy.contains('.v-btn', 'Delete')
            .click();
        cy.getDialog()
            .within(() => {
                cy.contains('.v-btn', 'Yes, delete')
                    .click();
            });
        cy.contains('.v-list-item', 'Lunch to delete')
            .should('not.exist');
        cy.reload();
        cy.contains('.v-list-item', 'Lunch to delete')
            .should('not.exist');
    });
});
