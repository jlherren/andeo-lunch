<template>
    <span class="participants">
        <span class="total">{{ total }}</span>
        <span class="participants-details">
            <v-icon>{{ $icons.omnivorous }}</v-icon>
            {{ omnivorous }}
            <br>
            <v-icon>{{ $icons.vegetarian }}</v-icon>
            {{ vegetarian }}
        </span>
    </span>
</template>

<script>
    export default {
        name: 'ParticipationSummary',

        props: {
            participations: {
                type:     Array,
                required: true,
                default:  () => [],
            },
            loading:        Boolean,
        },

        computed: {
            optIns() {
                return this.participations.filter(p => !['opt-out', 'undecided'].includes(p.type));
            },

            omnivorous() {
                if (this.loading) {
                    return '?';
                }
                return this.optIns.filter(p => p.type === 'omnivorous').length;
            },

            vegetarian() {
                if (this.loading) {
                    return '?';
                }
                return this.optIns.filter(p => p.type === 'vegetarian').length;
            },

            total() {
                if (this.loading) {
                    return '?';
                }
                return this.optIns.length;
            },
        },
    };
</script>

<style lang="scss" scoped>
    .participants {
        display: inline-flex;
        align-items: center;
    }

    .participants-details {
        font-size: 16px;
        line-height: 100%;

        .v-icon {
            width: 16px;
            height: 16px;
        }
    }

    .total {
        font-size: 28pt;
        margin: 0 0.25em;
    }

    .v-icon {
        color: inherit;
    }
</style>
