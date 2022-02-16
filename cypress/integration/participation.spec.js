const {USERS, LUNCH, SPECIAL} = require('../helpers/sql');

describe('Lunch event', () => {
    beforeEach(() => {
        cy.task('db:purge');
        USERS.john.insert();
        USERS.robert.insert();
        LUNCH.lasagna.insert();
        cy.login(USERS.john.username, USERS.john.password);
        cy.visit('/events/1');
    });

    it('Is default undecided', () => {
        cy.contains('[role=listitem]', 'John Doe')
            .find('[data-type=undecided]');
    });

    it('Can quick opt-in', () => {
        cy.contains('button', 'Opt-in')
            .click();
        cy.contains('[role=listitem]', 'John Doe')
            .find('[data-type=omnivorous]');
    });

    it('Can quick opt-out', () => {
        cy.contains('button', 'Opt-out')
            .click();
        cy.contains('[role=listitem]', 'John Doe')
            .find('[data-type=opt-out]');
    });

    it('Can opt-in someone else', () => {
        cy.contains('[role=listitem]', 'Add participation')
            .click();
        cy.contains('[role=button]', 'User')
            .click();
        cy.contains('[role=option]', 'Robert Smith')
            .click();
        cy.get('button[value=vegetarian]')
            .click();
        cy.contains('button:visible', 'Save')
            .click();
        cy.contains('[role=listitem]', 'Robert Smith')
            .find('[data-type=vegetarian]');
    });
});

describe('Lunch event', () => {
    beforeEach(() => {
        cy.task('db:purge');
        USERS.john.insert();
        USERS.robert.insert();
        SPECIAL.lasagna.insert();
        cy.login(USERS.john.username, USERS.john.password);
        cy.visit('/events/2');
    });

    it('Is default opt-out', () => {
        cy.contains('[role=listitem]', 'John Doe')
            .find('[data-type=opt-out]');
    });

    it('Can opt-in', () => {
        cy.contains('[role=listitem]', 'John Doe')
            .click();
        cy.get('button[value=opt-in]')
            .click();
        cy.contains('button:visible', 'Save')
            .click();
        cy.contains('[role=listitem]', 'John Doe')
            .find('[data-type=opt-in]');
    });

    it('Can opt-in someone else', () => {
        cy.contains('[role=listitem]', 'Add participation')
            .click();
        cy.contains('[role=button]', 'User')
            .click();
        cy.contains('[role=option]', 'Robert Smith')
            .click();
        cy.get('button[value=opt-in]')
            .click();
        cy.contains('button:visible', 'Save')
            .click();
        cy.contains('[role=listitem]', 'Robert Smith')
            .find('[data-type=opt-in]');
    });
});
