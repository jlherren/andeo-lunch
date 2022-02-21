<template>
    <v-main>
        <the-app-bar logo>
            {{ ownUser.name }}
        </the-app-bar>

        <shy-progress v-if="loading || updating"/>

        <v-container v-if="$global.hasUpdate">
            <v-banner elevation="2" :icon="$icons.update">
                An update for Andeo Lunch is available!
                <template v-slot:actions>
                    <v-btn color="primary" @click="update()"  :loading="updating">
                        Update now
                    </v-btn>
                </template>
            </v-banner>
        </v-container>

        <v-subheader>Your balance</v-subheader>
        <v-list fluid>
            <v-list-item to="/history">
                <v-list-item-content>
                    <user-stats/>
                </v-list-item-content>
            </v-list-item>
        </v-list>

        <v-container v-if="ownUser.balances.money < -200">
            <v-banner elevation="2" :icon="$icons.alert" icon-color="red">
                Your money balance is very low!  Please send money to a user with a high balance to even it out.

                <template v-slot:actions>
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
    import {mapGetters} from 'vuex';

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
                updating:  false,
            };
        },

        created() {
            this.reload();
        },

        computed: {
            ...mapGetters([
                'ownUser',
            ]),

            hasData() {
                return this.events.length || !this.loading;
            },

            events() {
                let events = this.$store.getters.events.filter(event => {
                    return EVENT_TYPES.includes(event.type) &&
                        event.date >= this.startDate;
                });

                events.sort((a, b) => a.date.getTime() - b.date.getTime());

                // Add information about divider lines
                let prev = null;
                events = events.map(event => {
                    let hasGap = prev !== null &&
                        !DateUtils.isSameDay(prev.date, event.date) &&
                        !DateUtils.isSuccessiveDays(prev.date, event.date);
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
                    await this.$store.dispatch('fetchEvents', params);
                } finally {
                    this.loading = false;
                }
            },

            update() {
                this.updating = true;
                setTimeout(() => window.location.reload());
            },
        },
    };
</script>
