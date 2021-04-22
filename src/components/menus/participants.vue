<template>
    <div class="participants">
        <div class="total">{{ total }}</div>
        <div class="participants-details">
            <v-icon>mdi-food-steak</v-icon>
            {{ participants.meat }}
            <br>
            <v-icon>mdi-food-apple</v-icon>
            {{ participants.vegi }}
        </div>
    </div>
</template>

<script>
    export default {
        name: "participants",
        props: {
            participants: {
                meat: 0,
                vegi: 0
            }
        },
        computed: {
            total() {
                return this.participants.meat + this.participants.vegi;
            },
        }
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
