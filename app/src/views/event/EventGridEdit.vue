<template>
    <v-main>
        <the-app-bar sub-page :to="`/events/${eventId}`">
            Grid edit

            <template #buttons>
                <v-btn color="primary" @click="save" :disabled="isBusy">Save</v-btn>
            </template>
        </the-app-bar>

        <shy-progress v-if="isBusy"/>

        <v-form ref="form" :disabled="isBusy" @submit.prevent="save()">
            <v-simple-table class="grid-edit-table">
                <template #default>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Participation type</th>
                            <th>Points credited</th>
                            <th>Money credited</th>
                            <th>Money factor</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="row of rows" :key="row.id">
                            <td :class="{'modified': row.modified}">
                                {{ row.name }}
                            </td>
                            <td>
                                <ParticipationTypeMiniWidget :event-type="event.type" v-model="row.type" :disabled="isBusy" @input="modified(row)"/>
                            </td>
                            <td>
                                <v-text-field type="number" v-model="row.pointsCredit" min="0" class="no-spinner" :disabled="isBusy" dense hide-details
                                              @input="modified(row)" :rules="rules"/>
                            </td>
                            <td>
                                <v-text-field type="number" v-model="row.moneyCredit" min="0" class="no-spinner" :disabled="isBusy" dense hide-details
                                              @input="modified(row)" :rules="rules"/>
                            </td>
                            <td>
                                <v-text-field type="number" v-model="row.moneyFactor" min="0" step="5" class="no-spinner"
                                              dense hide-details
                                              :disabled="isBusy || event.type !== 'special' || row.type === 'opt-out'"
                                              @input="modified(row)" :rules="rules"
                                />
                            </td>
                        </tr>
                    </tbody>
                </template>
            </v-simple-table>

            <!-- Button is to make it submittable by pressing enter -->
            <v-btn type="submit" :disabled="isBusy" v-show="false">Save</v-btn>
        </v-form>
    </v-main>
</template>

<script>
    import ParticipationTypeMiniWidget from '@/components/event/ParticipationTypeMiniWidget';
    import ShyProgress from '@/components/ShyProgress';
    import TheAppBar from '@/components/TheAppBar';

    export default {
        name: 'EventGridEdit',

        components: {
            ParticipationTypeMiniWidget,
            ShyProgress,
            TheAppBar,
        },

        data() {
            let eventId = this.$route.params.id;
            eventId = eventId ? parseInt(eventId, 10) : null;

            return {
                test:   'opt-in',
                eventId,
                name:   '',
                isBusy: true,
                rows:   [],
                rules:  [
                    v => v !== '' || 'This field is required',
                ],
            };
        },

        async created() {
            await Promise.all([
                this.$store().fetchEvent({eventId: this.eventId}),
                this.$store().fetchParticipations({eventId: this.eventId}),
                this.$store().fetchUsers(),
            ]);
            let event = this.$store().event(this.eventId);
            if (event.type === 'transfer') {
                await this.$router.replace(`/transfers/${this.eventId}`);
                return;
            }
            if (event.type === 'label') {
                await this.$router.replace(`/events/${this.eventId}`);
                return;
            }
            // this.type = event.type;
            this.name = event.name;
            this.rows = this.createRows();
            this.isBusy = false;
        },

        computed: {
            event() {
                let event = this.$store().event(this.eventId);
                return event?.type !== 'transfer' ? event : null;
            },
        },

        methods: {
            createRows() {
                let participations = this.$store().participations(this.eventId);

                if (!participations || !this.event) {
                    return [];
                }

                let fakeParticipationType = this.event.type === 'special' ? 'opt-out' : 'undecided';
                let fakeParticipations = this.$store().visibleUsers.filter(user => !participations.some(participation => participation.userId === user.id))
                    .map(user => {
                        return {
                            userId:       user.id,
                            type:         fakeParticipationType,
                            pointsCredit: 0,
                            moneyCredit:  0,
                            moneyFactor:  0,
                            modified:     false,
                        };
                    });

                participations = participations.concat(fakeParticipations).map(
                    participation => {
                        return {
                            userId:       participation.userId,
                            name:         this.$store().user(participation.userId).name,
                            type:         participation.type,
                            pointsCredit: participation.credits?.points ?? 0,
                            moneyCredit:  participation.credits?.money ?? 0,
                            moneyFactor:  (participation.factors?.money ?? 1) * 100,
                            modified:     false,
                        };
                    },
                );

                participations = participations.sort((first, second) => {
                    if (first.name < second.name) {
                        return -1;
                    }
                    if (first.name > second.name) {
                        return 1;
                    }
                    return 0;
                });

                return participations;
            },

            modified(row) {
                row.modified = true;
            },

            async save() {
                if (!this.$refs.form.validate()) {
                    return;
                }
                this.isBusy = true;
                try {
                    let saveData = this.rows.filter(row => row.modified)
                        .map(row => this.createSaveData(row));
                    await this.$store().saveParticipations(saveData);
                    await this.$router.back();
                } catch (err) {
                    this.isBusy = false;
                    throw err;
                }
            },

            createSaveData(row) {
                return {
                    userId:  row.userId,
                    eventId: this.eventId,
                    type:    row.type,
                    credits: {
                        points: row.pointsCredit,
                        money:  row.moneyCredit,
                    },
                    factors: {
                        money: row.moneyFactor / 100,
                    },
                };
            },
        },
    };
</script>

<style lang="scss" scoped>
    .modified {
        color: $andeo-blue;
    }
</style>

<style lang="scss">
    .grid-edit-table.theme--light .error--text input {
        background: #ffc0c0;
    }

    .grid-edit-table.theme--dark .error--text input {
        background: #600000;
    }
</style>
