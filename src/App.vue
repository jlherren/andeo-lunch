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
                <v-btn v-for="link of navigationLinks" :key="link.title" :to="link.url">
                    <span>{{ link.title }}</span>
                    <v-icon>{{ link.icon }}</v-icon>
                </v-btn>
            </v-bottom-navigation>
        </template>

        <!-- If not logged in, show login page -->
        <template v-else>
            <Login/>
        </template>

        <v-snackbar :value="globalSnackbar !== null" timeout="5000" @input="closeSnackbar">
            {{ globalSnackbar }}

            <template v-slot:action="{ attrs }">
                <v-btn v-bind="attrs" text @click="closeSnackbar">
                    Close
                </v-btn>
            </template>
        </v-snackbar>

        <v-dialog v-model="updateAvailable">
            <v-card>
                <v-card-title>
                    Update available
                </v-card-title>
                <v-card-text>
                    A new version is available.  Reload to update?
                </v-card-text>
                <v-card-actions>
                    <v-btn text @click.prevent="updateAvailable = false">Cancel</v-btn>
                    <v-spacer/>
                    <v-btn text color="primary" @click.prevent="reload()">Update</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-app>
</template>

<script>
    import {ErrorService} from '@/services/errorService';
    import Login from '@/views/Login';
    import {UpdateService} from '@/services/updateService';
    import {mapGetters} from 'vuex';

    export default {
        name: 'App',

        components: {
            Login,
        },

        data() {
            return {
                navigationLinks: [
                    {
                        url:   '/',
                        title: 'Home',
                        icon:  this.$icons.home,
                    },
                    {
                        url:   '/calendar',
                        title: 'Calendar',
                        icon:  this.$icons.calendar,
                    },
                    {
                        url:   '/menus',
                        title: 'Menus',
                        icon:  this.$icons.menu,
                    },
                    {
                        url:   '/transfer',
                        title: 'Transfer',
                        icon:  this.$icons.transfer,
                    },
                ],
                drawerOpen:      false,
                updateAvailable: false,
            };
        },

        mounted() {
            // Restore dark mode setting
            this.$vuetify.theme.dark = localStorage.getItem('dark-mode') === 'true';

            this.unregisterErrors = ErrorService.instance.register(error => {
                this.$store.commit('globalSnackbar', `Error: ${error.message}`);
            });
            this.$store.dispatch('checkLogin');

            this.unregisterUpdateHandler = UpdateService.instance.register(() => {
                this.updateAvailable = true;
            });
        },

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

            reload() {
                window.location.reload();
            },
        },

        beforeDestroy() {
            this.unregisterErrors();
            this.unregisterUpdateHandler();
        },
    };
</script>

<style lang="scss">
    @import '~@fontsource/roboto/latin-100.css';
    @import '~@fontsource/roboto/latin-300.css';
    @import '~@fontsource/roboto/latin-400.css';
    @import '~@fontsource/roboto/latin-500.css';
    @import '~@fontsource/roboto/latin-700.css';
    @import '~@fontsource/roboto/latin-900.css';

    @import './scss/global.scss';

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

    // There is a rule ".v-avatar svg" that sets these to "inherit" for some reason
    .v-avatar .v-icon__svg {
        width: 24px;
        height: 24px;
    }

    html {
        overflow-y: auto
    }
</style>
