<template>
    <v-main>
        <the-app-bar logo>
            {{ ownUser.name }}
        </the-app-bar>

        <shy-progress v-if="loading"/>

        <v-subheader>Your balance</v-subheader>
        <v-list fluid>
            <v-list-item :to="`/history/${ownUser.id}`">
                <v-list-item-content>
                    <user-stats :user="ownUser"/>
                </v-list-item-content>
            </v-list-item>
        </v-list>

        <v-container v-if="ownUser.balances.money < -20">
            <v-banner elevation="2" :icon="$icons.alert" icon-color="red">
                Your money balance is very low!  Please send money to a user with a high balance to even it out.

                <template #actions>
                    <v-btn to="/transfers/new/pay-up" color="primary" text>
                        Send money now
                    </v-btn>
                </template>
            </v-banner>
        </v-container>

        <v-subheader>Upcoming events</v-subheader>

        <v-container v-if="!loading && events.length === 0">
            <v-banner elevation="2" single-line :icon="$icons.information">
                No upcoming events
            </v-banner>
        </v-container>
        <v-list v-else>
            <template v-if="hasData">
                <template v-for="event of events">
                    <v-divider v-if="event.hasGap" :key="event.id + '-divider'"/>
                    <lunch-list-item :key="event.id" :event="event"/>
                </template>
            </template>
            <template v-else>
                <v-skeleton-loader type="list-item-avatar"/>
            </template>
        </v-list>
    </v-main>
</template>

<script>
    import * as DateUtils from '@/utils/dateUtils';
    import {EVENT_TYPES} from '@/views/Calendar';
    import LunchListItem from '@/components/event/LunchListItem';
    import ShyProgress from '@/components/ShyProgress';
    import TheAppBar from '@/components/TheAppBar';
    import UserStats from '@/components/UserStats';
    import {mapState} from 'pinia';
    import {useStore} from '@/store';

    export default {
        name: 'Home',

        components: {
            LunchListItem,
            ShyProgress,
            TheAppBar,
            UserStats,
        },

        data() {
            let midnight = DateUtils.previousMidnight(new Date());
            return {
                startDate: midnight,
                loading:   false,
            };
        },

        created() {
            this.reload();
        },

        computed: {
            ...mapState(useStore, [
                'ownUser',
            ]),

            hasData() {
                return this.events.length || !this.loading;
            },

            events() {
                let events = this.$store().events.filter(event => {
                    return EVENT_TYPES.includes(event.type)
                        && event.date >= this.startDate;
                });

                events.sort((a, b) => a.date.getTime() - b.date.getTime());

                // Add information about divider lines
                let prev = null;
                events = events.map(event => {
                    let hasGap = prev !== null
                        && !DateUtils.isSameDay(prev.date, event.date)
                        && !DateUtils.isSuccessiveDays(prev.date, event.date);
                    prev = event;
                    return {
                        ...event,
                        hasGap,
                    };
                });

                return events;
            },
        },

        methods: {
            async reload() {
                if (this.loading) {
                    return;
                }
                try {
                    this.loading = true;
                    let params = {
                        from: this.startDate,
                        with: 'ownParticipations',
                    };
                    await this.$store().fetchEvents(params);
                } finally {
                    this.loading = false;
                }
            },
        },
    };
</script>
