<template>
    <span :class="valueClass">
        {{ formatted }}
        <v-icon v-if="actualIcon !== null" :large="large" :small="small" :data-icon="iconName">{{ actualIcon }}</v-icon>
    </span>
</template>

<script>
    export default {
        name: 'Balance',

        props: {
            value: {
                type:     Number,
                required: true,
            },

            small: Boolean,
            large: Boolean,
            color: Boolean,

            points: Boolean,
            money:  Boolean,
            icon:   String,

            digits:  {
                type:    Number,
                default: 2,
            },
            precise: Boolean,
            noSign:  Boolean,
        },

        computed: {
            formatted() {
                if (this.value === undefined || this.value === null) {
                    // n-dash
                    return '\u2013';
                }
                let str = this.value.toFixed(this.digits);
                if (!this.precise) {
                    str = str.replace(/\.0*$/u, '');
                }
                // Use a proper minus sign instead of a hyphen, it aligns much better with the plus symbol
                // and is also the same width
                str = str.replace('-', '\u2212');
                if (!this.noSign && this.value >= 0) {
                    str = `+${str}`;
                }
                return str;
            },

            valueClass() {
                if (!this.color) {
                    return '';
                }
                return this.value >= 0 ? 'green--text' : 'red--text';
            },

            actualIcon() {
                if (this.icon) {
                    return this.icon;
                }
                if (this.points) {
                    return this.$icons.points;
                }
                if (this.money) {
                    return this.$icons.money;
                }
                return null;
            },

            iconName() {
                if (this.icon) {
                    return null;
                }
                if (this.points) {
                    return 'points';
                }
                if (this.money) {
                    return 'money';
                }
                return null;
            },
        },
    };
</script>

<style lang="scss" scoped>
    .v-icon {
        color: inherit;
    }
</style>
