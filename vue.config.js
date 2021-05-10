process.env.VUE_APP_VERSION = require('./package.json').version;

module.exports = {
    transpileDependencies: [
        'vuetify',
    ],

    productionSourceMap: false,

    pwa: {
        name:          'Lunch Money',
        themeColor:    '#1e1617',
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
    },
};
