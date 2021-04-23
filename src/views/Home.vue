<template>
    <v-main>
        <custom-app-bar>{{ displayName }}</custom-app-bar>
        <user-stats/>
        <v-divider/>
        <menu-list/>
    </v-main>
</template>

<script>
    import UserStats from '@/components/userStats';
    import MenuList from '@/components/menuList';
    import CustomAppBar from '@/components/lmAppBar';
    import {mapGetters} from 'vuex';

    export default {
        name: 'Home',

        components: {
            CustomAppBar,
            MenuList,
            UserStats,
        },

        computed: {
            ...mapGetters({
                displayName: 'getDisplayName',
            }),
        },
    };
</script>
