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
                <al-date-picker v-model="date" required :disabled="!!eventId"/>

                <template v-if="type !== 'label'">
                    <number-field v-model="points" label="Points" :min="0" :icon="$icons.points"/>
                    <number-field v-model="vegetarianFactor" label="Vegetarian factor" suffix="%"
                                  :min="0" :max="100" :step="5"/>
                </template>

                <v-textarea v-model="comment" label="Comments" placeholder="Ingredients, instructions, etc."/>

                <div v-if="type !== 'label' && !eventId" class="helpers">
                    <p class="text-body-2">
                        Select helpers to automatically distribute the available points evenly.
                    </p>
                    <v-btn v-for="user of users" :key="user.id" :value="user.id" :disabled="isBusy || points === 0"
                           :input-value="isHelper(user)" @click="toggleHelper(user)" small>
                        <v-icon left :disabled="!isHelper(user)">{{ $icons.points }}</v-icon>
                        {{ user.name }}
                    </v-btn>
                </div>

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
    import {mapGetters} from 'vuex';

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
                comment:          '',

                nameRules: [
                    v => !!v || 'A name is required',
                ],

                isBusy: false,

                helpers: {},
            };
        },

        async created() {
            if (!this.eventId) {
                // noinspection ES6MissingAwait
                this.$store.dispatch('fetchUsers');

                let query = this.$route.query;
                this.type = query?.type ?? 'lunch';
                this.name = query?.name ?? '';
                this.date = query?.date ?? null;
                this.comment = query?.comment ?? '';
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
            this.comment = event.comment ?? '';
            this.isBusy = false;
        },

        computed: {
            ...mapGetters([
                'users',
            ]),

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
            isHelper(user) {
                return this.helpers[user.id];
            },

            toggleHelper(user) {
                Vue.set(this.helpers, user.id, !this.helpers[user.id]);
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
                    let isNew = !this.eventId;
                    if (isNew) {
                        data.type = this.type;
                        // Use noon in local time zone
                        data.date = new Date(`${this.date}T12:00:00`);
                    } else {
                        data.id = this.eventId;
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

                    let eventId = await this.$store.dispatch('saveEvent', data);

                    if (isNew) {
                        let userIds = Object.keys(this.helpers).map(id => parseInt(id, 10));
                        let datasets = userIds.map(userId => {
                            return {
                                eventId,
                                userId,
                                credits: {
                                    points: this.points / userIds.length,
                                },
                            };
                        });
                        await this.$store.dispatch('saveParticipations', datasets);
                    }

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

<style lang="scss" scoped>
    .helpers {
        .v-btn {
            margin: 0 8px 8px 0;
        }
    }
</style>
