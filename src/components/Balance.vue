<template>
    <span :class="valueClass">
        {{ formatted }}
        <v-icon :small="small" :large="large" v-if="actualIcon !== null">{{ actualIcon }}</v-icon>
    </span>
</template>

<script>
    export default {
        name: 'balance',

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
                    return '\u2013';  // n-dash
                }
                let str = this.value.toFixed(this.digits);
                if (!this.precise) {
                    str = str.replace(/\.0*$/, '');
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
                return this.value >= 0 ? 'positive' : 'negative';
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
        },
    };
</script>

<style scoped lang="scss">
    .v-icon {
        color: inherit;
    }

    .positive {
        color: #43a047;
    }

    .negative {
        color: #c62828;
    }
</style>
