<template>
    <div>
        <v-progress-linear indeterminate absolute v-if="loading"></v-progress-linear>
        <v-toolbar flat>
            <v-btn icon @click="previousWeek">
                <v-icon>mdi-chevron-left</v-icon>
            </v-btn>
            Week of {{ formattedDate }}
            <v-spacer/>
            <v-btn icon @click="nextWeek">
                <v-icon>mdi-chevron-right</v-icon>
            </v-btn>
        </v-toolbar>

        <v-list>
            <event-list-item v-for="event in events" :key="event.id" :event="event"/>
        </v-list>

        <v-container>
            <v-banner v-if="events.length === 0" elevation="2" single-line>
                <v-icon slot="icon">mdi-information</v-icon>
                No events in the selected week
            </v-banner>
        </v-container>
    </div>
</template>

<script>
    import EventListItem from '../components/menus/eventListItem';

    /**
     * Add a week to a date
     *
     * @param {Date} date
     * @return {Date}
     */
    function addWeek(date) {
        return new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate() + 7,
        );
    }

    export default {
        name: 'Calendar',

        components: {
            EventListItem,
        },

        data() {
            let today = new Date();
            today.setHours(0, 0, 0, 0);
            while (today.getDay() !== 1) {
                today = new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    today.getDate() - 1,
                );
            }
            return {
                startDate: today,
                loading: false,
            };
        },

        computed: {
            formattedDate() {
                return this.startDate.toDateString();
            },

            events() {
                // TODO: This is a bit cheap, since potentially many events may be loaded at the time
                let toDate =addWeek(this.startDate);
                return this.$store.getters.getEvents.filter(event => {
                    return event.date >= this.startDate && event.date < toDate;
                });
            },
        },

        methods: {
            async reload() {
                if (this.loading) {
                    return;
                }
                try {
                    this.loading = true;
                    let payload = {
                        from: this.startDate,
                        to: addWeek(this.startDate),
                    };
                    await this.$store.dispatch('updateEvents', {params: payload});
                } finally {
                    this.loading = false;
                }

            },

            previousWeek() {
                this.startDate = new Date(
                    this.startDate.getFullYear(),
                    this.startDate.getMonth(),
                    this.startDate.getDate() - 7,
                );
                this.reload();
            },

            nextWeek() {
                this.startDate = new Date(
                    this.startDate.getFullYear(),
                    this.startDate.getMonth(),
                    this.startDate.getDate() + 7,
                );
                this.reload();
            },
        },

        created() {
            this.reload();
        },
    };
</script>

<style scoped>

</style>
