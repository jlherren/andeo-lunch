const {USERS} = require('../helpers/sql');

describe('Misc not logged in', () => {
    before(() => {
        cy.task('db:purge');
        USERS.john.insert();
    });

    it('Creates a persistent device ID', () => {
        cy.visit('/');
        cy.wrap(null)
            .should(() => expect(localStorage.getItem('device-id')).to.not.be.null)
            .then(() => {
                let deviceId = localStorage.getItem('device-id');
                expect(deviceId).to.be.a('string');
                expect(deviceId).to.have.length.gte(10);
                cy.wrap(deviceId)
                    .as('deviceId');
            });

        cy.login(USERS.john.username, USERS.john.password);
        cy.reload();
        cy.loadComplete('Your balance');

        cy.get('@deviceId')
            .should(oldDeviceId => {
                let newDeviceId = localStorage.getItem('device-id');
                expect(newDeviceId).to.eq(oldDeviceId);
            });
    });
});

describe('Misc logged in', () => {
    before(() => {
        cy.task('db:purge');
        USERS.john.insert();
    });

    beforeEach(() => {
        cy.login(USERS.john.username, USERS.john.password);
    });

    it('View about page', () => {
        cy.visit('/');
        cy.get('.v-app-bar button')
            .click();
        cy.contains('a', 'About')
            .click();

        cy.contains('About Andeo Lunch')
            .should('be.visible');
        cy.contains('GNU General Public License')
            .should('be.visible');
        cy.contains('WITHOUT ANY WARRANTY')
            .should('be.visible');
        cy.contains(/App version: \d+\.\d+\.\d+/u);
    });
});
