<template>
    <v-main>
        <custom-app-bar>
            {{ ownUser.name }}
            <template v-slot:buttons>
                <user-stats/>
            </template>
        </custom-app-bar>

        <v-subheader>Upcoming events</v-subheader>

        <v-list v-if="entries.length > 0">
            <template v-for="event in entries">
                <event-list-item :event="event" :key="event.id"/>
            </template>
        </v-list>

        <v-container v-if="entries.length === 0">
            <v-banner elevation="2" single-line>
                <v-icon slot="icon">mdi-information</v-icon>
                No upcoming events
            </v-banner>
        </v-container>

        <v-divider/>

        <v-subheader>Pending opt-in/-out</v-subheader>

        <v-container>
            <v-banner elevation="2" single-line>
                <v-icon slot="icon">mdi-check</v-icon>
                You're all set!
            </v-banner>

        </v-container>

    </v-main>
</template>

<script>
    import UserStats from '@/components/userStats';
    import MenuList from '@/components/menuList';
    import CustomAppBar from '@/components/lmAppBar';
    import {mapGetters} from 'vuex';
    import EventListItem from '@/components/menus/eventListItem';
    import * as DateUtils from '@/utils/dateUtils';

    export default {
        name: 'Home',

        components: {
            EventListItem,
            CustomAppBar,
            MenuList,
            UserStats,
        },

        data() {
            let midnight = DateUtils.getPreviousMidnight(new Date());
            let previousMonday = DateUtils.getPreviousMonday(new Date());
            return {
                startDate: midnight,
                endDate:   DateUtils.addDays(previousMonday, 7),
                loading: false,
            };
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
                        to: this.endDate,
                    };
                    await this.$store.dispatch('fetchEvents', params);
                } finally {
                    this.loading = false;
                }
            },
        },

        created() {
            this.reload();
        },
    };
</script>
