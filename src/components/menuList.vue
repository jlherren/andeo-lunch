<template>
    <v-list>
        <div v-for="menu in menus" :key="'menu_' + menu.id">
            <large-menu-list-item v-if="menu.isToday" :menu="menu"/>
            <small-menu-list-item v-else :menu="menu"/>
            <v-divider/>
        </div>


    </v-list>
</template>

<script>
    import {mapGetters} from 'vuex';
    import SmallMenuListItem from "./menus/smallMenuListItem";
    import LargeMenuListItem from "./menus/largeMenuListItem";

    export default {
        name: "menuList",
        components: {LargeMenuListItem, SmallMenuListItem},
        computed: {
            ...mapGetters({
                menus: 'getMenus'
            })
        }
    }
</script>

<style scoped>

</style>