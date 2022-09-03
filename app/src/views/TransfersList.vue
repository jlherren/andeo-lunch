<template>
    <v-main v-touch="touch">
        <the-app-bar>
            {{ title }}
            <template v-slot:buttons>
                <dynamic-button label="Previous month" :icon="$icons.chevronLeft" @click="previousMonth"/>
                <dynamic-button label="Next month" :icon="$icons.chevronRight" right @click="nextMonth"/>
            </template>
        </the-app-bar>

        <shy-progress v-if="loading"/>

        <v-list>
            <template v-if="hasData">
                <template v-for="event of events">
                    <transfer-list-item :key="event.id" :event="event"/>
                </template>
            </template>
            <template v-else>
                <v-skeleton-loader type="list-item-avatar"/>
            </template>
        </v-list>

        <v-container v-if="!loading && events.length === 0">
            <v-banner elevation="2" single-line :icon="$icons.information">
                No transfers
            </v-banner>
        </v-container>

        <v-btn color="primary" fixed bottom right fab to="/transfers/new">
            <v-icon>{{ $icons.plus }}</v-icon>
        </v-btn>
    </v-main>
</template>

<script>
    import * as DateUtils from '@/utils/dateUtils';
    import DynamicButton from '../components/DynamicButton';
    import ShyProgress from '@/components/ShyProgress';
    import TheAppBar from '@/components/TheAppBar';
    import TransferListItem from '@/components/event/TransferListItem';

    export default {
        name: 'Transfers',

        components: {
            DynamicButton,
            ShyProgress,
            TheAppBar,
            TransferListItem,
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
                    left:  () => this.nextMonth(),
                    right: () => this.previousMonth(),
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

            hasData() {
                return this.events.length || !this.loading;
            },

            events() {
                let events = this.$store().events.filter(event => {
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
                    await this.$store().fetchEvents(params);
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
        bottom: 16px + 56px;
    }
</style>
