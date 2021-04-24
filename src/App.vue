<template>
    <v-app>
        <!-- Shown briefly while the initial login check is still running -->
        <v-main v-if="!initialCheckCompleted">
            <v-container fill-height>
                <v-row justify="center">
                    <v-progress-circular indeterminate size="100"/>
                </v-row>
            </v-container>
        </v-main>

        <!-- If logged in, show app contents -->
        <template v-else-if="isLoggedIn">
            <router-view/>

            <v-bottom-navigation app>
                <v-btn v-for="link in navigationLinks" :to="link.url" :key="link.title">
                    <span>{{ link.title }}</span>
                    <v-icon>{{ link.icon }}</v-icon>
                </v-btn>
            </v-bottom-navigation>
        </template>

        <!-- If not logged in, show login page -->
        <template v-else>
            <Login/>
        </template>
    </v-app>
</template>

<script>
    import Login from './views/Login';
    import {mapGetters} from 'vuex';

    export default {
        name: 'App',

        components: {
            Login,
        },

        data: () => ({
            navigationLinks: [
                {
                    url: '/',
                    title: 'Home',
                    icon: 'mdi-home',
                },
                {
                    url: '/calendar',
                    title: 'Calendar',
                    icon: 'mdi-calendar',
                },
                {
                    url: '/menus',
                    title: 'Menus',
                    icon: 'mdi-silverware',
                },
                {
                    url: '/cash',
                    title: 'Cash',
                    icon: 'mdi-cash',
                },
            ],
            drawerOpen: false,
        }),

        computed: {
            ...mapGetters([
                'displayName',
                'isLoggedIn',
            ]),

            initialCheckCompleted() {
                return this.$store.state.account.initialCheckCompleted;
            },
        },

        created() {
            this.$store.dispatch('checkLogin');
        },
    };
</script>

<style lang="scss">
    .center-text {
        text-align: center;
    }
</style>
