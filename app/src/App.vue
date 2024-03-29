<template>
    <v-app>
        <!-- Shown briefly while the initial login check is still running -->
        <loading v-if="!initialCheckCompleted"/>

        <!-- If logged in, show app contents -->
        <template v-else-if="isLoggedIn">
            <snow-overlay/>

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

            <template #action="{ attrs }">
                <v-btn v-bind="attrs" text @click="closeSnackbar">
                    Close
                </v-btn>
            </template>
        </v-snackbar>
    </v-app>
</template>

<script>
    import {EventService} from '@/services/eventService';
    import Loading from '@/views/Loading';
    import Login from '@/views/Login';
    import SnowOverlay from '@/components/SnowOverlay.vue';
    import {mapState} from 'pinia';
    import {useStore} from '@/store';

    export default {
        name: 'App',

        components: {
            Loading,
            Login,
            SnowOverlay,
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
                    // {
                    //     url:   '/menus',
                    //     title: 'Menus',
                    //     icon:  this.$icons.menu,
                    // },
                    {
                        url:   '/transfers',
                        title: 'Transfers',
                        icon:  this.$icons.transfers,
                    },
                    {
                        url:   '/stats',
                        title: 'Stats',
                        icon:  this.$icons.stats,
                    },
                ],
                drawerOpen:      false,
            };
        },

        mounted() {
            // Restore dark mode setting
            this.$vuetify.theme.dark = localStorage.getItem('dark-mode') === 'true';

            this.unregisterErrors = EventService.error.register(error => {
                this.$store().setGlobalSnackbar(`Error: ${error.message}`);
            });
            this.unregisterSystemMessage = EventService.systemMessage.register(message => {
                this.$store().setGlobalSnackbar(message);
            });

            this.$store().checkLogin();
        },

        computed: {
            ...mapState(useStore, [
                'isLoggedIn',
                'globalSnackbar',
            ]),

            initialCheckCompleted() {
                return this.$store().account.initialCheckCompleted;
            },
        },

        methods: {
            closeSnackbar() {
                this.$store().setGlobalSnackbar(null);
            },
        },

        beforeDestroy() {
            this.unregisterErrors();
            this.unregisterSystemMessage();
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

    .v-item-group.v-bottom-navigation {
        box-shadow: none !important;
    }

    .v-bottom-navigation {
        &.theme--light {
            color: $andeo-black !important;

            // Using a.v-btn to have higher specificity
            a.v-btn:not(.v-btn--active) {
                color: $andeo-black !important;
            }
            .v-btn--active {
                background: #f0f0f0 !important;
            }
        }
        &.theme--dark {
            color: white !important;

            a.v-btn:not(.v-btn--active) {
                color: white !important;
            }
            .v-btn--active {
                background: #404040 !important;
            }
        }
    }

    // This is to restore correct CSS precedence... not sure why it's broken.  There are other people with the same issues
    // https://github.com/vuetifyjs/vuetify/issues/7933
    // https://stackoverflow.com/questions/64037791/vuetify-css-for-buttons-loads-in-different-order-on-production-build-causing-is
    .v-item-group.v-bottom-navigation .v-btn {
        background-color: transparent;
        height: inherit;
        min-width: 80px;
    }
</style>
