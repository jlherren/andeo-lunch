<template>
    <v-list-item :to="link" three-line>
        <v-list-item-content>
            <v-list-item-subtitle class="center-text">{{fullDate}}</v-list-item-subtitle>
            <v-list-item-title class="center-text">{{menu.name}}</v-list-item-title>

            <v-list-item-content>
                <participants class="justify-center" :participants="menu.participants"/>
            </v-list-item-content>

        </v-list-item-content>
    </v-list-item>
</template>

<script>
    import Participants from "./participation-summary";
    export default {
        name: "largeMenuListItem",
        components: {Participants},
        props: {
            menu: {
                date: null,
                name: null,
                isToday: true,
                weekday: null,
                participants: {
                    meat: 0,
                    vegi: 0
                }
            }
        },
        computed: {
            total() {
                return this.menu.participants.meat + this.menu.participants.vegi;
            },
            fullDate() {
                return this.menu.weekday.substr(0, 2) + ', ' + this.menu.date;
            },
            link() {
                return '/menus/' + this.menu.id;
            }
        }
    }
</script>

<style lang="scss" scoped>

</style>
