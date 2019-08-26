const request = require('supertest');
const main = require('../src/main');
const PackageJson = require('../package');

// close the server after each test
afterAll(() => {
    main.server.close();
});

describe('basic route tests', () => {
    test('get version route', async () => {
        const response = await request(main.server).get('/version');
        expect(response.status).toEqual(200);
        expect(response.text).toContain(PackageJson.version);
    });
});
