<template>
    <v-main>
        <the-app-bar sub-page>
            Preferences
        </the-app-bar>

        <v-container>
            <v-banner :icon="$icons.alert">
                Settings marked with
                <v-icon small>{{ $icons.alert }}</v-icon>
                have not yet been implemented.
            </v-banner>
        </v-container>

        <v-list>
            <v-list-item>
                <v-list-item-content>
                    <v-list-item-title>
                        Username
                    </v-list-item-title>
                    <v-list-item-subtitle>
                        {{ $store.getters.ownUser.username }}
                    </v-list-item-subtitle>
                </v-list-item-content>
            </v-list-item>

            <v-list-item>
                <v-list-item-content>
                    <v-list-item-title>
                        Display name
                        <v-icon small>{{ $icons.alert }}</v-icon>
                    </v-list-item-title>
                    <v-list-item-subtitle>
                        {{ $store.getters.ownUser.name }}
                    </v-list-item-subtitle>
                </v-list-item-content>
                <v-list-item-action>
                    <v-icon>{{ $icons.chevronRight }}</v-icon>
                </v-list-item-action>
            </v-list-item>

            <v-list-item @click.prevent="openDefaultOptInModal()">
                <v-list-item-content>
                    <v-list-item-title>
                        Default opt-in
                    </v-list-item-title>
                    <v-list-item-subtitle>
                        {{ defaultOptIn }}
                    </v-list-item-subtitle>
                </v-list-item-content>
                <v-list-item-action>
                    <v-icon>{{ $icons.chevronRight }}</v-icon>
                </v-list-item-action>
            </v-list-item>

            <v-list-item>
                <v-list-item-content>
                    <v-list-item-title>
                        Dietary information
                        <v-icon small>{{ $icons.alert }}</v-icon>
                    </v-list-item-title>
                    <v-list-item-subtitle>
                        None
                    </v-list-item-subtitle>
                </v-list-item-content>
                <v-list-item-action>
                    <v-icon>{{ $icons.chevronRight }}</v-icon>
                </v-list-item-action>
            </v-list-item>

            <v-list-item>
                <v-list-item-content>
                    <v-list-item-title>
                        Use dark mode
                    </v-list-item-title>
                </v-list-item-content>
                <v-list-item-action>
                    <v-switch :value="$vuetify.theme.dark" @change="toggleDarkMode"/>
                </v-list-item-action>
            </v-list-item>
        </v-list>

        <v-dialog v-model="defaultOptInModal" persistent>
            <default-opt-in-edit ref="optInModal" @close="defaultOptInModal = false"/>
        </v-dialog>
    </v-main>
</template>

<script>
    import DefaultOptInEdit from '@/components/DefaultOptInEdit';
    import TheAppBar from '@/components/TheAppBar';
    import Vue from 'vue';
    import {WEEKDAYS} from '@/utils/dateUtils';

    export default {
        name: 'Preferences',

        components: {
            DefaultOptInEdit,
            TheAppBar,
        },

        props: {},

        created() {
            let userId = this.$store.getters.ownUserId;
            this.$store.dispatch('fetchUser', {userId});
            this.$store.dispatch('fetchSettings');
        },

        data() {
            return {
                defaultOptInModal: false,

                weekdays: [
                    {
                        name:  'Monday',
                        index: 1,
                    },
                    {
                        name:  'Tuesday',
                        index: 2,
                    },
                    {
                        name:  'Wednesday',
                        index: 3,
                    },
                    {
                        name:  'Thursday',
                        index: 4,
                    },
                    {
                        name:  'Friday',
                        index: 5,
                    },
                ],
            };
        },

        computed: {
            defaultOptIn() {
                let settings = this.$store.getters.settings;
                let optInValues = ['omnivorous', 'vegetarian'];
                let optInDays = [];
                for (let i = 1; i <= 5; i++) {
                    if (optInValues.includes(settings[`defaultOptIn${i}`])) {
                        optInDays.push(WEEKDAYS[i].name);
                    }
                }
                let description = optInDays.length ? optInDays.join(', ') : 'None';
                if (settings.quickOptIn === 'vegetarian') {
                    description += ', vegetarian';
                }
                return description;
            },
        },

        methods: {
            openDefaultOptInModal() {
                this.defaultOptInModal = true;
                Vue.nextTick(() => this.$refs.optInModal.reset());
            },

            toggleDarkMode() {
                this.$vuetify.theme.dark = !this.$vuetify.theme.dark;
                localStorage.setItem('dark-mode', this.$vuetify.theme.dark ? 'true' : 'false');
            },
        },
    };
</script>
