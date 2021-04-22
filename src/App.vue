<template>
    <!-- If logged in, show app contents -->
    <v-app v-if="isLoggedIn">
        <v-navigation-drawer v-model="drawer" fixed temporary right>
            <v-list dense>
                <settings-dialog/>
            </v-list>
        </v-navigation-drawer>

        <!-- App Bar -->
        <v-app-bar app>
            <v-toolbar-title>{{ userName }}</v-toolbar-title>
            <v-spacer/>
            <v-btn icon @click.stop="drawer = !drawer">
                <v-icon>mdi-menu</v-icon>
            </v-btn>
        </v-app-bar>

        <v-main class="margin-bottom">
            <router-view/>
        </v-main>

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
        <v-main>
            <v-app-bar>
                <v-toolbar-title>
                    Lunch Money
                </v-toolbar-title>
            </v-app-bar>
            <v-container>
                <Login />
            </v-container>
        </v-main>
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
            ],
            drawer: null
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

    .margin-bottom {
        margin-bottom: 50px;
    }
</style>
