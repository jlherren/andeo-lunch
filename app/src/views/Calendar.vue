<template>
    <v-main v-touch="touch">
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

        <v-list>
            <template v-if="hasData">
                <template v-for="event of entries">
                    <lunch-list-item v-if="event.type !== 'placeholder'" :key="event.id" :event="event"/>

                    <v-list-item v-if="event.type === 'placeholder'" :key="event.id">
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
            </template>
            <template v-else>
                <v-skeleton-loader type="list-item-avatar"/>
            </template>
        </v-list>

        <v-speed-dial v-model="speedDial" fixed bottom right direction="top" transition="slide-y-reverse-transition">
            <template slot="activator">
                <v-btn v-model="speedDial" color="primary" fab>
                    <v-icon v-if="speedDial">{{ $icons.close }}</v-icon>
                    <v-icon v-else>{{ $icons.plus }}</v-icon>
                </v-btn>
            </template>
            <v-btn color="primary" fab small @click="openCreateDialog('lunch', null)">
                <v-icon>{{ $icons.lunch }}</v-icon>
                <span class="label">Lunch</span>
            </v-btn>
            <v-btn color="primary" fab small @click="openCreateDialog('special', null)">
                <v-icon>{{ $icons.special }}</v-icon>
                <span class="label">Special event</span>
            </v-btn>
            <v-btn color="primary" fab small @click="openCreateDialog('label', null)">
                <v-icon>{{ $icons.label }}</v-icon>
                <span class="label">Label</span>
            </v-btn>
        </v-speed-dial>

        <v-dialog v-model="createDialog" persistent>
            <lunch-edit ref="createEvent" :event="newEvent" @close="createDialogClosed()"/>
        </v-dialog>
    </v-main>
</template>

<script>
    import * as DateUtils from '@/utils/dateUtils';
    import LunchEdit from '@/components/event/LunchEdit';
    import LunchListItem from '@/components/event/LunchListItem';
    import ShyProgress from '@/components/ShyProgress';
    import TheAppBar from '@/components/TheAppBar';
    import Vue from 'vue';

    export const EVENT_TYPES = ['lunch', 'special', 'label'];

    export default {
        name: 'Calendar',

        components: {
            LunchEdit,
            LunchListItem,
            ShyProgress,
            TheAppBar,
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
                touch:        {
                    left:  () => this.previousWeek(),
                    right: () => this.nextWeek(),
                },
            };
        },

        computed: {
            title() {
                let formatted = DateUtils.displayFormatNoWeekday(this.startDate);
                return `Week of ${formatted}`;
            },

            events() {
                // TODO: This is a bit cheap, since potentially many events may be loaded at the time
                return this.$store.getters.events.filter(event => {
                    return EVENT_TYPES.includes(event.type) &&
                        event.date >= this.startDate && event.date < this.endDate;
                });
            },

            hasData() {
                return this.events.length || !this.loading;
            },

            entries() {
                let events = this.events.slice();

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
                        with: 'ownParticipations',
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

            createDialogClosed() {
                this.createDialog = false;
                this.reload();
            },

            formatDate(date) {
                return DateUtils.displayFormat(date);
            },
        },
    };
</script>

<style lang="scss" scoped>
    .v-speed-dial {
        // This is a known issue, it doesn't account for the bottom navigation
        bottom: 16px + 56px;

        .label {
            position: absolute;
            right: 48px;
            top: 3px;
            color: $andeo-blue;
            font-weight: bold;
            background: white;
            padding: 2px 0.33em;
        }
    }
</style>
