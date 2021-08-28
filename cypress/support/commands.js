// No commands defined for the moment

/**
 * Find a label with the given text and follow it to the input element
 *
 * @param {string} label
 * @returns {Cypress.Chainable<HTMLElement>}
 * @memberof cy
 */
function followLabel(label) {
    return cy.contains('label', label)
        .invoke('attr', 'for')
        .then(id => cy.get(`#${id}`));
}

Cypress.Commands.add('followLabel', followLabel);

/**
 * Log in a user
 *
 * @param {string} username
 * @param {string} password
 * @memberof cy
 */
function login(username, password) {
    cy.visit('/');
    cy.followLabel('Username')
        .type(username);
    cy.followLabel('Password')
        .type(password);
    cy.get('button[type=submit]')
        .click();
    cy.contains('Your balance');
}

Cypress.Commands.add('login', login);
