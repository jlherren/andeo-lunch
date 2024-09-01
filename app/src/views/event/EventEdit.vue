<template>
    <v-main>
        <the-app-bar sub-page :to="backLink">
            {{ title }}

            <template #buttons>
                <v-btn :disabled="isBusy" color="primary" @click="save">Save</v-btn>
            </template>
        </the-app-bar>

        <shy-progress v-if="isBusy"/>

        <v-container>
            <v-form :disabled="isBusy" @submit.prevent="save()" ref="form">
                <v-text-field v-model="name" :rules="nameRules" label="Name" autofocus required
                              :append-icon="$icons.label"/>
                <al-date-picker v-model="date" required :disabled="!isNew"/>

                <v-row>
                    <v-col cols="6">
                        <number-field v-model="points" label="Points" :min="0" :icon="$icons.points" v-if="type !== 'label'"/>
                    </v-col>
                    <v-col cols="6">
                        <number-field v-model="vegetarianFactor" label="Vegetarian money factor" suffix="%"
                                      :min="0" :step="5" v-if="type === 'lunch'"/>
                    </v-col>
                </v-row>

                <v-textarea v-model="comment" label="Comments" placeholder="Ingredients, instructions, etc."
                            v-if="type !== 'label'"/>

                <div v-if="type === 'lunch' && isNew">
                    <v-checkbox label="Trigger default opt-ins" v-model="triggerDefaultOptIn" :disabled="dateIsInThePast"
                                :hint="defaultOptInHint" persistent-hint/>
                </div>

                <div v-if="type !== 'label' && noHelpersYet" class="helpers v-text-field">
                    <p class="text-body-2">
                        Select helpers to automatically distribute the available points evenly.
                    </p>
                    <v-btn v-for="user of visibleUsers" :key="user.id" :value="user.id" :disabled="isBusy || points === 0"
                           :input-value="isHelper(user)" @click="toggleHelper(user)" small>
                        <v-icon left :disabled="!isHelper(user)">{{ $icons.points }}</v-icon>
                        {{ user.name }}
                    </v-btn>
                </div>

                <v-row v-if="type === 'lunch'">
                    <v-col cols="6">
                        <v-checkbox v-model="useParticipationFlatRate" label="Participation flat-rate"/>
                    </v-col>
                    <v-col cols="6">
                        <v-text-field type="number" v-model="participationFlatRate" label="Participation costs" class="no-spinner"
                                      :append-icon="$icons.points" :disabled="!useParticipationFlatRate"/>
                    </v-col>
                </v-row>

                <v-text-field v-model="participationFee" label="Participation fee"
                              hint="Each participant will this fixed amount of money"
                              :min="0" v-if="type !== 'label'"
                              :append-icon="$icons.money"
                />

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
    import Vue from 'vue';
    import {mapState} from 'pinia';
    import {useStore} from '@/store';

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
                isNew:                    eventId === null,
                noHelpersYet:             false,
                eventId,
                type:                     null,
                name:                     '',
                date:                     null,
                points:                   0,
                vegetarianFactor:         50,
                comment:                  '',
                useParticipationFlatRate: true,
                participationFlatRate:    null,
                participationFee:         0,
                triggerDefaultOptIn:      true,

                nameRules: [
                    value => !!value || 'A name is required',
                ],

                isBusy: true,

                helpers: {},
            };
        },

        async created() {
            if (this.isNew) {
                // noinspection ES6MissingAwait
                this.$store().fetchUsers();
                await Promise.all([
                    this.$store().fetchDefaultFlatRate(),
                    this.$store().fetchDefaultParticipationFee(),
                ]);
                let defaultFlatRate = this.$store().defaultFlatRate;
                let defaultParticipationFee = this.$store().defaultParticipationFee;

                let query = this.$route.query;
                this.type = query?.type ?? 'lunch';
                this.name = query?.name ?? '';
                this.date = query?.date ?? null;
                this.comment = query?.comment ?? '';
                this.useParticipationFlatRate = defaultFlatRate !== null;
                this.participationFlatRate = defaultFlatRate;
                this.participationFee = this.type === 'lunch' ? defaultParticipationFee : 0.0;
                this.noHelpersYet = true;
                this.isBusy = false;
                return;
            }

            await this.$store().fetchEvent(this.eventId);
            let event = this.$store().event(this.eventId);
            if (event.type === 'transfer') {
                // Oops, you're in the wrong view, redirect.
                await this.$router.replace(`/transfers/${this.eventId}/edit`);
                return;
            }
            this.type = event.type;
            this.name = event.name;
            this.date = DateUtils.isoDate(event.date);
            this.points = event.costs?.points;
            this.vegetarianFactor = parseFloat((event.factors?.vegetarian.money * 100).toPrecision(4));
            this.comment = event.comment ?? '';
            this.useParticipationFlatRate = event.participationFlatRate !== null;
            this.participationFlatRate = event.participationFlatRate;
            if (this.participationFlatRate === null) {
                await this.$store().fetchDefaultFlatRate();
                this.participationFlatRate = this.$store().defaultFlatRate;
            }
            this.participationFee = event.participationFee;

            await this.$store().fetchParticipations(this.eventId);
            this.noHelpersYet = this.$store().participations(this.eventId)
                .every(participation => participation.credits.points === 0);

            this.isBusy = false;
        },

        computed: {
            ...mapState(useStore, [
                'visibleUsers',
            ]),

            title() {
                let prefix = this.isNew ? 'New' : 'Edit';
                return `${prefix} ${this.eventTypeName}`;
            },

            eventTypeName() {
                switch (this.type) {
                    case 'special':
                        return 'special event';

                    case null:
                        // This happens during loading
                        return '';

                    default:
                        // The rest of internal type names happen to coincide with english words
                        return this.type;
                }
            },

            backLink() {
                if (!this.isNew) {
                    return `/events/${this.eventId}`;
                }
                if (this.$route.query.date) {
                    return `/calendar/${this.$route.query.date}`;
                }
                return '/calendar';
            },

            dateIsInThePast() {
                return new Date(`${this.date}T12:00:00`) < new Date();
            },

            defaultOptInHint() {
                if (this.triggerDefaultOptIn) {
                    return 'Automatic opt-in and opt-out will be applied.';
                }
                return 'No default opt-ins will be applied!  Use this only for non-lunch meals!';
            },
        },

        methods: {
            isHelper(user) {
                return user.id in this.helpers;
            },

            toggleHelper(user) {
                if (user.id in this.helpers) {
                    Vue.delete(this.helpers, user.id);
                } else {
                    Vue.set(this.helpers, user.id, null);
                }
            },

            async save() {
                // For reasons I don't understand using <v-form v-model="valid"> will not work correctly.  The form
                // will randomly be considered invalid when it's not.
                if (!this.$refs.form.validate()) {
                    return;
                }
                try {
                    this.isBusy = true;
                    let data = {
                        name:    this.name,
                        comment: this.comment,
                    };
                    if (this.isNew) {
                        data.type = this.type;
                        // Use noon in local time zone
                        data.date = new Date(`${this.date}T12:00:00`);
                        data.triggerDefaultOptIn = this.triggerDefaultOptIn;
                    } else {
                        data.id = this.eventId;
                    }
                    if (this.type !== 'label') {
                        data.costs = {
                            points: this.points,
                        };
                        data.participationFee = this.participationFee;
                    }
                    if (this.type === 'lunch') {
                        data.factors = {
                            vegetarian: {
                                money: this.vegetarianFactor / 100,
                            },
                        };
                        data.participationFlatRate = this.useParticipationFlatRate ? this.participationFlatRate : null;
                    }

                    let eventId = await this.$store().saveEvent(data);

                    if (this.noHelpersYet) {
                        let helpers = Object.keys(this.helpers);
                        let datasets = helpers.map(userId => {
                            return {
                                eventId,
                                userId:  parseInt(userId, 10),
                                credits: {
                                    points: this.points / helpers.length,
                                },
                            };
                        });
                        await this.$store().saveParticipations(datasets);
                    }

                    await this.$router.back();
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

<style lang="scss" scoped>
    .helpers {
        .v-btn {
            margin: 0 8px 8px 0;
        }
    }
</style>
