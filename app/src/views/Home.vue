<template>
    <v-main>
        <the-app-bar>
            {{ ownUser.name }}
        </the-app-bar>

        <shy-progress v-if="loading"/>

        <v-subheader>Your balance</v-subheader>
        <v-list fluid>
            <v-list-item to="/history">
                <v-list-item-content>
                    <user-stats/>
                </v-list-item-content>
            </v-list-item>
        </v-list>

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
                    <lunch-list-item :key="event.id" :event="event" :prominent="event.prominent"/>
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
    import LunchListItem from '@/components/event/LunchListItem';
    import ShyProgress from '@/components/ShyProgress';
    import TheAppBar from '@/components/TheAppBar';
    import UserStats from '@/components/UserStats';
    import {mapGetters} from 'vuex';

    export default {
        name: 'Home',

        components: {
            TheAppBar,
            LunchListItem,
            UserStats,
            ShyProgress,
        },

        data() {
            let midnight = DateUtils.previousMidnight(new Date());
            return {
                startDate: midnight,
                endDate:   DateUtils.addDays(midnight, 7),
                loading:   false,
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
                    return ['lunch', 'special'].includes(event.type) &&
                        event.date >= this.startDate && event.date < this.endDate;
                });

                events.sort((a, b) => a.date.getTime() - b.date.getTime());
                events = events.slice(0, 3);

                // Add information about divider lines and prominent display
                let prev = null;
                let today = new Date();
                events = events.map(event => {
                    let hasGap = prev !== null &&
                        !DateUtils.isSameDay(prev.date, event.date) &&
                        !DateUtils.isSuccessiveDays(prev.date, event.date);
                    let prominent = prev === null && DateUtils.isSameDay(today, event.date);
                    prev = event;
                    return {
                        ...event,
                        hasGap,
                        prominent,
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
                        to:   this.endDate,
                        with: 'ownParticipations',
                    };
                    await this.$store.dispatch('fetchEvents', params);
                } finally {
                    this.loading = false;
                }
            },
        },
    };
</script>

<style lang="scss" scoped>
    a {
        text-decoration: none;
    }
</style>
