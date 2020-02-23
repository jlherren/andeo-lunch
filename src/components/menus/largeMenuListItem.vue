<template>
    <v-list-item to="/menus" three-line>
        <v-list-item-content>
            <v-list-item-subtitle class="center-text">{{menu.date}}</v-list-item-subtitle>
            <v-list-item-title class="center-text">{{menu.name}}</v-list-item-title>

            <v-list-item-content>
                <div class="custom-row justify-center">
                    <div class="total">
                        <span>{{ total }}</span>
                    </div>
                    <div class="custom-column">
                        <div class="custom-row">
                            <v-icon>mdi-food</v-icon>
                            <div>{{ menu.people.meat }}</div>
                        </div>
                        <div class="custom-row">
                            <v-icon>mdi-food-apple</v-icon>
                            <div>{{ menu.people.vegi }}</div>
                        </div>
                    </div>
                </div>
            </v-list-item-content>

        </v-list-item-content>
    </v-list-item>
</template>

<script>
    export default {
        name: "largeMenuListItem",
        props: {
            menu: {
                date: null,
                name: null,
                isToday: true,
                people: {
                    meat: 0,
                    vegi: 0
                }
            }
        },
        computed: {
            total() {
                return this.menu.people.meat + this.menu.people.vegi;
            }
        }
    }
</script>

<style lang="scss" scoped>
    .total {
        display: flex;
        flex-flow: column;
        justify-content: center;
        font-size: 28pt;
        color: #43A047;
        text-align: center;
        margin: 0 20px;

        span {
            height: 28pt;
        }
    }

    .custom-row {
        display: flex;
        flex-flow: row;
    }

    .custom-column {
        display: flex;
        flex-flow: column;
    }
</style>