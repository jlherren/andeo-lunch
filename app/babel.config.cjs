// This file is Common JS, because it can't be a module as long as Babel is invoked in a synchronous way.
// We have no control over that at the moment.

module.exports = {
    presets: [
        '@vue/cli-plugin-babel/preset',
    ],
};
