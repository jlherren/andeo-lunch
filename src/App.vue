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
            <router-view :key="$route.path"/>

            <v-bottom-navigation app>
                <v-btn v-for="link of navigationLinks" :to="link.url" :key="link.title">
                    <span>{{ link.title }}</span>
                    <v-icon>{{ link.icon }}</v-icon>
                </v-btn>
            </v-bottom-navigation>
        </template>

        <!-- If not logged in, show login page -->
        <template v-else>
            <Login/>
        </template>

        <v-snackbar :value="globalSnackbar !== null" @input="closeSnackbar" timeout="5000">
            {{ globalSnackbar }}

            <template v-slot:action="{ attrs }">
                <v-btn text v-bind="attrs" @click="closeSnackbar">
                    Close
                </v-btn>
            </template>
        </v-snackbar>
    </v-app>
</template>

<script>
    import Login from './views/Login';
    import {mapGetters} from 'vuex';
    import {ErrorService} from '@/services/errorService';

    export default {
        name: 'App',

        components: {
            Login,
        },

        data: () => ({
            navigationLinks: [
                {
                    url:   '/',
                    title: 'Home',
                    icon:  'mdi-home',
                },
                {
                    url:   '/calendar',
                    title: 'Calendar',
                    icon:  'mdi-calendar',
                },
                {
                    url:   '/menus',
                    title: 'Menus',
                    icon:  'mdi-silverware',
                },
                {
                    url:   '/cash',
                    title: 'Cash',
                    icon:  'mdi-cash',
                },
            ],
            drawerOpen:      false,
        }),

        computed: {
            ...mapGetters([
                'isLoggedIn',
                'globalSnackbar',
            ]),

            initialCheckCompleted() {
                return this.$store.state.account.initialCheckCompleted;
            },
        },

        methods: {
            closeSnackbar() {
                this.$store.commit('globalSnackbar', null);
            },
        },

        mounted() {
            this.unregisterErrors = ErrorService.instance.register(error => {
                this.$store.commit('globalSnackbar', `Error: ${error.message}`);
            });
            this.$store.dispatch('checkLogin');
        },

        beforeDestroy() {
            this.unregisterErrors();
        },
    };
</script>

<style lang="scss">
    @import '~@fontsource/roboto/100.css';
    @import '~@fontsource/roboto/300.css';
    @import '~@fontsource/roboto/400.css';
    @import '~@fontsource/roboto/500.css';
    @import '~@fontsource/roboto/700.css';
    @import '~@fontsource/roboto/900.css';

    .center-text {
        text-align: center;
    }

    .v-input.no-spinner {
        input {
            // Firefox
            -moz-appearance: textfield;

            // Chrome, Edge, Safari
            &::-webkit-outer-spin-button, &::-webkit-inner-spin-button {
                -webkit-appearance: none;
                margin: 0;
            }
        }
    }

    html {
        overflow-y: auto
    }
</style>
