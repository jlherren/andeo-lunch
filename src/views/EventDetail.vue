<template>
    <v-main>
        <lm-app-bar sub-page>{{ event.name }}</lm-app-bar>

        <v-container class="center-text">
            <h2>{{ event.name }}</h2>
            <div class="text--secondary">{{ formattedDate }}</div>

            <div class="costs">
                <participation-summary :participations="participations"/>
                <span>{{ event.costs.points }} <v-icon>mdi-handshake</v-icon></span>
                <span>{{ event.costs.money }} CHF</span>
            </div>
        </v-container>

        <v-tabs fixed-tabs v-model="tab">
            <v-tab key="participations">
                <v-icon>mdi-food</v-icon>
            </v-tab>
            <v-tab key="money">
                <v-icon>mdi-cash-multiple</v-icon>
            </v-tab>
        </v-tabs>

        <v-tabs-items v-model="tab">
            <v-tab-item key="participations">
                <v-list>
                    <participation-list-item v-for="participation in participations" :key="participation.userId"
                                             v-if="participation.type !== 'none'" :participation="participation"/>
                </v-list>
            </v-tab-item>

            <v-tab-item key="money">
                <v-list>
                    <participation-list-item v-for="participation in participations" :key="participation.userId"
                                             v-if="participation.type === 'none'" :participation="participation"/>
                </v-list>
            </v-tab-item>
        </v-tabs-items>
    </v-main>
</template>

<script>
    import LmAppBar from '@/components/lmAppBar';
    import ParticipationSummary from '@/components/menus/participation-summary';
    import ParticipationListItem from '@/components/menus/participation-list-item';

    export default {
        name: 'EventDetail',

        components: {
            ParticipationListItem,
            ParticipationSummary,
            LmAppBar,
        },

        data() {
            let eventId = parseInt(this.$route.params.id, 10);
            return {
                eventId,
                tab: 'participations',
            };
        },

        computed: {
            event() {
                return this.$store.getters.event(this.eventId);
            },

            participations() {
                return this.$store.getters.participations(this.eventId);
            },

            formattedDate() {
                return this.event.date !== null ? this.event.date.toDateString() : null;
            },
        },

        created() {
            this.$store.dispatch('fetchEvent', {eventId: this.eventId});
            this.$store.dispatch('fetchParticipations', {eventId: this.eventId});
        },
    };
</script>

<style lang="scss" scoped>
    .costs {
        //margin-left: 30px;
        color: #C62828;
        font-size: 28pt;

        .v-icon {
            font-size: inherit;
            color: inherit;
        }

        span {
            margin: 0 0.5em;
        }
    }

    .participants-and-cost {
        text-align: center;
    }
</style>
