<template>
    <v-card>
        <v-card-title>
            Default opt-in
        </v-card-title>

        <v-card-text>
            <div v-for="weekday of weekdays" :key="weekday.index">
                {{ weekday.name }}<br/>
                <participation-type-widget v-model="settings[`defaultOptIn${weekday.index}`]"
                                           :disabled="isBusy"/>
            </div>

            <v-switch hide-details :disabled="isBusy" v-model="settings.quickOptIn"
                      false-value="omnivorous" true-value="vegetarian">
                <template v-slot:label>
                    Quick opt-in as vegetarian
                </template>
            </v-switch>
        </v-card-text>

        <v-card-actions>
            <v-btn text @click.prevent="close()">
                Close
            </v-btn>
            <v-spacer/>
            <v-btn text @click.prevent="save()" color="primary">
                Save
            </v-btn>
        </v-card-actions>
    </v-card>
</template>

<script>
    import ParticipationTypeWidget from '@/components/event/ParticipationTypeWidget';
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
        name: 'DefaultOptInEdit',

        components: {
            ParticipationTypeWidget,
        },

        created() {
            this.reset();
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

        computed: {
            weekdays() {
                return Object.values(WEEKDAYS);
            },
        },

        methods: {
            async reset() {
                Object.assign(this.$data, this.$options.data.apply(this));
                await this.$store.dispatch('fetchSettings');
                this.settings = this.$store.getters.settings;
                this.isBusy = false;
            },

            async save() {
                try {
                    this.isBusy = true;

                    // Only send what potentially changed
                    let settingsUpdate = {};
                    for (let key of VALID_SETTINGS) {
                        settingsUpdate[key] = this.settings[key];
                    }
                    if (Object.keys(settingsUpdate).length) {
                        await this.$store.dispatch('saveSettings', settingsUpdate);
                    }
                    this.close();
                } catch (err) {
                    this.isBusy = false;
                }
            },

            close() {
                this.$emit('close');
            },
        },
    };
</script>
