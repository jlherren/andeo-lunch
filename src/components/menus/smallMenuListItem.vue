<template>
    <v-list-item to="/menus">
        <v-list-item-content>
            <v-list-item-subtitle >{{menu.date}}</v-list-item-subtitle>
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
                name: null
            }
        }
    }
</script>

<style scoped>

</style>