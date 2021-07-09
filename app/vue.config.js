const crypto = require('crypto');

process.env.VUE_APP_VERSION = require('./package.json').version;

if (!process.env.VUE_APP_BACKEND_URL) {
    throw new Error('VUE_APP_BACKEND_URL is not set, please read README.md');
}

if (!process.env.VUE_APP_BRANDING_TITLE) {
    throw new Error('VUE_APP_BRANDING_TITLE is not set, please read README.md');
}

const randomVersion = crypto.randomBytes(3).toString('hex');

module.exports = {
    transpileDependencies: [
        'vuetify',
    ],

    productionSourceMap: false,

    lintOnSave: 'warning',

    pwa: {
        name:          process.env.VUE_APP_BRANDING_TITLE,
        themeColor:    '#ffffff',
        msTileColor:   '#ffffff',
        assetsVersion: randomVersion,
        iconPaths:     {
            favicon16:      'img/icons/icon16.png',
            favicon32:      'img/icons/icon32.png',
            appleTouchIcon: 'img/icons/icon.svg',
            maskIcon:       'img/icons/icon-maskable.svg',
            msTileImage:    'img/icons/icon.svg',
        },

        manifestOptions: {
            // eslint-disable-next-line camelcase
            background_color: '#ffffff',
            display:          'standalone',
            lang:             'en-US',
            icons:            [
                {
                    src:   `img/icons/icon.svg?v=${randomVersion}`,
                    sizes: 'any',
                    type:  'image/svg+xml',
                },
                {
                    src:     `img/icons/icon-maskable.svg?v=${randomVersion}`,
                    sizes:   'any',
                    type:    'image/svg+xml',
                    purpose: 'maskable',
                },
            ],
        },

        workboxOptions: {
            // See https://stackoverflow.com/questions/54145735/vue-pwa-not-getting-new-content-after-refresh
            skipWaiting: true,
        },
    },
};
