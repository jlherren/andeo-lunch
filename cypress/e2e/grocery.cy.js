import {USERS} from '../helpers/sql';

/**
 * @param {string} name
 * @return {Cypress.Chainable<HTMLInputElement>}
 */
function getItem(name) {
    // Not sure how to select by value, since input[value=...] does checks attributes, not properties.
    return cy.get('[role=listitem] input[type=text]:not([placeholder^="Add item"])')
        .filter((i, element) => element.value === name)
        .should('have.length', 1);
}

/**
 * @param {string} name
 */
function addItem(name) {
    cy.get('[role=listitem] input[placeholder^="Add item"]')
        .type(`${name}{enter}`);
    // Wait for the item to appear
    getItem(name);
}

/**
 * @param {string} name
 */
function checkItem(name) {
    getItem(name)
        .then(input => {
            if (input.val() !== name) {
                return;
            }
            cy.wrap(input)
                .closest('[role=listitem]')
                .find('input[type=checkbox]')
                .should('not.be.disabled')
                .should('not.be.checked')
                .click({force: true});
            cy.wrap(input)
                .closest('[role=listitem]')
                .find('input[type=checkbox]')
                .should('be.checked');
        });
}

/**
 * @param {string} oldName
 * @param {string} newName
 */
function renameItem(oldName, newName) {
    cy.get('[role=listitem] input[type=text]')
        .each(input => {
            if (input.val() !== oldName) {
                return;
            }
            cy.wrap(input)
                .closest('[role=listitem]')
                .find('input[type=text]')
                .type(`{selectall}${newName}{enter}`);
        });
}

/**
 * @param {string} name
 * @param {string} should
 */
function checkboxShould(name, should) {
    cy.get('[role=listitem] input[type=text]')
        .each(input => {
            if (input.val() !== name) {
                return;
            }
            cy.wrap(input)
                .closest('[role=listitem]')
                .find('input[type=checkbox]')
                .should('not.be.disabled')
                .should(should);
        });
}

/**
 * @param {string} name
 */
function itemShouldNotExist(name) {
    cy.get('[role=listitem] input[type=text]')
        .each(input => {
            if (input.val() === name) {
                cy.wrap(input).should('not.exist');
            }
        });
}

/**
 * @param {string} name
 */
function deleteItem(name) {
    cy.get('[role=listitem] input[type=text]')
        .each(input => {
            if (input.val() !== name) {
                return;
            }
            cy.wrap(input)
                .closest('[role=listitem]')
                .find('button')
                .click();
        });
}

describe('Groceries', () => {
    before(() => {
        cy.task('db:purge');
        USERS.john.insert();
    });

    beforeEach(() => {
        cy.login(USERS.john.username, USERS.john.password);
        cy.visit('/');
        cy.get('.v-app-bar button')
            .click();
        cy.contains('a', 'Grocery')
            .click();
    });

    it('Add groceries', () => {
        addItem('Bananas');
        addItem('Coffee');
        addItem('Lemon juice');
        checkItem('Bananas');
        checkItem('Lemon juice');

        // Wait for the 1s delay and refresh
        cy.get('input:disabled')
            .should('not.exist');

        cy.reload();
        checkboxShould('Bananas', 'be.checked');
        checkboxShould('Lemon juice', 'be.checked');
        checkboxShould('Coffee', 'not.be.checked');

        deleteItem('Bananas');
        itemShouldNotExist('Bananas');

        renameItem('Coffee', 'Coffee beans');
        checkItem('Coffee beans');
    });
});
