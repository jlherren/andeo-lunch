<template>
    <v-main>
        <the-app-bar>
            {{ title }}
            <template v-slot:buttons>
                <v-btn icon @click="previousWeek">
                    <v-icon>{{ $icons.chevronLeft }}</v-icon>
                </v-btn>
                <v-btn icon @click="nextWeek">
                    <v-icon>{{ $icons.chevronRight }}</v-icon>
                </v-btn>
            </template>
        </the-app-bar>

        <shy-progress v-if="loading"/>

        <v-list v-if="!loading">
            <template v-for="event of entries">
                <event-list-item :event="event" :key="event.id" v-if="event.type !== 'placeholder'"/>

                <v-list-item :key="event.id" v-if="event.type === 'placeholder'">
                    <v-list-item-icon/>
                    <v-list-item-content>
                        <v-list-item-title class="text--secondary">No event</v-list-item-title>
                        <v-list-item-subtitle>{{ formatDate(event.date) }}</v-list-item-subtitle>
                    </v-list-item-content>
                    <v-list-item-action>
                        <v-btn icon @click="openCreateDialog('lunch', event.date)">
                            <v-icon>{{ $icons.plus }}</v-icon>
                        </v-btn>
                    </v-list-item-action>
                </v-list-item>
            </template>
        </v-list>

        <v-speed-dial v-model="speedDial" fixed bottom right direction="top" transition="slide-y-reverse-transition">
            <template slot="activator">
                <v-btn fab v-model="speedDial" color="primary">
                    <v-icon v-if="speedDial">{{ $icons.close }}</v-icon>
                    <v-icon v-else>{{ $icons.plus }}</v-icon>
                </v-btn>
            </template>
            <v-btn fab small color="primary" @click="openCreateDialog('lunch', null)">
                <v-icon>{{ $icons.lunch }}</v-icon>
            </v-btn>
            <v-btn fab small color="primary" @click="openCreateDialog('event', null)">
                <v-icon>{{ $icons.event }}</v-icon>
            </v-btn>
            <v-btn fab small color="primary" @click="openCreateDialog('label', null)">
                <v-icon>{{ $icons.label }}</v-icon>
            </v-btn>
        </v-speed-dial>

        <v-dialog v-model="createDialog">
            <event-edit :event="newEvent" ref="createEvent" @close="createDialog = false"/>
        </v-dialog>
    </v-main>
</template>

<script>
    import * as DateUtils from '@/utils/dateUtils';
    import EventEdit from '@/components/event/EventEdit';
    import EventListItem from '@/components/event/EventListItem';
    import ShyProgress from '@/components/ShyProgress';
    import TheAppBar from '@/components/TheAppBar';
    import Vue from 'vue';

    export default {
        name: 'Calendar',

        components: {
            TheAppBar,
            EventListItem,
            EventEdit,
            ShyProgress,
        },

        created() {
            this.reload();
        },

        data() {
            let date = new Date(this.$route.params?.date);
            if (!date.getTime()) {
                date = new Date();
            }

            return {
                startDate:    DateUtils.previousMonday(date),
                endDate:      null,
                loading:      false,
                createDialog: false,
                speedDial:    false,
                newEvent:     {},
            };
        },

        computed: {
            title() {
                let formatted = DateUtils.displayFormat(this.startDate);
                return `Week of ${formatted}`;
            },

            entries() {
                // TODO: This is a bit cheap, since potentially many events may be loaded at the time
                let events = this.$store.getters.events.filter(event => {
                    return event.date >= this.startDate && event.date < this.endDate;
                });

                // Add placeholders for missing weekdays
                let weekdaysWithLunchOrLabel = new Array(7).fill(false);
                for (let event of events) {
                    if (['lunch', 'label'].includes(event.type)) {
                        weekdaysWithLunchOrLabel[event.date.getDay()] = true;
                    }
                }
                for (let i = 1; i <= 5; i++) {
                    if (!weekdaysWithLunchOrLabel[i]) {
                        let date = DateUtils.addDays(this.startDate, i - 1);
                        date.setHours(12, 0, 0, 0);
                        events.push({
                            id:   `placeholder-${i}`,
                            date: date,
                            type: 'placeholder',
                        });
                    }
                }

                events.sort((a, b) => a.date.getTime() - b.date.getTime());
                return events;
            },
        },

        methods: {
            async reload() {
                if (this.loading) {
                    return;
                }
                this.endDate = DateUtils.addDays(this.startDate, 7);
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

            previousWeek() {
                let newDate = DateUtils.addDays(this.startDate, -7);
                this.$router.push(`/calendar/${DateUtils.isoDate(newDate)}`);
            },

            nextWeek() {
                let newDate = DateUtils.addDays(this.startDate, 7);
                this.$router.push(`/calendar/${DateUtils.isoDate(newDate)}`);
            },

            openCreateDialog(type, date) {
                this.createDialog = true;
                this.newEvent = {
                    type,
                    date,
                };
                Vue.nextTick(() => this.$refs.createEvent.reset());
            },

            formatDate(date) {
                return DateUtils.displayFormat(date);
            },
        },
    };
</script>

<style scoped lang="scss">
    .v-speed-dial {
        // This is a known issue, it doesn't account for the bottom navigation
        bottom: 16px + 56px;
    }
</style>
