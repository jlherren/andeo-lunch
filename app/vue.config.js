const crypto = require('crypto');

const {LUNCH_BLUE} = require('./src/constants');

const randomVersion = crypto.randomBytes(3).toString('hex');

module.exports = {
    transpileDependencies: [
        'vuetify',
    ],

    productionSourceMap: false,

    lintOnSave: 'warning',

    pwa: {
        name:                     process.env.VUE_APP_BRANDING_TITLE,
        // Color used for the window title bar when installed as Chrome/Edge app.  We set it to the same color as the
        // background of Vuetify's <v-app-bar>, to make it look seamless.
        themeColor:               LUNCH_BLUE,
        msTileColor:              '#ffffff',
        assetsVersion:            randomVersion,
        appleMobileWebAppCapable: 'yes',
        iconPaths:                {
            faviconSVG:     'img/logo-small.svg',
            favicon16:      'img/logo16.png',
            favicon32:      'img/logo32.png',
            appleTouchIcon: 'img/logo192.png',
            maskIcon:       'img/maskable.svg',
            msTileImage:    'img/logo-small.svg',
        },

        workboxOptions: {
            // This is important for the app to fully work offline.  Without it, non-root URLs such as /calendar would
            // cause a cache miss in the service worker, and they would be fetched from the server.  This is an issue
            // if the device is offline, or if the server already has a newer version deployed than is currently cached
            // by the service worker.
            navigateFallback:         '/index.html',
            // Unsure why, but it also works without creating an exception for /api
            navigateFallbackDenylist: [
                /^\/api\//u,
            ],
        },

        manifestOptions: {
            // eslint-disable-next-line camelcase
            background_color: '#ffffff',
            display:          'standalone',
            lang:             'en-US',
            icons:            [
                // Sadly, the SVG will not be used in some places, so add PNGs as well.  (One example is the
                // install prompt from Chrome and the tile icon once it's installed).  Some sources say that for
                // the PWA splash screen, we need at least 512x512 & PNG.

                // Chromium does not support "any" for size specification.
                // See https://bugs.chromium.org/p/chromium/issues/detail?id=1107123
                // Size *must* be larger than 144x144, or Chrome won't accept it.

                // Note: As per spec, the last one in the list that has appropriate features will be used.
                {
                    src:   `img/logo16.png?v=${randomVersion}`,
                    sizes: '16x16',
                    type:  'image/png',
                },
                {
                    src:   `img/logo32.png?v=${randomVersion}`,
                    sizes: '32x32',
                    type:  'image/png',
                },
                {
                    src:   `img/logo64.png?v=${randomVersion}`,
                    sizes: '64x64',
                    type:  'image/png',
                },
                {
                    src:   `img/logo128.png?v=${randomVersion}`,
                    sizes: '128x128',
                    type:  'image/png',
                },
                {
                    src:   `img/logo192.png?v=${randomVersion}`,
                    sizes: '192x192',
                    type:  'image/png',
                },
                {
                    src:   `img/logo512.png?v=${randomVersion}`,
                    sizes: '512x512',
                    type:  'image/png',
                },
                {
                    src:   `img/logo-small.svg?v=${randomVersion}`,
                    sizes: '32x32 64x64',
                    type:  'image/svg+xml',
                },
                {
                    src:   `img/logo-large.svg?v=${randomVersion}`,
                    sizes: '128x128 256x256 512x512',
                    type:  'image/svg+xml',
                },
                {
                    src:     `img/maskable.svg?v=${randomVersion}`,
                    sizes:   '256x256',
                    type:    'image/svg+xml',
                    purpose: 'maskable',
                },
            ],
        },
    },
};
