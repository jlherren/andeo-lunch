<template>
    <span class="participants">
        <span class="total">{{ total }}</span>
        <span class="participants-details">
            <v-icon>mdi-hamburger</v-icon>
            {{ omnivorous }}
            <br>
            <v-icon>mdi-food-apple</v-icon>
            {{ vegetarian }}
        </span>
    </span>
</template>

<script>
    export default {
        name:     'ParticipationSummary',
        props:    {
            participations: {
                type:    Array,
                default: () => [],
            },
        },
        computed: {
            optIns() {
                return this.participations.filter(p => !['opt-out', 'undecided'].includes(p.type));
            },

            omnivorous() {
                return this.optIns.filter(p => p.type === 'omnivorous').length;
            },

            vegetarian() {
                return this.optIns.filter(p => p.type === 'vegetarian').length;
            },

            total() {
                return this.optIns.length;
            },
        },
    }
</script>

<style lang="scss" scoped>
    .participants {
        display: inline-flex;
        align-items: center;
    }

    .participants-details {
        font-size: 12pt;
        line-height: 100%;

        .v-icon {
            font-size: inherit;
        }
    }

    .total {
        font-size: 28pt;
        color: #43a047;
        margin: 0 0.25em;
    }
</style>
