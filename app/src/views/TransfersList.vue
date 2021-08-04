<template>
    <v-main v-touch="touch">
        <the-app-bar>
            {{ title }}
            <template v-slot:buttons>
                <v-btn icon @click="previousMonth">
                    <v-icon>{{ $icons.chevronLeft }}</v-icon>
                </v-btn>
                <v-btn icon @click="nextMonth">
                    <v-icon>{{ $icons.chevronRight }}</v-icon>
                </v-btn>
            </template>
        </the-app-bar>

        <shy-progress v-if="loading"/>

        <v-list v-if="!loading && events.length > 0">
            <template v-for="event of events">
                <v-divider v-if="event.hasGap" :key="event.id + '-divider'"/>
                <transfer-list-item :key="event.id" :event="event" :prominent="event.prominent"/>
            </template>
        </v-list>

        <v-container v-if="!loading && events.length === 0">
            <v-banner elevation="2" single-line :icon="$icons.information">
                No transfers
            </v-banner>
        </v-container>

        <v-btn color="primary" absolute bottom right fab to="/transfers/new">
            <v-icon>{{ $icons.plus }}</v-icon>
        </v-btn>
    </v-main>
</template>

<script>
    import * as DateUtils from '@/utils/dateUtils';
    import ShyProgress from '@/components/ShyProgress';
    import TheAppBar from '@/components/TheAppBar';
    import TransferListItem from '@/components/event/TransferListItem';

    export default {
        name: 'Transfers',

        components: {
            TransferListItem,
            ShyProgress,
            TheAppBar,
        },

        data() {
            let date = new Date(this.$route.params?.date);
            if (!date.getTime()) {
                date = new Date();
            }
            return {
                loading:   false,
                startDate: DateUtils.previousFirstOfMonth(date),
                endDate:   null,

                touch: {
                    left:  () => this.previousMonth(),
                    right: () => this.nextMonth(),
                },
            };
        },

        created() {
            this.reload();
        },

        computed: {
            title() {
                return this.startDate.toLocaleDateString(undefined, {month: 'long', year: 'numeric'});
            },

            events() {
                let events = this.$store.getters.events.filter(event => {
                    return event.type === 'transfer' &&
                        event.date >= this.startDate && event.date < this.endDate;
                });

                events.sort((a, b) => a.date.getTime() - b.date.getTime());
                return events;
            },
        },

        methods: {
            async reload() {
                if (this.loading) {
                    return;
                }
                this.endDate = new Date(this.startDate.getTime());
                this.endDate.setMonth(this.startDate.getMonth() + 1);
                try {
                    this.loading = true;
                    let params = {
                        from:  this.startDate,
                        to:    this.endDate,
                        types: 'transfer',
                    };
                    await this.$store.dispatch('fetchEvents', params);
                } finally {
                    this.loading = false;
                }
            },

            previousMonth() {
                let newDate = new Date(this.startDate.getTime());
                newDate.setMonth(newDate.getMonth() - 1);
                this.$router.push(`/transfers/${DateUtils.isoDate(newDate)}`);
            },

            nextMonth() {
                let newDate = new Date(this.startDate.getTime());
                newDate.setMonth(newDate.getMonth() + 1);
                this.$router.push(`/transfers/${DateUtils.isoDate(newDate)}`);
            },
        },
    };
</script>

<style lang="scss" scoped>
    .v-btn--fab {
        // This is a known issue, it doesn't account for the bottom navigation
        bottom: 16px !important;
    }
</style>
