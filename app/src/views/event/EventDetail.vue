<template>
    <v-main>
        <the-app-bar sub-page :to="`/calendar/${isoDate}`">
            {{ name }}
            <template v-if="event" slot="buttons">
                <dynamic-button label="Edit" :icon="$icons.edit" :disabled="isBusy" :to="`/events/${eventId}/edit`"/>
                <dynamic-button label="Delete" :icon="$icons.delete" :disabled="isBusy" @click="openConfirmDelete"/>
            </template>
        </the-app-bar>

        <shy-progress v-if="isBusy"/>

        <div v-if="event">
            <v-container class="center-text">
                <div class="headline">{{ name }}</div>
                <div class="text--secondary">{{ formattedDate }}</div>

                <div v-if="event.type !== 'label'" class="costs">
                    <participation-summary :participations="participations" large/>
                    <balance :value="event.costs.points" points large no-sign/>
                    <balance :value="event.costs.money" money large no-sign/>
                </div>
            </v-container>

            <v-container v-if="commentHtml !== ''" class="comment" v-html="commentHtml"/>

            <v-container v-if="participations && event.type !== 'label' && ownParticipationMissing">
                <v-banner elevation="2" :icon="$icons.undecided" icon-color="red">
                    Make up your mind!
                    <template v-slot:actions>
                        <v-btn color="primary" class="ml-1" :disabled="isBusy" @click="optOut">
                            <v-icon small left>{{ $icons.optOut }}</v-icon>
                            Opt-out
                        </v-btn>
                        <v-btn color="primary" :disabled="isBusy" @click="optIn">
                            <v-icon small left>{{ optInIcon }}</v-icon>
                            Opt-in
                        </v-btn>
                    </template>
                </v-banner>
            </v-container>

            <v-container v-if="pointsAreMismatched">
                <v-banner elevation="2" single-line :icon="$icons.alert" icon-color="red">
                    Lunch costs
                    {{ event.costs.points }} <v-icon small>{{ $icons.points }}</v-icon>, but
                    {{ sumOfPointsCredited }} <v-icon small>{{ $icons.points }}</v-icon> have been distributed.
                </v-banner>
            </v-container>

            <v-list v-if="event.type !== 'label'">
                <v-list-item @click="openAddParticipationDialog()">
                    <v-list-item-avatar>
                        <v-icon>{{ $icons.plus }}</v-icon>
                    </v-list-item-avatar>

                    <v-list-item-content>
                        <v-list-item-title>
                            Add participation
                        </v-list-item-title>
                    </v-list-item-content>
                </v-list-item>

                <v-skeleton-loader v-if="!participations" type="list-item-avatar"/>

                <participation-list-item v-if="participations" :event="event" :participation="myParticipation"
                                         @saved="refreshEvent()"/>

                <participation-list-item v-for="participation of foreignParticipations"
                                         :key="participation.userId"
                                         :event="event" :participation="participation"
                                         @saved="refreshEvent()"/>
            </v-list>

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
                        <v-btn @click="deleteEvent" :disabled="isBusy" color="error">Delete</v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>

            <v-dialog v-model="addParticipationDialog">
                <participation-edit :event="event" @close="addParticipationDialog = false" @saved="refreshEvent()" ref="editForm"/>
            </v-dialog>
        </div>
    </v-main>
</template>

<script>
    import * as DateUtils from '@/utils/dateUtils';
    import * as HtmlUtils from '@/utils/htmlUtils';
    import Balance from '@/components/Balance';
    import DynamicButton from '@/components/DynamicButton';
    import ParticipationEdit from '@/components/event/ParticipationEdit';
    import ParticipationListItem from '@/components/event/ParticipationListItem';
    import ParticipationSummary from '@/components/event/ParticipationSummary';
    import ShyProgress from '@/components/ShyProgress';
    import TheAppBar from '@/components/TheAppBar';
    import Vue from 'vue';

    const PASSIVE_TYPES = ['undecided'];

    const PARTICIPATION_TYPE_TO_ORDER = {
        // credit-less undecided participations are not shown at all, the ones that are shown are the ones that involve
        // some credits, we want them to show before opt-outs.
        'omnivorous': 1,
        'vegetarian': 1,
        'undecided':  2,
        'opt-out':    3,
    };

    export default {
        name: 'EventDetail',

        components: {
            Balance,
            DynamicButton,
            ParticipationEdit,
            ParticipationListItem,
            ParticipationSummary,
            ShyProgress,
            TheAppBar,
        },

        data() {
            return {
                eventId:                parseInt(this.$route.params.id, 10),
                ownUserId:              this.$store.getters.ownUserId,
                confirmDelete:          false,
                isBusy:                 false,
                addParticipationDialog: false,
                userToAdd:              null,
            };
        },

        async created() {
            // noinspection ES6MissingAwait
            this.$store.dispatch('fetchSettings');

            try {
                this.isBusy = true;

                await this.$store.dispatch('fetchEvent', {eventId: this.eventId});
                let event = this.$store.getters.event(this.eventId);
                if (event.type === 'transfer') {
                    // Oops, you're in the wrong view, redirect.
                    await this.$router.push(`/transfers/${this.eventId}`);
                    return;
                }
                if (event.type !== 'label') {
                    await this.$store.dispatch('fetchParticipations', {eventId: this.eventId});
                }
            } finally {
                this.isBusy = false;
            }
        },

        computed: {
            event() {
                let event = this.$store.getters.event(this.eventId);
                return event?.type !== 'transfer' ? event : null;
            },

            name() {
                return this.event?.name || 'Loading...';
            },

            comment() {
                return this.event?.comment ?? '';
            },

            participations() {
                return this.$store.getters.participations(this.eventId);
            },

            foreignParticipations() {
                // List of opt-inners as well as opt-out/undecided that cook or provide money.
                // This excludes own participation
                let participations = this.participations;
                if (!participations) {
                    return [];
                }
                participations = participations.filter(p => {
                    if (p.userId === this.ownUserId) {
                        return false;
                    }
                    return !PASSIVE_TYPES.includes(p.type) || p.credits.points > 0 || p.credits.money > 0;
                });
                participations.sort((a, b) => {
                    let orderA = PARTICIPATION_TYPE_TO_ORDER[a.type] ?? 9;
                    let orderB = PARTICIPATION_TYPE_TO_ORDER[b.type] ?? 9;
                    let diff = orderA - orderB;
                    if (diff) {
                        return diff;
                    }
                    let nameA = this.$store.getters.user(a.userId)?.name;
                    let nameB = this.$store.getters.user(b.userId)?.name;
                    if (nameA < nameB) {
                        return -1;
                    }
                    if (nameA > nameB) {
                        return 1;
                    }
                    return 0;
                });
                return participations;
            },

            myParticipation() {
                // User's own opt-out/undecided
                let participations = this.participations ? this.participations.filter(p => p.userId === this.ownUserId) : [];
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

            sumOfPointsCredited() {
                let participations = this.participations;
                if (!participations) {
                    return 0;
                }
                return participations.map(p => p.credits.points)
                    .reduce((acc, value) => acc + value, 0);
            },

            pointsAreMismatched() {
                return this.event &&
                    this.participations &&
                    this.participations.length &&
                    Math.abs(this.sumOfPointsCredited - this.event.costs.points) > 1e-6;
            },

            formattedDate() {
                return this.event?.date ? DateUtils.displayFormat(this.event.date) : null;
            },

            isoDate() {
                return this.event?.date ? DateUtils.isoDate(this.event.date) : null;
            },

            ownParticipationMissing() {
                let myDecision = this.participations.filter(p => p.userId === this.ownUserId && p.type !== 'undecided');
                return myDecision.length === 0;
            },

            optInIcon() {
                return this.$icons[this.$store.getters.settings.quickOptIn];
            },

            commentHtml() {
                return this.comment.replace(/(?<link>https?:\/\/\S+)|\S+/gu, (match, link) => {
                    match = HtmlUtils.encode(match);
                    if (link !== undefined) {
                        return `<a href="${match}" target="_blank" rel="noopener">${match}</a>`;
                    }
                    return match;
                });
            },
        },

        methods: {
            optIn() {
                this.setParticipation(this.$store.getters.settings.quickOptIn);
            },

            optOut() {
                this.setParticipation('opt-out');
            },

            async setParticipation(type) {
                try {
                    this.isBusy = true;
                    await this.$store.dispatch('saveParticipation', {
                        userId:  this.ownUserId,
                        eventId: this.eventId,
                        type,
                    });
                } finally {
                    this.isBusy = false;
                }
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
                    throw err;
                }
            },

            async refreshEvent() {
                await this.$store.dispatch('fetchEvent', {eventId: this.eventId});
            },

            openAddParticipationDialog() {
                this.$store.dispatch('fetchUsers');
                this.addParticipationDialog = true;
                Vue.nextTick(() => this.$refs.editForm.reset());
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

    .comment {
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        color: gray;
    }
</style>
