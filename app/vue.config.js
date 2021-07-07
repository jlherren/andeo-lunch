process.env.VUE_APP_VERSION = require('./package.json').version;

module.exports = {
    transpileDependencies: [
        'vuetify',
    ],

    productionSourceMap: false,

    lintOnSave: 'warning',

    pwa: {
        name:          process.env.VUE_APP_BRANDING_TITLE,
        themeColor:    '#ffffff',
        assetsVersion: '2',
        iconPaths:     {
            favicon16:      'img/icons/icon16.png',
            favicon32:      'img/icons/icon32.png',
            appleTouchIcon: 'img/icons/icon.svg',
            maskIcon:       'img/icons/icon-maskable.svg',
            msTileImage:    'img/icons/icon.svg',
        },

        manifestOptions: {
            icons: [
                {
                    src:   'img/icons/icon.svg?v=1',
                    sizes: 'any',
                    type:  'image/svg+xml',
                },
                {
                    src:     'img/icons/icon-maskable.svg?v=1',
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
