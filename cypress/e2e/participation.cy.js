import {EVENTS, USERS} from '../helpers/sql';

describe('Lunch event', () => {
    beforeEach(() => {
        cy.task('db:purge');
        USERS.john.insert();
        USERS.robert.insert();
        EVENTS.lasagna.insert();
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
                VALUES (${EVENTS.lasagna.id}, ${USERS.sarah.id}, 1, 8, NOW(), NOW());
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
        EVENTS.groceries.insert();
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

describe('Grid editor', () => {
    beforeEach(() => {
        cy.viewport(800, 800);
        cy.task('db:purge');
    });

    it('edit', () => {
        USERS.john.insert();
        USERS.robert.insert();
        USERS.sarah.insert();
        USERS.mike.insert();
        EVENTS.lasagna.insert();
        cy.login(USERS.john.username, USERS.john.password);
        cy.visit('/events/1');
        cy.contains('a', 'Grid')
            .click();
        cy.contains('tr', USERS.john.name)
            .within(() => {
                cy.contains('button', 'Undecided')
                    .click();
                cy.get('td:nth(2) input')
                    .type('{selectall}8');
            });
        cy.contains('tr', USERS.mike.name)
            .within(() => {
                cy.contains('button', 'Undecided')
                    .click();
                cy.contains('button', 'Omni')
                    .click();
                cy.get('td:nth(3) input')
                    .type('{selectall}10');
            });
        cy.contains('button', 'Save')
            .click();

        cy.contains('[role=listitem]', USERS.john.name)
            .within(() => {
                cy.get('[data-type=omnivorous]');
                cy.contains('+8');
                cy.get('[data-icon=points]')
                    .should('exist');
                cy.get('[data-icon=money]')
                    .should('not.exist');
            });
        cy.contains('[role=listitem]', USERS.mike.name)
            .within(() => {
                cy.get('[data-type=vegetarian]');
                cy.get('[data-icon=points]')
                    .should('not.exist');
                cy.get('[data-icon=money]')
                    .should('exist');
            });
        cy.contains('[role=listitem]', USERS.robert.name)
            .within(() => {
                cy.get('[data-type=undecided]');
                cy.get('[data-icon=points]')
                    .should('not.exist');
                cy.get('[data-icon=money]')
                    .should('not.exist');
            });
    });
});
