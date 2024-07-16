// No commands defined for the moment

/**
 * Find a label with the given text and follow it to the input element
 *
 * @param {string} label
 * @return {Cypress.Chainable<HTMLElement>}
 * @memberof cy
 */
function followLabel(label) {
    return cy.contains('label', label)
        .invoke('attr', 'for')
        .then(id => cy.get(`#${id}`));
}

Cypress.Commands.add('followLabel', followLabel);

/**
 * Wait for the load to be completed.  Since we don't have traditional navigation, just checking for missing skeletons
 * is not enough, as that might already be the case before anything has happened.  Thus, some text must be visible
 * first, then the skeletons are checked.
 *
 * @param {string} text A text that indicates that the new view has loaded.
 */
function loadComplete(text) {
    cy.contains(text);
    cy.get('.v-skeleton-loader')
        .should('not.exist');
}

Cypress.Commands.add('loadComplete', loadComplete);

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
    cy.loadComplete('Your balance');
}

Cypress.Commands.add('login', login);

/**
 * Logout
 *
 * @memberof cy
 */
function logout() {
    cy.visit('/');
    cy.get('.v-app-bar button')
        .click();
    cy.contains('a', 'Account settings')
        .click();
    cy.contains('[role=listitem]', 'Logout')
        .click();
    cy.getDialog()
        .within(() => {
            cy.contains('button', 'Yes, logout')
                .click();
        });
}

Cypress.Commands.add('logout', logout);

/**
 * Expect a dialog and wait for it to have finished fading in and yield the dialog, which can then be used with
 * within().  (Waiting for the fade in is important for running Cypress headless, otherwise it will be difficult to
 * see anything that happens inside the dialog)
 *
 * @return {Cypress.Chainable<HTMLElement>}
 * @memberof cy
 */
function getDialog() {
    return cy.get('.v-dialog.v-dialog--active')
        .should('have.css', 'opacity', '1');
}

Cypress.Commands.add('getDialog', getDialog);

/**
 * Expect no dialog to be open
 *
 * @memberof cy
 */
function noDialog() {
    cy.get('.v-dialog.v-dialog--active')
        .should('not.exist');
}

Cypress.Commands.add('noDialog', noDialog);
