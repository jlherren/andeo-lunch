<template>
    <v-main>
        <the-app-bar>
            Preferences
        </the-app-bar>

        <v-list>
            <v-list-item to="/preferences/default-opt-in">
                <v-list-item-icon>
                    <v-icon>{{ $icons.checkboxMultipleMarked }}</v-icon>
                </v-list-item-icon>
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

            <v-list-item to="/preferences/absences">
                <v-list-item-icon>
                    <v-icon>{{ $icons.absence }}</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                    <v-list-item-title>
                        Absences
                    </v-list-item-title>
                </v-list-item-content>
                <v-list-item-action>
                    <v-icon>{{ $icons.chevronRight }}</v-icon>
                </v-list-item-action>
            </v-list-item>

            <v-list-item>
                <v-list-item-icon>
                    <v-icon>{{ $icons.lunch }}</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                    <v-list-item-title>
                        Dietary information
                    </v-list-item-title>
                    <v-list-item-subtitle>
                        <v-icon small>{{ $icons.alert }}</v-icon>
                        Not implemented yet
                    </v-list-item-subtitle>
                </v-list-item-content>
                <v-list-item-action>
                    <v-icon>{{ $icons.chevronRight }}</v-icon>
                </v-list-item-action>
            </v-list-item>

            <v-list-item>
                <v-list-item-icon>
                    <v-icon>{{ $icons.darkMode }}</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                    <v-list-item-title>
                        Use dark mode
                    </v-list-item-title>
                </v-list-item-content>
                <v-list-item-action>
                    <v-switch v-model="darkMode"/>
                </v-list-item-action>
            </v-list-item>
        </v-list>
    </v-main>
</template>

<script>
    import TheAppBar from '@/components/TheAppBar';
    import {WEEKDAYS} from '@/utils/dateUtils';

    export default {
        name: 'Preferences',

        components: {
            TheAppBar,
        },

        props: {},

        data() {
            return {
                darkMode:          this.$vuetify.theme.dark,

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

        created() {
            this.$store().fetchSettings();
        },

        computed: {
            defaultOptIn() {
                let settings = this.$store().settings;
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

        watch: {
            darkMode(value) {
                this.$vuetify.theme.dark = value;
                localStorage.setItem('dark-mode', value ? 'true' : 'false');
            },
        },
    };
</script>
