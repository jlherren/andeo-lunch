<template>
    <v-main>
        <the-app-bar sub-page :to="backLink">
            {{ title }}

            <template v-slot:buttons>
                <v-btn :disabled="isBusy" color="primary" @click="save">Save</v-btn>
            </template>
        </the-app-bar>

        <shy-progress v-if="isBusy"/>

        <v-container>
            <v-form :disabled="isBusy" @submit.prevent="save()" ref="form">
                <v-text-field v-model="name" :rules="nameRules" label="Name" autofocus required
                              :append-icon="$icons.label"/>
                <al-date-picker v-model="date" required/>

                <template v-if="type !== 'label'">
                    <number-field v-model="points" label="Points" :min="0" :icon="$icons.points"/>
                    <number-field v-model="vegetarianFactor" label="Vegetarian factor" suffix="%"
                                  :min="0" :max="100" :step="5"/>
                </template>

                <!-- Button is to make it submittable by pressing enter -->
                <v-btn type="submit" :disabled="isBusy" v-show="false">Save</v-btn>
            </v-form>
        </v-container>
    </v-main>
</template>

<script>
    import * as DateUtils from '@/utils/dateUtils';
    import AlDatePicker from '@/components/AlDatePicker';
    import NumberField from '@/components/NumberField';
    import ShyProgress from '../../components/ShyProgress';
    import TheAppBar from '../../components/TheAppBar';

    export default {
        name: 'EventEdit',

        components: {
            AlDatePicker,
            NumberField,
            ShyProgress,
            TheAppBar,
        },

        data() {
            let eventId = this.$route.params.id;
            eventId = eventId ? parseInt(eventId, 10) : null;

            return {
                eventId,
                type:             null,
                name:             '',
                date:             null,
                points:           0,
                vegetarianFactor: 50,

                nameRules: [
                    v => !!v || 'A name is required',
                ],

                isBusy: false,
            };
        },

        async created() {
            if (!this.eventId) {
                let query = this.$route.query;
                this.type = query?.type ?? 'lunch';
                this.name = query?.name ?? '';
                this.date = query?.date ?? null;
                return;
            }

            this.isBusy = true;
            await this.$store.dispatch('fetchEvent', {eventId: this.eventId});
            let event = this.$store.getters.event(this.eventId);
            if (event.type === 'transfer') {
                // Oops, you're in the wrong view, redirect.
                await this.$router.push(`/transfers/${this.eventId}/edit`);
                return;
            }
            this.type = event.type;
            this.name = event.name;
            this.date = DateUtils.isoDate(event.date);
            this.points = event.costs.points;
            this.vegetarianFactor = parseFloat((event.factors.vegetarian.money * 100).toPrecision(4));
            this.isBusy = false;
        },

        computed: {
            title() {
                let prefix = this.eventId ? 'Edit' : 'New';
                return `${prefix} ${this.eventTypeName}`;
            },

            eventTypeName() {
                switch (this.type) {
                    case 'special':
                        return 'special event';

                    default:
                        // The rest of internal type names happen to coincide with english words
                        return this.type;
                }
            },

            backLink() {
                if (this.eventId) {
                    return `/events/${this.eventId}`;
                }
                if (this.$route.query.date) {
                    return `/calendar/${this.$route.query.date}`;
                }
                return '/calendar';
            },
        },

        methods: {
            async save() {
                // For reasons I don't understand using <v-form v-model="valid"> will not work correctly.  The form
                // will randomly be considered invalid when it's not.
                if (!this.$refs.form.validate()) {
                    return;
                }
                try {
                    this.isBusy = true;
                    let data = {
                        name: this.name,
                        // Use noon in local time zone
                        date: new Date(`${this.date}T12:00:00`),
                    };
                    let eventId = this.eventId;
                    if (eventId) {
                        data.id = eventId;
                    } else {
                        data.type = this.type;
                    }
                    if (this.type !== 'label') {
                        data.costs = {
                            points: this.points,
                        };
                        data.factors = {
                            vegetarian: {
                                money: this.vegetarianFactor / 100,
                            },
                        };
                    }
                    eventId = await this.$store.dispatch('saveEvent', data);
                    await this.$router.push(`/events/${eventId}`);
                } catch (err) {
                    // Disabled flag is only released on errors, otherwise we risk double saving after the first
                    // one is successful and the modal is closing.
                    this.isBusy = false;
                    throw err;
                }
            },
        },
    };
</script>
