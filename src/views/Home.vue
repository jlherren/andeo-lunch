<template>
    <v-main>
        <the-app-bar>
            {{ ownUser.name }}
            <template v-slot:buttons>
                <user-stats/>
            </template>
        </the-app-bar>

        <v-list v-if="entries.length > 0">
            <template v-for="(event, index) of entries">
                <v-divider v-if="event.hasGap"/>
                <event-list-item :event="event" :key="event.id" :prominent="index === 0"/>
            </template>
        </v-list>

        <v-container v-if="entries.length === 0">
            <v-banner elevation="2" single-line>
                <v-icon slot="icon">mdi-information</v-icon>
                No upcoming events
            </v-banner>
        </v-container>
    </v-main>
</template>

<script>
    import UserStats from '@/components/UserStats';
    import TheAppBar from '@/components/TheAppBar';
    import {mapGetters} from 'vuex';
    import EventListItem from '@/components/event/EventListItem';
    import * as DateUtils from '@/utils/dateUtils';

    export default {
        name: 'Home',

        components: {
            TheAppBar,
            EventListItem,
            UserStats,
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

            entries() {
                // TODO: This is a bit cheap, since potentially many events may be loaded at the time
                let events = this.$store.getters.events.filter(event => {
                    return event.date >= this.startDate && event.date < this.endDate;
                });

                events.sort((a, b) => a.date.getTime() - b.date.getTime());

                // Add information about divider lines
                let prev = null;
                for (let event of events) {
                    event.hasGap = prev !== null
                                   && !DateUtils.isSameDays(prev.date, event.date)
                                   && !DateUtils.isSuccessiveDays(prev.date, event.date);
                    prev = event;
                }

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
                    };
                    await this.$store.dispatch('fetchEvents', params);
                } finally {
                    this.loading = false;
                }
            },
        }
    };
</script>
