<template>
    <v-list-item :to="link">
        <v-list-item-content>
            <v-list-item-subtitle >{{fullDate}}</v-list-item-subtitle>
            <v-list-item-title >{{menu.name}}</v-list-item-title>
        </v-list-item-content>
    </v-list-item>
</template>

<script>
    export default {
        name: "smallMenuListItem",
        props: {
            menu: {
                date: null,
                weekday: null,
                name: null
            }
        },
        computed: {
            fullDate() {
                return this.menu.weekday.substr(0, 2) + ', ' + this.menu.date;
            },
            link() {
                return '/menus/' + this.menu.id;
            }
        }
    }
</script>

<style scoped>

</style>