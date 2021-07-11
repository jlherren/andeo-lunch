const enterUserNameFromEnv = () => {
    return cy.get('label')
        .contains('Username')
        .siblings()
        .first()
        .type(Cypress.env('username'));
};

const pressLoginButton = () => {
    return cy.get('button[type=submit]')
        .should('not.be.disabled')
        .click();
};

describe('login', () => {
    it('Disables Login button when not entering a password.', () => {
        cy.visit('/');
        cy.get('label')
            .contains('Username')
            .siblings()
            .first()
            .type('Random UserName.');

        cy.get('button[type=submit]')
            .should('be.disabled');
    });

    it('Provides feedback for incorrect credentials', () => {
        cy.visit('/');

        enterUserNameFromEnv();

        cy.get('label')
            .contains('Password')
            .siblings()
            .first()
            .type('Password');

        pressLoginButton();

        cy.get('#app')
            .should('contain.text', 'Error: Invalid username or password ');
    });

    it('Successfully logs in with correct credentials', () => {
        cy.visit('/');

        enterUserNameFromEnv();

        cy.get('label')
            .contains('Password')
            .siblings()
            .first()
            .type(Cypress.env('password'));

        pressLoginButton();

        cy.get('#app').should('contain.text', Cypress.env('username'));

        cy.window().then(window => {
            expect(window.localStorage.getItem('token')).to.not.be.empty;
            Cypress.env('token', window.localStorage.getItem('token'));
        });
    });
});
