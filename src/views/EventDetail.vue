<template>
    <v-main>
        <lm-app-bar sub-page>{{ event.name }}</lm-app-bar>

        <v-container class="center-text">
            <h2>{{ event.name }}</h2>
            <div class="text--secondary">{{ formattedDate }}</div>

            <div class="costs">
                <participation-summary :participations="participations"/>
                <span>{{ event.costs.points }} <v-icon>mdi-handshake</v-icon></span>
                <span>{{ event.costs.money }} CHF</span>
            </div>
        </v-container>

        <v-container>
            <v-banner v-if="ownParticipationMissing" elevation="4" single-line icon="mdi-information">
                Make up your mind!
                <template v-slot:actions>
                    <v-btn text color="primary" @click="optIn">Opt-in</v-btn>
                    <v-btn text color="error" class="ml-1" @click="optOut">Opt-out</v-btn>
                </template>
            </v-banner>
        </v-container>

        <v-tabs fixed-tabs v-model="tab">
            <v-tab key="participations">
                <v-icon>mdi-food</v-icon>
            </v-tab>
            <v-tab key="money">
                <v-icon>mdi-cash-multiple</v-icon>
            </v-tab>
        </v-tabs>

        <v-tabs-items v-model="tab">
            <v-tab-item key="participations">
                <v-list>
                    <participation-list-item v-for="participation in optIns"
                                             :key="participation.userId"
                                             :participation="participation"/>

                    <participation-list-item v-for="participation in myOptOuts"
                                             :key="participation.userId"
                                             :participation="participation"/>
                </v-list>
            </v-tab-item>

            <v-tab-item key="money">
                <v-list>
                    <participation-list-item v-for="participation in optOutMoneyProviders"
                                             :key="participation.userId"
                                             :participation="participation"/>
                </v-list>
            </v-tab-item>
        </v-tabs-items>
    </v-main>
</template>

<script>
    import LmAppBar from '@/components/lmAppBar';
    import ParticipationSummary from '@/components/menus/participationSummary';
    import ParticipationListItem from '@/components/menus/participationListItem';

    export default {
        name: 'EventDetail',

        components: {
            ParticipationListItem,
            ParticipationSummary,
            LmAppBar,
        },

        created() {
            this.$store.dispatch('fetchEvent', {eventId: this.eventId});
            this.$store.dispatch('fetchParticipations', {eventId: this.eventId});
        },

        data() {
            let eventId = parseInt(this.$route.params.id, 10);
            return {
                eventId,
                tab:       'participations',
                ownUserId: this.$store.getters.ownUserId,
            };
        },

        computed: {
            event() {
                return this.$store.getters.event(this.eventId);
            },

            participations() {
                return this.$store.getters.participations(this.eventId);
            },

            optIns() {
                return this.participations.filter(p => p.type !== 'none');
            },

            myOptOuts() {
                return this.participations.filter(p => p.type === 'none' && p.userId === this.ownUserId);
            },

            optOutMoneyProviders() {
                return this.participations.filter(p => p.type === 'none' && p.provides.money);
            },

            formattedDate() {
                return this.event.date !== null ? this.event.date.toDateString() : null;
            },

            ownParticipationMissing() {
                let myParticipations = this.participations.filter(p => p.userId === this.ownUserId);
                return myParticipations.length === 0;
            },

        },

        methods: {
            optIn() {
                // TODO: It's not ideal that we have to specify credits and provides in case of race conditions
                // with other users editing the event
                this.$store.dispatch('saveParticipation', {
                    userId:   this.ownUserId,
                    eventId:  this.eventId,
                    // TODO: Change default type based on user preferences
                    type:     'carnivore',
                    credits:  {
                        points: 0,
                    },
                    provides: {
                        money: false,
                    },
                });
            },

            optOut() {
                // TODO: It's not ideal that we have to specify credits and provides in case of race conditions
                // with other users editing the event
                this.$store.dispatch('saveParticipation', {
                    userId:   this.ownUserId,
                    eventId:  this.eventId,
                    type:     'none',
                    credits:  {
                        points: 0,
                    },
                    provides: {
                        money: false,
                    },
                });
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
