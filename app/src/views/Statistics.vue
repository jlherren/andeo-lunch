<template>
    <v-main>
        <the-app-bar>
            Statistics
            <template #buttons>
                <dynamic-button label="Refresh" :icon="icons.refresh" @click="refresh"/>
            </template>
        </the-app-bar>

        <shy-progress v-if="loading"/>

        <v-list>
            <v-list-item>
                <v-list-item-icon>
                    <v-icon>{{ icons.omnivorous }}</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                    <v-list-item-title>Opted in to lunch</v-list-item-title>
                    <v-list-item-subtitle>{{ statistics?.optedInCount ?? '–' }} times</v-list-item-subtitle>
                </v-list-item-content>
            </v-list-item>

            <v-list-item>
                <v-list-item-icon>
                    <v-icon>{{ icons.lunch }}</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                    <v-list-item-title>Cooked</v-list-item-title>
                    <v-list-item-subtitle>{{ statistics?.cookedCount ?? '–' }} times</v-list-item-subtitle>
                </v-list-item-content>
            </v-list-item>

            <v-list-item>
                <v-list-item-icon>
                    <v-icon>{{ icons.money }}</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                    <v-list-item-title>Average cost of your lunches</v-list-item-title>
                    <v-list-item-subtitle>
                        <template v-if="statistics?.averageMenuCost != null">
                            <balance :value="statistics.averageMenuCost" no-sign precise/>
                            CHF
                        </template>
                        <template v-else>&#8211;</template>
                    </v-list-item-subtitle>
                </v-list-item-content>
            </v-list-item>

            <v-list-item>
                <v-list-item-icon>
                    <v-icon>{{ icons.cookingPartner }}</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                    <v-list-item-title>{{ favoriteCookingPartners.length > 1 ? 'Favorite cooking partners' : 'Favorite cooking partner' }}</v-list-item-title>
                    <v-list-item-subtitle v-if="favoriteCookingPartners.length">
                        {{ favoriteCookingPartners.map(user => user.name).join(', ') }}
                        ({{ statistics.favoriteCookingPartnerCount }} times)
                    </v-list-item-subtitle>
                    <v-list-item-subtitle v-else>&#8211;</v-list-item-subtitle>
                </v-list-item-content>
            </v-list-item>

            <v-list-item>
                <v-list-item-icon>
                    <v-icon>{{ icons.streak }}</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                    <v-list-item-title>Longest opt-in streak</v-list-item-title>
                    <v-list-item-subtitle v-if="statistics">
                        {{ statistics.longestOptInStreak }} lunches in a row
                        <template v-if="longestOptInStreakStartDate">({{ longestOptInStreakStartDate }})</template>
                    </v-list-item-subtitle>
                    <v-list-item-subtitle v-else>&#8211;</v-list-item-subtitle>
                </v-list-item-content>
            </v-list-item>
        </v-list>
    </v-main>
</template>

<script>
    import * as DateUtils from '@/utils/dateUtils';
    import Balance from '@/components/Balance';
    import DynamicButton from '../components/DynamicButton.vue';
    import ShyProgress from '@/components/ShyProgress';
    import TheAppBar from '@/components/TheAppBar';
    import {icons} from '@/plugins/icons';

    export default {
        setup() {
            return {icons};
        },

        components: {
            Balance,
            DynamicButton,
            ShyProgress,
            TheAppBar,
        },

        data() {
            return {
                loading: true,
            };
        },

        async created() {
            await this.$store().fetchUserStatistics(this.$store().ownUserId);
            this.loading = false;
        },

        computed: {
            statistics() {
                return this.$store().statistics(this.$store().ownUserId);
            },

            favoriteCookingPartners() {
                return (this.statistics?.favoriteCookingPartners ?? []).map(userId => this.$store().user(userId));
            },

            longestOptInStreakStartDate() {
                let date = this.statistics?.longestOptInStreakStartDate;
                return date ? DateUtils.displayFormatNoWeekday(date) : null;
            },
        },

        methods: {
            async refresh() {
                try {
                    this.loading = true;
                    await this.$store().fetchUserStatistics(this.$store().ownUserId, true);
                } finally {
                    this.loading = false;
                }
            },
        },
    };
</script>
