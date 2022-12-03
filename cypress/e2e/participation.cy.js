const {USERS, LUNCH, SPECIAL} = require('../helpers/sql');

describe('Lunch event', () => {
    beforeEach(() => {
        cy.task('db:purge');
        USERS.john.insert();
        USERS.robert.insert();
        LUNCH.lasagna.insert();
        cy.login(USERS.john.username, USERS.john.password);
    });

    it('Is default undecided', () => {
        cy.visit('/events/1');
        cy.contains('[role=listitem]', USERS.john.name)
            .find('[data-type=undecided]');
    });

    it('Can quick opt-in', () => {
        cy.visit('/events/1');
        cy.contains('button', 'Opt-in')
            .click();
        cy.contains('[role=listitem]', USERS.john.name)
            .find('[data-type=omnivorous]');
    });

    it('Can quick opt-out', () => {
        cy.visit('/events/1');
        cy.contains('button', 'Opt-out')
            .click();
        cy.contains('[role=listitem]', USERS.john.name)
            .find('[data-type=opt-out]');
    });

    it('Can opt-in someone else', () => {
        cy.visit('/events/1');
        cy.contains('[role=listitem]', USERS.robert.name)
            .click();
        cy.getDialog().within(() => {
            cy.get('button[value=vegetarian]')
                .click();
            cy.contains('button:visible', 'Save')
                .click();
        });
        cy.noDialog();
        cy.contains('[role=listitem]', USERS.robert.name)
            .find('[data-type=vegetarian]');
    });

    it('Can edit participation twice in a row', () => {
        cy.visit('/events/1');
        cy.contains('[role=listitem]', USERS.john.name)
            .click();
        cy.getDialog().within(() => {
            cy.get('button[value=omnivorous]')
                .click();
            cy.contains('button:visible', 'Save')
                .click();
        });
        cy.noDialog();
        cy.contains('[role=listitem]', USERS.john.name)
            .find('[data-type=omnivorous]');
        cy.contains('[role=listitem]', USERS.john.name)
            .click();
        cy.getDialog().within(() => {
            cy.get('button[value=vegetarian]')
                .click();
            cy.contains('button:visible', 'Save')
                .click();
        });
        cy.noDialog();
        cy.contains('[role=listitem]', USERS.john.name)
            .find('[data-type=vegetarian]');
    });

    it('Disabled user shows', () => {
        USERS.mike.insert();
        cy.visit('/events/1');
        cy.contains(USERS.mike.name);
    });

    it('Hidden user does not show by default', () => {
        USERS.sarah.insert();
        cy.visit('/events/1');
        // Make sure the list has loaded!
        cy.contains(USERS.john.name);
        cy.contains(USERS.sarah.name).should('not.exist');
    });

    it('Hidden user shows if participating', () => {
        USERS.sarah.insert();
        cy.task('db:sql', `
            INSERT INTO participation (event, user, type, pointsCredited, createdAt, updatedAt)
                VALUES (${LUNCH.lasagna.id}, ${USERS.sarah.id}, 1, 8, NOW(), NOW());
        `);
        cy.visit('/events/1');
        cy.contains(USERS.sarah.name);
    });
});

describe('Special event', () => {
    beforeEach(() => {
        cy.task('db:purge');
        USERS.john.insert();
        USERS.robert.insert();
        SPECIAL.lasagna.insert();
        cy.login(USERS.john.username, USERS.john.password);
        cy.visit('/events/2');
    });

    it('Is default opt-out', () => {
        cy.contains('[role=listitem]', USERS.john.name)
            .find('[data-type=opt-out]');
    });

    it('Can opt-in', () => {
        cy.contains('[role=listitem]', USERS.john.name)
            .click();
        cy.getDialog().within(() => {
            cy.get('button[value=opt-in]')
                .click();
            cy.contains('button:visible', 'Save')
                .click();
        });
        cy.noDialog();
        cy.contains('[role=listitem]', USERS.john.name)
            .find('[data-type=opt-in]');
    });

    it('Can opt-in someone else', () => {
        cy.contains('[role=listitem]', USERS.robert.name)
            .click();
        cy.getDialog().within(() => {
            cy.get('button[value=opt-in]')
                .click();
            cy.contains('button:visible', 'Save')
                .click();
        });
        cy.noDialog();
        cy.contains('[role=listitem]', USERS.robert.name)
            .find('[data-type=opt-in]');
    });
});
