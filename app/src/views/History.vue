<template>
    <v-main>
        <the-app-bar extension-height="30">
            {{ user.name }}
            <template #buttons>
                <user-stats :user="user"/>
            </template>
            <template #extension>
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

        <shy-progress v-if="loading"/>

        <v-container v-if="!loading && transactions.length === 0">
            <v-banner elevation="2" single-line :icon="$icons.information">
                No balance history
            </v-banner>
        </v-container>

        <v-virtual-scroll ref="scroll" :items="transactions" item-height="30" bench="1">
            <template v-if="!loading" #default="{item: transaction}">
                <v-list-item :key="transaction.id" :class="transaction.class" :to="'/events/' + transaction.eventId">
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
    import * as DateUtils from '@/utils/dateUtils';
    import Balance from '@/components/Balance';
    import ShyProgress from '@/components/ShyProgress';
    import TheAppBar from '@/components/TheAppBar';
    import UserStats from '@/components/UserStats';
    import Vue from 'vue';

    export default {
        name: 'History',

        components: {
            Balance,
            ShyProgress,
            TheAppBar,
            UserStats,
        },

        data() {
            return {
                userId:  parseInt(this.$route.params.id, 10),
                tab:     0,
                loading: true,
            };
        },

        async created() {
            await Promise.all([
                this.$store().fetchUser(this.userId),
                this.$store().fetchTransactions(this.userId),
            ]);
            this.loading = false;
            Vue.nextTick(() => this.scrollToBottom());
        },

        computed: {
            transactions() {
                let currency = ['points', 'money'][this.tab];
                let transactions = this.$store().transactions(this.userId) || [];
                let now = new Date();
                return transactions.filter(t => t.currency === currency)
                    .map((t, i) => {
                        let classes = [];
                        if (i % 2) {
                            classes.push('odd');
                        }
                        if (t.date > now) {
                            classes.push('future');
                        }
                        return {
                            ...t,
                            class: classes.join(' '),
                        };
                    });
            },

            user() {
                return this.$store().user(this.userId);
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

<style lang="scss" scoped>
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
        margin: 0 auto;
        font-size: 11pt;

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

    .theme--light.odd {
        background: #f5f5f5;
    }

    .theme--dark.odd {
        background: #000000;
    }

    // Need extra specificity to override color
    .theme--light.future.v-list-item, .theme--dark.future.v-list-item {
        color: #c0c0c0 !important;
    }
</style>
