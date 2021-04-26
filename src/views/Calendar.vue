<template>
    <v-main>
        <lm-app-bar>
            {{ title }}
            <template v-slot:buttons>
                <v-btn icon @click="previousWeek">
                    <v-icon>mdi-chevron-left</v-icon>
                </v-btn>
                <v-btn icon @click="nextWeek">
                    <v-icon>mdi-chevron-right</v-icon>
                </v-btn>
            </template>
        </lm-app-bar>

        <v-progress-linear indeterminate absolute v-if="loading"></v-progress-linear>

        <v-list>
            <template v-for="event in entries">
                <event-list-item :event="event" :key="event.id" v-if="event.type !== 'placeholder'"/>

                <v-list-item :key="event.id" v-if="event.type === 'placeholder'">
                    <v-list-item-icon/>
                    <v-list-item-content>
                        <v-list-item-title class="text--secondary">No event</v-list-item-title>
                        <v-list-item-subtitle>{{ event.date.toDateString() }}</v-list-item-subtitle>
                    </v-list-item-content>
                    <v-list-item-action>
                        <v-btn icon @click="openCreateDialog('lunch', event.date)">
                            <v-icon>mdi-plus</v-icon>
                        </v-btn>
                    </v-list-item-action>
                </v-list-item>
            </template>
        </v-list>

        <v-speed-dial v-model="speedDial" bottom right direction="top" transition="slide-y-reverse-transition">
            <template slot="activator">
                <v-btn fab v-model="speedDial" color="primary">
                    <v-icon v-if="speedDial">mdi-close</v-icon>
                    <v-icon v-else>mdi-plus</v-icon>
                </v-btn>
            </template>
            <v-btn fab small color="primary" @click="openCreateDialog('lunch', null)">
                <v-icon>mdi-food-variant</v-icon>
            </v-btn>
            <v-btn fab small color="primary" @click="openCreateDialog('event', null)">
                <v-icon>mdi-party-popper</v-icon>
            </v-btn>
            <v-btn fab small color="primary" @click="openCreateDialog('label', null)">
                <v-icon>mdi-label</v-icon>
            </v-btn>
        </v-speed-dial>

        <v-dialog v-model="createDialog">
            <create-event :event="newEvent" ref="createEvent" @close="createDialog = false"/>
        </v-dialog>
    </v-main>
</template>

<script>
    import EventListItem from '@/components/menus/eventListItem';
    import LmAppBar from '@/components/lmAppBar';
    import CreateEvent from '@/components/editEvent';
    import * as DateUtils from '@/utils/dateUtils';
    import Vue from 'vue';

    export default {
        name: 'Calendar',

        components: {
            CreateEvent,
            LmAppBar,
            EventListItem,
        },

        data() {
            return {
                startDate:    DateUtils.getPreviousMonday(new Date()),
                endDate:      null,
                loading:      false,
                createDialog: false,
                speedDial:    false,
                newEvent:     {},
            };
        },

        computed: {
            title() {
                return 'Week of ' + this.startDate.toDateString();
            },

            entries() {
                // TODO: This is a bit cheap, since potentially many events may be loaded at the time
                let events = this.$store.getters.events.filter(event => {
                    return event.date >= this.startDate && event.date < this.endDate;
                });

                // Add placeholders for missing weekdays
                let weekdaysWithLunchOrLabel = new Array(7).fill(false);
                let lastWeekDayWithEvent = 0;
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
                            id: `placeholder-${i}`,
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
                        to: this.endDate,
                    };
                    await this.$store.dispatch('fetchEvents', params);
                } finally {
                    this.loading = false;
                }
            },

            previousWeek() {
                this.startDate = DateUtils.addDays(this.startDate, -7);
                this.reload();
            },

            nextWeek() {
                this.startDate = DateUtils.addDays(this.startDate, 7);
                this.reload();
            },

            openCreateDialog(type, date) {
                this.createDialog = true;
                this.newEvent = {
                    type,
                    date,
                };
                Vue.nextTick(() => this.$refs.createEvent.reset());
            },
        },

        created() {
            this.reload();
        },
    };
</script>

<style scoped lang="scss">
    .v-speed-dial {
        // Documentation says this is not necessary... but it is.
        position: absolute;
    }
</style>
