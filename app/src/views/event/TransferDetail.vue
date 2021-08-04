<template>
    <v-main>
        <the-app-bar sub-page>
            {{ name }}
            <template v-if="event" slot="buttons">
                <v-btn icon disabled>
                    <v-icon>{{ $icons.edit }}</v-icon>
                </v-btn>
                <v-btn icon disabled>
                    <v-icon>{{ $icons.delete }}</v-icon>
                </v-btn>
            </template>
        </the-app-bar>

        <shy-progress v-if="loading"/>

        <div v-if="event">
            <v-container class="center-text">
                <div class="headline">{{ name }}</div>
                <div class="text--secondary">{{ formattedDate }}</div>
            </v-container>
        </div>

        <v-list v-if="!loading">
            <v-list-item v-for="transfer of transfers" :key="transfer.id">
                <v-list-item-content>
                    <v-list-item-title>
                        {{ transfer.senderName }} &rarr; {{ transfer.recipientName }}
                    </v-list-item-title>
                    <v-list-item-subtitle>
                        <balance :value="transfer.amount"
                                 :points="transfer.currency === 'points'"
                                 :money="transfer.currency === 'money'"
                                 precise small
                        />
                    </v-list-item-subtitle>
                </v-list-item-content>
            </v-list-item>
        </v-list>
    </v-main>
</template>

<script>
    import * as DateUtils from '@/utils/dateUtils';
    import Balance from '@/components/Balance';
    import ShyProgress from '@/components/ShyProgress';
    import TheAppBar from '@/components/TheAppBar';

    export default {
        name: 'TransferDetail',

        components: {
            Balance,
            ShyProgress,
            TheAppBar,
        },

        data() {
            let eventId = parseInt(this.$route.params.id, 10);
            return {
                eventId,
                loading: false,
            };
        },

        async created() {
            try {
                this.loading = true;
                await this.$store.dispatch('fetchTransfers', {eventId: this.eventId});
            } finally {
                this.loading = false;
            }
        },

        computed: {
            event() {
                return this.$store.getters.event(this.eventId);
            },

            transfers() {
                return this.$store.getters.transfers(this.eventId).map(transfer => {
                    return {
                        ...transfer,
                        senderName:    this.$store.getters.user(transfer.senderId)?.name,
                        recipientName: this.$store.getters.user(transfer.recipientId)?.name,
                    };
                });
            },

            name() {
                return this.event?.name || 'Loading...';
            },

            formattedDate() {
                return this.event.date !== null ? DateUtils.displayFormat(this.event.date) : null;
            },
        },

        methods: {},
    };
</script>
