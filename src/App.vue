<template>
    <!-- If logged in, show app contents -->
    <v-app v-if="isLoggedIn">
        <!-- App Bar -->
        <v-app-bar app>
            <v-spacer/>
            <v-toolbar-title>{{ userName }}</v-toolbar-title>
            <v-spacer/>
            <settings-dialog/>
        </v-app-bar>

        <v-content>
            <router-view/>
        </v-content>

        <!-- Navigation -->
        <v-bottom-navigation fixed>
            <v-btn v-for="link in navigationLinks" :to="link.url" :key="link.title">
                <span>{{link.title}}</span>
                <v-icon>{{link.icon}}</v-icon>
            </v-btn>
        </v-bottom-navigation>
    </v-app>

    <!-- If not logged in, show Login Page -->
    <v-app v-else>
        <Login/>
    </v-app>
</template>

<script>
    import Login from "./views/Login";
    import {mapGetters} from 'vuex';
    import SettingsDialog from "./components/settingsDialog";

    export default {
        name: 'App',

        components: {
            SettingsDialog,
            Login
        },

        data: () => ({
            navigationLinks: [
                {
                    url: '/',
                    title: 'Home',
                    icon: 'mdi-home'
                },
                {
                    url: '/calendar',
                    title: 'Calendar',
                    icon: 'mdi-calendar'
                },
                {
                    url: '/menus',
                    title: 'Menus',
                    icon: 'mdi-silverware'
                },
                {
                    url: '/cash',
                    title: 'Cash',
                    icon: 'mdi-cash'
                },
            ]
        }),

        computed: {
            ...mapGetters({
                userName: 'getUserName',
                isLoggedIn: 'isLoggedIn'
            }),
        }
    };
</script>

<style lang="scss">
    .center-text {
        text-align: center;
    }
</style>
