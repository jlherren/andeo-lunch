const crypto = require('crypto');

const {ANDEO_BLACK} = require('./src/constants');

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
        // Color used for the window title bar when installed as Chrome/Edge app.  We set it to the same color as the
        // background of Vuetify's <v-app-bar>, to make it look seamless.  Only on light theme though.
        themeColor:    ANDEO_BLACK,
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
                    // Chromium does not support "any" for size specification.
                    // See https://bugs.chromium.org/p/chromium/issues/detail?id=1107123
                    // Size *must* be larger than 144x144, or Chrome won't accept it.
                    sizes: '256x256',
                    type:  'image/svg+xml',
                },
                {
                    // Sadly, the SVG will not be used in some places, so add a PNG as well.  (One example is the
                    // install prompt from Chrome and the tile icon once it's installed)
                    src:   `img/icons/icon256.png?v=${randomVersion}`,
                    sizes: '256x256',
                    type:  'image/png',
                },
                {
                    src:     `img/icons/icon-maskable.svg?v=${randomVersion}`,
                    sizes:   '256x256',
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
