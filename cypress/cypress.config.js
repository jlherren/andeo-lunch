import {defineConfig} from 'cypress';
import {dbPurge, dbSql} from './plugins/index.js';

export default defineConfig({
    chromeWebSecurity: false,
    downloadsFolder:   'downloads',
    fixturesFolder:    'fixtures',
    screenshotsFolder: 'screenshots',
    video:             true,
    videoCompression:  true,
    videosFolder:      'videos',
    viewportHeight:    600,
    viewportWidth:     420,
    e2e:               {
        baseUrl:     'http://127.0.0.1:31978',
        specPattern: 'e2e/**/*.cy.js',
        supportFile: 'support/e2e.js',

        setupNodeEvents(on, config) {
            on('task', {
                'db:purge': () => dbPurge(config),
                'db:sql':   dbSql,
            });
        },
    },
});
