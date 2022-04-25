<template>
    <span class="participants" :class="{'large': large}">
        <span class="icon-and-number">
            <v-icon v-if="!large">{{ $icons.account }}</v-icon>
            {{ total }}
        </span>
        <span class="details" v-if="event.type === 'lunch'">
            <span class="icon-and-number">
                <v-icon>{{ $icons.omnivorous }}</v-icon>
                {{ omnivorous }}
            </span>
            <span class="icon-and-number">
                <v-icon>{{ $icons.vegetarian }}</v-icon>
                {{ vegetarian }}
            </span>
        </span>
        <v-icon large v-else-if="large">{{ $icons.account }}</v-icon>
    </span>
</template>

<script>
    const OPT_IN_PARTICIPATIONS = ['omnivorous', 'vegetarian', 'opt-in'];

    export default {
        name: 'ParticipationSummary',

        props: {
            event:          {
                type:     Object,
                required: true,
            },
            participations: {
                type:     Array,
                required: true,
            },
            large:          Boolean,
        },

        computed: {
            loaded() {
                return !!this.participations;
            },

            optIns() {
                return this.participations.filter(p => OPT_IN_PARTICIPATIONS.includes(p.type));
            },

            omnivorous() {
                if (!this.loaded) {
                    return '?';
                }
                return this.optIns.filter(p => p.type === 'omnivorous').length;
            },

            vegetarian() {
                if (!this.loaded) {
                    return '?';
                }
                return this.optIns.filter(p => p.type === 'vegetarian').length;
            },

            total() {
                if (!this.loaded) {
                    return '?';
                }
                return this.optIns.length;
            },
        },
    };
</script>

<style lang="scss" scoped>
    .v-icon {
        margin-right: 2px;
        width: 16px;
        height: 16px;
        color: inherit;
    }

    .icon-and-number {
        display: inline-flex;
        margin-right: 0.5em;
        vertical-align: text-bottom;
    }

    .large {
        .icon-and-number {
            margin-right: 0.1em;
        }

        &.participants {
            display: inline-flex;
            align-items: center;
        }

        .details {
            line-height: 100%;
            display: inline-flex;
            flex-direction: column;
            font-size: 16px;
        }
    }
</style>
