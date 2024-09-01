<template>
    <v-main>
        <the-app-bar sub-page :to="`/calendar/${isoDate}`">
            {{ name }}
            <template v-if="event" #buttons>
                <dynamic-button
                    label="Grid"
                    :icon="$icons.grid"
                    :disabled="isBusy || !event.canEdit"
                    :to="`/events/${eventId}/grid`"
                    class="hidden-xs-only"
                    v-if="event.type !== 'label'"
                />
                <dynamic-button
                    label="Edit"
                    :icon="$icons.edit"
                    :disabled="isBusy || !event.canEdit"
                    :to="`/events/${eventId}/edit`"
                />
                <dynamic-button
                    label="Delete"
                    :icon="$icons.delete"
                    :disabled="isBusy || !event.canEdit"
                    @click="openConfirmDelete"
                />
            </template>
        </the-app-bar>

        <shy-progress v-if="isBusy"/>

        <div v-if="event">
            <v-container class="text-center">
                <div class="headline">{{ name }}</div>
                <div class="text--secondary">{{ formattedDate }}</div>

                <div v-if="event.type !== 'label'">
                    <div class="costs">
                        <participation-summary v-if="participationsAreLoaded" :event="event" :participations="participations" large/>
                        <balance :value="event.costs.points" points large no-sign/>
                        <balance :value="event.costs.money" money large no-sign/>
                    </div>

                    <p v-if="event.participationFlatRate !== null" class="text--secondary">
                        Participation flat-rate: {{ event.participationFlatRate }}
                        <v-icon small>{{ $icons.points }}</v-icon>
                    </p>

                    <p v-if="!event.canEdit" class="text--secondary">
                        This event is too far in the past for you to edit.  Contact an admin if you need changes to be made.
                    </p>
                </div>
            </v-container>

            <v-container v-if="commentHtml !== ''" class="comment" v-html="commentHtml"/>

            <v-container v-if="participationsAreLoaded && event.type === 'lunch' && ownParticipationMissing && event.canEdit">
                <v-banner elevation="2" :icon="$icons.undecided" icon-color="red">
                    Make up your mind!
                    <template #actions>
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
                <v-skeleton-loader v-if="!participationsAreLoaded" type="list-item-avatar"/>

                <participation-list-item
                    v-for="participation of sortedParticipations"
                    :key="participation.userId"
                    :event="event"
                    :participation="participation"
                    :readonly="!event.canEdit"
                    @saved="refreshEvent"
                />
            </v-list>

            <v-dialog v-model="confirmDelete" max-width="600">
                <v-card>
                    <v-card-title>
                        Delete this event?
                    </v-card-title>
                    <v-card-text>
                        All event and participation data will be permanently deleted!
                    </v-card-text>
                    <v-card-actions>
                        <v-btn text @click="confirmDelete = false" :disabled="isBusy">No, keep it</v-btn>
                        <v-spacer/>
                        <v-btn @click="deleteEvent" :disabled="isBusy" color="error">Yes, delete</v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>
        </div>
    </v-main>
</template>

<script>
    import * as DateUtils from '@/utils/dateUtils';
    import * as HtmlUtils from '@/utils/htmlUtils';
    import Balance from '@/components/Balance';
    import DynamicButton from '@/components/DynamicButton';
    import ParticipationListItem from '@/components/event/ParticipationListItem';
    import ParticipationSummary from '@/components/event/ParticipationSummary';
    import ShyProgress from '@/components/ShyProgress';
    import TheAppBar from '@/components/TheAppBar';

    const PARTICIPATION_TYPE_TO_ORDER = {
        // order 0 is for own participation
        'omnivorous': 1,
        'vegetarian': 1,
        'opt-in':     1,
        'undecided':  2,
        'opt-out':    3,
    };

    export default {
        name: 'EventDetail',

        components: {
            Balance,
            DynamicButton,
            ParticipationListItem,
            ParticipationSummary,
            ShyProgress,
            TheAppBar,
        },

        data() {
            return {
                eventId:       parseInt(this.$route.params.id, 10),
                ownUserId:     this.$store().ownUserId,
                confirmDelete: false,
                isBusy:        true,
                userToAdd:     null,
            };
        },

        async created() {
            try {
                await Promise.all([
                    this.$store().fetchUsers(),
                    this.$store().fetchSettings(),
                    this.$store().fetchEvent(this.eventId),
                ]);
                let event = this.$store().event(this.eventId);
                if (event.type === 'transfer') {
                    // Oops, you're in the wrong view, redirect.
                    await this.$router.replace(`/transfers/${this.eventId}`);
                    return;
                }
                if (event.type !== 'label') {
                    await this.$store().fetchParticipations(this.eventId);
                }
            } finally {
                this.isBusy = false;
            }
        },

        computed: {
            event() {
                let event = this.$store().event(this.eventId);
                return event?.type !== 'transfer' ? event : null;
            },

            name() {
                return this.event?.name || 'Loading...';
            },

            comment() {
                return this.event?.comment ?? '';
            },

            participations() {
                return this.$store().participations(this.eventId);
            },

            participationsAreLoaded() {
                return !!this.participations;
            },

            visibleUsers() {
                return this.$store().visibleUsers;
            },

            sortedParticipations() {
                let participations = this.participations;
                if (!participations) {
                    return [];
                }

                participations = participations.map(participation => {
                    let order = participation.userId === this.ownUserId
                        ? 0
                        : PARTICIPATION_TYPE_TO_ORDER[participation.type] ?? 9;
                    return {
                        ...participation,
                        order,
                    };
                });

                let fakeParticipationType = this.event.type === 'special' ? 'opt-out' : 'undecided';
                let fakeOrdering = PARTICIPATION_TYPE_TO_ORDER[fakeParticipationType] ?? 9;
                let fakeParticipations = this.visibleUsers.filter(
                    user => !user.hiddenFromEvents && !participations.some(participation => participation.userId === user.id),
                ).map(
                    user => ({
                        userId:  user.id,
                        eventId: this.eventId,
                        type:    fakeParticipationType,
                        credits: {
                            points: 0,
                            money:  0,
                        },
                        order:   user.id === this.ownUserId ? 0 : fakeOrdering,
                    }),
                );

                participations = participations.concat(fakeParticipations)
                    .sort((first, second) => {
                        let diff = first.order - second.order;
                        if (diff) {
                            return diff;
                        }
                        let nameFirst = this.$store().user(first.userId)?.name;
                        let nameSecond = this.$store().user(second.userId)?.name;
                        if (nameFirst < nameSecond) {
                            return -1;
                        }
                        if (nameFirst > nameSecond) {
                            return 1;
                        }
                        return 0;
                    });
                return participations;
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
                return this.event
                    && this.participations
                    && this.participations.length
                    && Math.abs(this.sumOfPointsCredited - this.event.costs.points) > 1e-6;
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
                return this.$icons[this.$store().settings.quickOptIn];
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
                this.setParticipation(this.$store().settings.quickOptIn);
            },

            optOut() {
                this.setParticipation('opt-out');
            },

            async setParticipation(type) {
                try {
                    this.isBusy = true;
                    await this.$store().saveParticipation({
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
                    await this.$store().deleteEvent(this.eventId);
                    this.confirmDelete = false;
                    this.$router.go(-1);
                } catch (err) {
                    this.isBusy = false;
                    throw err;
                }
            },

            async refreshEvent() {
                await this.$store().fetchEvent(this.eventId);
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
