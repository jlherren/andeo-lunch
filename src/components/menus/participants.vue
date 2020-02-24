<template>
    <div class="custom-row">
        <div class="total">
            <span>{{ total }}</span>
        </div>
        <div class="custom-column">
            <div class="custom-row">
                <v-icon>mdi-food</v-icon>
                <div class="vertically-center">{{ participants.meat }}</div>
            </div>
            <div class="custom-row">
                <v-icon>mdi-food-apple</v-icon>
                <div class="vertically-center">{{ participants.vegi }}</div>
            </div>
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
    .total {
        display: flex;
        align-items: center;
        font-size: 28pt;

        color: #43A047;
        text-align: center;
        margin: 0 20px;
    }

    .custom-row {
        display: flex;
        flex-flow: row;
    }

    .custom-column {
        display: flex;
        flex-flow: column;
    }

    .vertically-center {
        display: flex;
        align-items: center;
    }
</style>