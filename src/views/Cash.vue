<template>
    <v-main>
        <the-app-bar extension-height="30">
            Transactions
            <template v-slot:buttons>
                <user-stats/>
            </template>
            <template v-slot:extension>
                <v-tabs v-model="tab" align-with-title>
                    <v-tab>
                        <v-icon size="18">{{ $icons.points }}</v-icon>
                    </v-tab>
                    <v-tab>
                        <v-icon size="18">{{ $icons.money }}</v-icon>
                    </v-tab>
                </v-tabs>
            </template>
        </the-app-bar>

        <v-virtual-scroll item-height="30" :items="transactions" ref="scroll">
            <template v-slot:default="{item: transaction}">
                <v-list-item :to="'/events/' + transaction.eventId" :key="transaction.id" :class="transaction.class">
                    <span>{{ formatDate(transaction.date) }}</span>
                    <span>{{ transaction.eventName }}</span>
                    <balance :value="transaction.amount" precise small color/>
                    <balance :value="transaction.balance" precise small color/>
                </v-list-item>
            </template>
        </v-virtual-scroll>
    </v-main>
</template>

<script>
    import UserStats from '../components/UserStats';
    import TheAppBar from '@/components/TheAppBar';
    import Balance from '@/components/Balance';
    import * as DateUtils from '@/utils/dateUtils';
    import Vue from 'vue';

    export default {
        name: 'Cash',

        components: {
            Balance,
            TheAppBar,
            UserStats,
        },

        data() {
            return {
                ownUserId: this.$store.getters.ownUserId,
                tab:       0,
            };
        },

        async created() {
            await this.$store.dispatch('fetchTransactions', {userId: this.ownUserId});
            this.scrollToBottom();
        },

        computed: {
            transactions() {
                let currency = ['points', 'money'][this.tab];
                let transactions = this.$store.getters.transactions(this.ownUserId) || [];
                return transactions.filter(t => t.currency === currency)
                                   .map((t, i) => ({...t, class: i % 2 ? 'odd' : null}));
            },
        },

        watch: {
            tab() {
                Vue.nextTick(() => this.scrollToBottom());
            },
        },

        methods: {
            formatDate(date) {
                return DateUtils.displayFormat(date);
            },

            scrollToBottom() {
                let element = this.$refs.scroll.$el;
                element.scrollTop = element.scrollHeight;
            },
        },
    };
</script>

<style scoped lang="scss">
    .v-virtual-scroll {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        height: auto;
    }

    .v-list-item {
        padding: 0.5ex 1em;
        height: 30px;
        min-height: auto;
        display: flex;
        max-width: 800px;

        & > span {
            display: block;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        & > span:nth-child(1) {
            flex: 0 0 35%;
        }

        & > span:nth-child(2) {
            flex: 0 0 25%;
        }

        & > span:nth-child(3), & > span:nth-child(4) {
            flex: 0 0 20%;
            text-align: right;
        }
        & > span:nth-child(4) {
            font-weight: bold;
        }
    }

    .v-virtual-scroll__item {
        .transaction.odd {
            background: #f5f5f5;
        }
    }
</style>
