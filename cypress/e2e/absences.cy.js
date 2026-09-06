import {USERS} from '../helpers/sql';

/**
 * @param {Date} date
 * @return {string}
 */
function isoDate(date) {
    let year = date.getFullYear();
    let month = String(date.getMonth() + 1).padStart(2, '0');
    let day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Navigate after waiting for the previous month's table to leave.
 */
function goToNextMonth() {
    cy.get('.v-date-picker-header__value button')
        .invoke('text')
        .then(oldMonth => {
            cy.get('.v-btn:visible[aria-label="Next month"]')
                .click();
            cy.get('.v-date-picker-header__value button')
                .should('not.have.text', oldMonth);
        });
    cy.get('.v-date-picker-table:visible table')
        .should('have.length', 1);
}

describe('Absences', () => {
    beforeEach(() => {
        cy.task('db:purge');
        USERS.john.insert();
        cy.login(USERS.john.username, USERS.john.password);
        cy.visit('/preferences/absences');
    });

    it('Shows validation and can cancel adding an absence', () => {
        cy.contains('You have no absences');
        cy.contains('.v-btn', 'Add')
            .click();
        cy.getDialog()
            .within(() => {
                cy.contains('.v-btn:visible', 'Save')
                    .click();
                cy.contains('A date is required');
                cy.contains('.v-btn', 'Cancel')
                    .click();
            });
        cy.noDialog();
        cy.contains('You have no absences');
    });

    it('Can add a single-day absence', () => {
        let today = isoDate(new Date());

        cy.contains('.v-btn', 'Add')
            .click();
        cy.getDialog()
            .within(() => {
                cy.followLabel('From')
                    .click();
            });
        cy.get('.v-btn.v-date-picker-table__current')
            .click();
        cy.getDialog()
            .within(() => {
                cy.contains('.v-btn:visible', 'Save')
                    .click();
            });
        cy.contains('main [role=listitem]', `${today} – ${today}`);
        cy.reload();
        cy.contains('main [role=listitem]', `${today} – ${today}`);
    });

    it('Can add a multi-day absence', () => {
        let start = new Date();
        start.setDate(1);
        start.setMonth(start.getMonth() + 1);
        let end = new Date(start.getFullYear(), start.getMonth(), 3);

        cy.contains('.v-btn', 'Add')
            .click();
        cy.getDialog()
            .within(() => {
                cy.followLabel('From')
                    .click();
            });
        goToNextMonth();
        cy.contains('.v-date-picker-table:visible .v-btn', /^1$/u)
            .click();

        cy.getDialog()
            .within(() => {
                cy.followLabel('To')
                    .click();
            });
        goToNextMonth();
        // :visible is necessary, because the other date picker still exists hidden in the DOM.
        cy.contains('.v-date-picker-table:visible .v-btn', /^3$/u)
            .click();
        cy.getDialog()
            .within(() => {
                cy.contains('.v-btn:visible', 'Save')
                    .click();
            });

        let range = `${isoDate(start)} – ${isoDate(end)}`;
        cy.contains('main [role=listitem]', range);
        cy.reload();
        cy.contains('main [role=listitem]', range);
    });

    it('Can cancel and confirm deleting an absence', () => {
        cy.contains('.v-btn', 'Add')
            .click();
        cy.getDialog()
            .within(() => {
                cy.followLabel('From')
                    .click();
            });
        cy.get('.v-btn.v-date-picker-table__current')
            .click();
        cy.getDialog()
            .within(() => {
                cy.contains('.v-btn:visible', 'Save')
                    .click();
            });
        cy.get('main [role=listitem]')
            .should('have.length', 1)
            .find('.v-btn')
            .click();

        cy.getDialog()
            .within(() => {
                cy.contains('Delete absence?');
                cy.contains('.v-btn', 'No, keep it')
                    .click();
            });
        cy.get('main [role=listitem]')
            .should('have.length', 1)
            .find('.v-btn')
            .click();
        cy.getDialog()
            .within(() => {
                cy.contains('.v-btn', 'Yes, delete')
                    .click();
            });
        cy.contains('You have no absences');
        cy.reload();
        cy.contains('You have no absences');
    });
});
