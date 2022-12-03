<template>
    <v-main>
        <the-app-bar sub-page>
            Default opt-ins

            <template #buttons>
                <v-btn :disabled="isBusy" @click="save" color="primary">
                    Save
                </v-btn>
            </template>
        </the-app-bar>

        <shy-progress v-if="isBusy"/>

        <v-container>
            <p class="text-body-1">
                Default opt-ins allow to set defaults based on the day of the week.  They
                will only affect newly created lunches and never existing lunches.
            </p>

            <div v-for="weekday of weekdays" :key="weekday.index">
                {{ weekday.name }}<br/>
                <participation-type-widget v-model="settings[`defaultOptIn${weekday.index}`]"
                                           :disabled="isBusy" event-type="lunch"/>
            </div>

            <v-switch hide-details :disabled="isBusy" v-model="settings.quickOptIn"
                      false-value="omnivorous" true-value="vegetarian">
                <template #label>
                    Quick opt-in as vegetarian
                </template>
            </v-switch>
        </v-container>
    </v-main>
</template>

<script>
    import ParticipationTypeWidget from '@/components/event/ParticipationTypeWidget';
    import ShyProgress from '../../components/ShyProgress';
    import TheAppBar from '../../components/TheAppBar';
    import {WEEKDAYS} from '@/utils/dateUtils';

    const VALID_SETTINGS = [
        'defaultOptIn1',
        'defaultOptIn2',
        'defaultOptIn3',
        'defaultOptIn4',
        'defaultOptIn5',
        'quickOptIn',
    ];

    export default {
        name: 'DefaultOptIn',

        components: {
            ParticipationTypeWidget,
            ShyProgress,
            TheAppBar,
        },

        data() {
            return {
                isBusy:   true,
                settings: {
                    // These defaults might be displayed very briefly before fetching settings has completed
                    defaultOptIn1: 'undecided',
                    defaultOptIn2: 'undecided',
                    defaultOptIn3: 'undecided',
                    defaultOptIn4: 'undecided',
                    defaultOptIn5: 'undecided',
                    quickOptIn:    'omnivorous',
                },
            };
        },

        async created() {
            await this.$store().fetchSettings();
            this.settings = this.$store().settings;
            this.isBusy = false;
        },

        computed: {
            weekdays() {
                return Object.values(WEEKDAYS);
            },
        },

        methods: {
            async save() {
                try {
                    this.isBusy = true;

                    // Only send what potentially changed
                    let settingsUpdate = {};
                    for (let key of VALID_SETTINGS) {
                        settingsUpdate[key] = this.settings[key];
                    }
                    console.log(settingsUpdate);
                    if (Object.keys(settingsUpdate).length) {
                        await this.$store().saveSettings(settingsUpdate);
                    }
                    await this.$router.back();
                } catch (err) {
                    this.isBusy = false;
                    throw err;
                }
            },
        },
    };
</script>
