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

        <v-list subheader>
            <v-subheader>
                Default opt-in
            </v-subheader>

            <v-list-item v-for="weekday of weekdays" :key="weekday.index">
                <v-list-item-content>
                    <v-list-item-title>
                        {{ weekday.name }}
                        <v-icon small>{{ $icons.alert }}</v-icon>
                    </v-list-item-title>
                    <v-list-item-subtitle>
                        Opt-in
                    </v-list-item-subtitle>
                </v-list-item-content>
                <v-list-item-action>
                    <v-icon>{{ $icons.chevronRight }}</v-icon>
                </v-list-item-action>
            </v-list-item>

            <v-list-item>
                <v-list-item-content>
                    <v-list-item-title>
                        Quick opt-in as vegetarian
                        <v-icon small>{{ $icons.alert }}</v-icon>
                    </v-list-item-title>
                </v-list-item-content>
                <v-list-item-action>
                    <v-switch/>
                </v-list-item-action>
            </v-list-item>

            <v-list-item>
                <v-list-item-content>
                    <v-list-item-title>
                        Default notes
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

            <v-subheader>
                App settings
            </v-subheader>

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
    </v-main>
</template>

<script>
    import TheAppBar from '@/components/TheAppBar';

    export default {
        name: 'Preferences',

        components: {
            TheAppBar,
        },

        props: {},

        data() {
            return {
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

        methods: {
            toggleDarkMode() {
                this.$vuetify.theme.dark = !this.$vuetify.theme.dark;
                localStorage.setItem('dark-mode', this.$vuetify.theme.dark ? 'true' : 'false');
            },
        },
    };
</script>
