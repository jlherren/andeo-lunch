<template>
    <v-main>
        <the-app-bar>
            {{ ownUser.name }}
            <template v-slot:buttons>
                <router-link to="/history">
                    <user-stats/>
                </router-link>
            </template>
        </the-app-bar>

        <shy-progress v-if="loading"/>

        <v-list v-if="!loading && events.length > 0">
            <template v-for="event of events">
                <v-divider v-if="event.hasGap" :key="event.id + '-divider'"/>
                <event-list-item :key="event.id" :event="event" :prominent="event.prominent"/>
            </template>
        </v-list>

        <v-container v-if="!loading && events.length === 0">
            <v-banner elevation="2" single-line :icon="$icons.information">
                No upcoming events
            </v-banner>
        </v-container>
    </v-main>
</template>

<script>
    import * as DateUtils from '@/utils/dateUtils';
    import EventListItem from '@/components/event/EventListItem';
    import ShyProgress from '@/components/ShyProgress';
    import TheAppBar from '@/components/TheAppBar';
    import UserStats from '@/components/UserStats';
    import {mapGetters} from 'vuex';

    export default {
        name: 'Home',

        components: {
            TheAppBar,
            EventListItem,
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

            events() {
                let events = this.$store.getters.events.filter(event => {
                    return event.date >= this.startDate && event.date < this.endDate;
                });

                events.sort((a, b) => a.date.getTime() - b.date.getTime());

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
