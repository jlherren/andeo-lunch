process.env.VUE_APP_VERSION = require('./package.json').version;

module.exports = {
    transpileDependencies: [
        'vuetify',
    ],

    productionSourceMap: false,

    pwa: {
        name:         'Lunch Money',
        assetVersion: '1',
    },
};
