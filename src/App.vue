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

        <v-snackbar v-model="errorSnackbarOpen" timeout="5000">
            {{ errorSnackbarText }}

            <template v-slot:action="{ attrs }">
                <v-btn text v-bind="attrs" @click="errorSnackbarOpen = false">
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
            navigationLinks:   [
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
            drawerOpen:        false,
            errorSnackbarOpen: false,
            errorSnackbarText: null,
        }),

        computed: {
            ...mapGetters([
                'isLoggedIn',
            ]),

            initialCheckCompleted() {
                return this.$store.state.account.initialCheckCompleted;
            },
        },

        methods: {
            error(error) {
                this.errorSnackbarOpen = true;
                this.errorSnackbarText = `Error: ${error.message}`;
            },
        },

        mounted() {
            this.$store.dispatch('checkLogin');
            this.unregisterErrors = ErrorService.instance.register(this.error);
        },

        beforeDestroy() {
            this.unregisterErrors();
        },
    };
</script>

<style lang="scss">
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
