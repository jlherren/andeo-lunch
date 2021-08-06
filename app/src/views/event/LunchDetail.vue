<template>
    <v-main>
        <the-app-bar sub-page>
            {{ name }}
            <template v-if="event" slot="buttons">
                <v-btn icon @click="openEditDialog" :disabled="isBusy">
                    <v-icon>{{ $icons.edit }}</v-icon>
                </v-btn>
                <v-btn icon @click="openConfirmDelete" :disabled="isBusy">
                    <v-icon>{{ $icons.delete }}</v-icon>
                </v-btn>
            </template>
        </the-app-bar>

        <shy-progress v-if="isBusy"/>

        <div v-if="event">
            <v-container class="center-text">
                <div class="headline">{{ name }}</div>
                <div class="text--secondary">{{ formattedDate }}</div>

                <div v-if="event.type !== 'label'" class="costs">
                    <participation-summary :participations="participations" :loading="participationsLoading" large/>
                    <balance :value="event.costs.points" points large no-sign/>
                    <balance :value="event.costs.money" money large no-sign/>
                </div>
            </v-container>

            <v-container v-if="!participationsLoading && event.type !== 'label' && ownParticipationMissing">
                <v-banner elevation="2" :icon="$icons.alertCircle">
                    Make up your mind!
                    <template v-slot:actions>
                        <v-btn text color="error" class="ml-1" :disabled="isBusy" @click="optOut">
                            <v-icon small left>{{ $icons.optOut }}</v-icon>
                            Opt-out
                        </v-btn>
                        <v-btn text color="primary" :disabled="isBusy" @click="optIn">
                            <v-icon small left>{{ optInIcon }}</v-icon>
                            Opt-in
                        </v-btn>
                    </template>
                </v-banner>
            </v-container>

            <v-list v-if="event.type !== 'label'">
                <v-skeleton-loader v-if="participationsLoading" type="list-item-avatar"/>

                <participation-list-item v-if="!participationsLoading" :participation="myParticipation"
                                         @saved="refreshEvent()"/>

                <participation-list-item v-for="participation of foreignParticipations"
                                         :key="participation.userId"
                                         :participation="participation"
                                         @saved="refreshEvent()"/>
            </v-list>

            <v-dialog v-model="edit" persistent>
                <lunch-edit ref="editDialog" :event="event" @close="edit = false"/>
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
                        <v-btn text @click="confirmDelete = false" :disabled="isBusy">Cancel</v-btn>
                        <v-spacer/>
                        <v-btn text @click="deleteEvent" :disabled="isBusy" color="error">Delete</v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>
        </div>
    </v-main>
</template>

<script>
    import * as DateUtils from '@/utils/dateUtils';
    import Balance from '@/components/Balance';
    import LunchEdit from '@/components/event/LunchEdit';
    import ParticipationListItem from '@/components/event/ParticipationListItem';
    import ParticipationSummary from '@/components/event/ParticipationSummary';
    import ShyProgress from '@/components/ShyProgress';
    import TheAppBar from '@/components/TheAppBar';
    import Vue from 'vue';

    const PASSIVE_TYPES = ['opt-out', 'undecided'];

    export default {
        name: 'LunchDetail',

        components: {
            ShyProgress,
            TheAppBar,
            Balance,
            ParticipationListItem,
            ParticipationSummary,
            LunchEdit,
        },

        data() {
            let eventId = parseInt(this.$route.params.id, 10);
            return {
                eventId,
                ownUserId:     this.$store.getters.ownUserId,
                edit:          false,
                confirmDelete: false,
                isBusy:        false,
            };
        },

        async created() {
            try {
                await this.$store.dispatch('fetchSettings');
                let event = this.$store.getters.event(this.eventId);
                if (event.type !== 'label') {
                    await this.$store.dispatch('fetchParticipations', {eventId: this.eventId});
                }
            } catch (err) {
                if (err?.response?.status === 404) {
                    await this.$router.push('/');
                }
            }
        },

        computed: {
            event() {
                return this.$store.getters.event(this.eventId);
            },

            name() {
                return this.event?.name || 'Loading...';
            },

            participations() {
                return this.$store.getters.participations(this.eventId) ?? [];
            },

            participationsLoading() {
                return !this.$store.getters.participations(this.eventId);
            },

            foreignParticipations() {
                // List of opt-inners as well as opt-out/undecided that cook or provide money.
                // This excludes own participation
                return this.participations.filter(p => {
                    if (p.userId === this.ownUserId) {
                        return false;
                    }
                    return !PASSIVE_TYPES.includes(p.type) || p.credits.points > 0 || p.credits.money > 0;
                });
            },

            myParticipation() {
                // User's own opt-out/undecided
                let participations = this.participations.filter(p => p.userId === this.ownUserId);
                if (participations.length > 0) {
                    return participations[0];
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

            formattedDate() {
                return this.event.date !== null ? DateUtils.displayFormat(this.event.date) : null;
            },

            ownParticipationMissing() {
                let myDecision = this.participations.filter(p => p.userId === this.ownUserId && p.type !== 'undecided');
                return myDecision.length === 0;
            },

            optInIcon() {
                return this.$icons[this.$store.getters.settings.quickOptIn];
            },
        },

        methods: {
            optIn() {
                this.setParticipation(this.$store.getters.settings.quickOptIn, true);
            },

            optOut() {
                // Not refetching the user here, because opt-out from undecided will never cause it to change
                this.setParticipation('opt-out', false);
            },

            async setParticipation(type, refetchUser) {
                try {
                    this.isBusy = true;
                    await this.$store.dispatch('saveParticipation', {
                        userId:  this.ownUserId,
                        eventId: this.eventId,
                        type,
                    });
                    // Not refetching the event here, because neither opt-in nor opt-out will ever cause it to change
                    if (refetchUser) {
                        await this.$store.dispatch('fetchUser', {userId: this.$store.getters.ownUserId});
                    }
                } finally {
                    this.isBusy = false;
                }
            },

            openEditDialog() {
                this.edit = true;
                Vue.nextTick(() => this.$refs.editDialog.reset());
            },

            openConfirmDelete() {
                this.confirmDelete = true;
            },

            async deleteEvent() {
                try {
                    this.isBusy = true;
                    await this.$store.dispatch('deleteEvent', {eventId: this.eventId});
                    this.confirmDelete = false;
                    this.$router.go(-1);
                } catch (err) {
                    this.isBusy = false;
                }
            },

            async refreshEvent() {
                await this.$store.dispatch('fetchEvent', {eventId: this.eventId});
            },
        },
    };
</script>

<style lang="scss" scoped>
    .costs {
        margin-top: 0.5ex;
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
