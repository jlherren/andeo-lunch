<template>
    <v-main v-if="event">
        <lm-app-bar sub-page>
            {{ event.name }}
            <template slot="buttons">
                <v-btn icon @click="openEditDialog">
                    <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn icon @click="openConfirmDelete">
                    <v-icon>mdi-delete</v-icon>
                </v-btn>
            </template>
        </lm-app-bar>

        <v-container class="center-text">
            <h2>{{ event.name }}</h2>
            <div class="text--secondary">{{ formattedDate }}</div>

            <div class="costs" v-if="event.type !== 'label'">
                <participation-summary :participations="participations"/>
                <balance :value="event.costs.points" points large/>
                <balance :value="event.costs.money" money large/>
            </div>
        </v-container>

        <v-container v-if="event.type !== 'label'">
            <v-banner v-if="ownParticipationMissing" elevation="2" single-line icon="mdi-information">
                Make up your mind!
                <template v-slot:actions>
                    <v-btn text color="error" class="ml-1" @click="optOut">
                        <v-icon small left>mdi-cancel</v-icon>
                        Opt-out
                    </v-btn>
                    <v-btn text color="primary" @click="optIn">
                        <v-icon small left>mdi-check</v-icon>
                        Opt-in
                    </v-btn>
                </template>
            </v-banner>
        </v-container>

        <v-tabs fixed-tabs v-model="tab" v-if="event.type !== 'label'">
            <v-tab key="participations">
                <v-icon>mdi-food-variant</v-icon>
            </v-tab>
            <v-tab key="money">
                <v-icon>mdi-cash-multiple</v-icon>
            </v-tab>
        </v-tabs>

        <v-tabs-items v-model="tab" v-if="event.type !== 'label'">
            <v-tab-item key="participations">
                <v-list>
                    <participation-list-item :participation="myParticipation"/>

                    <participation-list-item v-for="participation in activeParticipations"
                                             :key="participation.userId"
                                             :participation="participation"/>
                </v-list>
            </v-tab-item>

            <v-tab-item key="money">
                <v-list>
                    <participation-list-item v-for="participation in moneyProviders"
                                             :key="participation.userId"
                                             :participation="participation"/>

                </v-list>

                <v-container v-if="moneyProviders.length === 0">
                    <v-banner single-line>
                        <v-icon slot="icon">mdi-information</v-icon>
                        No buyers have been set.
                    </v-banner>
                </v-container>
            </v-tab-item>
        </v-tabs-items>

        <v-dialog v-model="edit">
            <edit-event :event="event" ref="editDialog" @close="edit = false"/>
        </v-dialog>

        <v-dialog v-model="confirmDelete">
            <v-card>
                <v-card-title>
                    Confirm
                </v-card-title>
                <v-card-text>
                    Really delete this event? All event and participation data will be deleted, this cannot
                    be undone.
                </v-card-text>
                <v-card-actions>
                    <v-btn text @click="confirmDelete = false">Cancel</v-btn>
                    <v-spacer/>
                    <v-btn text @click="deleteEvent" color="error">Delete</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-main>
</template>

<script>
    import LmAppBar from '@/components/lmAppBar';
    import ParticipationSummary from '@/components/menus/participationSummary';
    import ParticipationListItem from '@/components/menus/participationListItem';
    import Balance from '@/components/balance';
    import EditEvent from '@/components/editEvent';
    import Vue from 'vue';
    import * as DateUtils from '@/utils/dateUtils';

    const PASSIVE_TYPES = ['opt-out', 'undecided'];

    export default {
        name: 'EventDetail',

        components: {
            LmAppBar,
            Balance,
            ParticipationListItem,
            ParticipationSummary,
            EditEvent,
        },

        async created() {
            try {
                let event = await this.$store.dispatch('fetchEvent', {eventId: this.eventId});
                if (event.type !== 'label') {
                    await this.$store.dispatch('fetchParticipations', {eventId: this.eventId});
                }
            } catch (err) {
                if (err?.response?.status === 404) {
                    await this.$router.push('/');
                }
            }
        },

        data() {
            let eventId = parseInt(this.$route.params.id, 10);
            return {
                eventId,
                tab:           'participations',
                ownUserId:     this.$store.getters.ownUserId,
                edit:          false,
                confirmDelete: false,
            };
        },

        computed: {
            event() {
                return this.$store.getters.event(this.eventId);
            },

            participations() {
                return this.$store.getters.participations(this.eventId) ?? [];
            },

            activeParticipations() {
                // List of opt-inners as well as opt-out/undecided that cook.  Excluding own participation
                return this.participations.filter(p => {
                    if (p.userId === this.ownUserId) {
                        return false;
                    }
                    return !PASSIVE_TYPES.includes(p.type) || p.credits.points > 0;
                });
            },

            myParticipation() {
                // User's own opt-out/undecided
                let p = this.participations.filter(p => p.userId === this.ownUserId);
                if (p.length > 0) {
                    return p[0];
                }
                // Participation is missing, fake it
                return {
                    userId:  this.ownUserId,
                    eventId: this.eventId,
                    type:    'undecided',
                    credits: {
                        points: 0,
                        money:  0,
                    },
                };
            },

            moneyProviders() {
                return this.participations.filter(p => p.credits.money);
            },

            formattedDate() {
                return this.event.date !== null ? DateUtils.displayFormat(this.event.date) : null;
            },

            ownParticipationMissing() {
                let myDecision = this.participations.filter(p => p.userId === this.ownUserId && p.type !== 'undecided');
                return myDecision.length === 0;
            },
        },

        methods: {
            optIn() {
                this.$store.dispatch('saveParticipation', {
                    userId:  this.ownUserId,
                    eventId: this.eventId,
                    // TODO: Change default type based on user preferences
                    type:    'omnivorous',
                });
            },

            optOut() {
                this.$store.dispatch('saveParticipation', {
                    userId:  this.ownUserId,
                    eventId: this.eventId,
                    type:    'opt-out',
                });
            },

            openEditDialog() {
                this.edit = true;
                Vue.nextTick(() => this.$refs.editDialog.reset());
            },

            openConfirmDelete() {
                this.confirmDelete = true;
            },

            async deleteEvent() {
                await this.$store.dispatch('deleteEvent', {eventId: this.eventId});
                this.confirmDelete = false;
                this.$router.go(-1);
            },
        },
    };
</script>

<style lang="scss" scoped>
    .costs {
        //margin-left: 30px;
        color: #C62828;
        font-size: 28pt;

        .v-icon {
            font-size: inherit;
            color: inherit;
        }

        span {
            margin: 0 0.5em;
        }
    }

    .participants-and-cost {
        text-align: center;
    }
</style>
