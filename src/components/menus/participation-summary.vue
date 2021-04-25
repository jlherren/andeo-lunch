<template>
    <span class="participants">
        <span class="total">{{ total }}</span>
        <span class="participants-details">
            <v-icon>mdi-food-steak</v-icon>
            {{ carnivore }}
            <br>
            <v-icon>mdi-food-apple</v-icon>
            {{ vegetarian }}
        </span>
    </span>
</template>

<script>
    export default {
        name:     'participation-summary',
        props:    {
            participations: {
                type:    Array,
                default: [],
            },
        },
        computed: {
            optIns() {
                return this.participations.filter(participation => participation.type !== 'none');
            },

            carnivore() {
                return this.optIns.filter(participation => participation.type === 'carnivore').length;
            },

            vegetarian() {
                return this.optIns.filter(participation => participation.type === 'vegetarian').length;
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
