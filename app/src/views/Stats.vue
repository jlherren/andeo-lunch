<template>
    <v-main>
        <the-app-bar>Statistics</the-app-bar>

        <v-container>
            <v-alert v-if="Math.abs(pointsSum) > 1e-6" type="warning" :icon="$icons.alert">
                The sum of all points is {{ pointsSum.toFixed(4) }}
            </v-alert>

            <v-alert v-if="Math.abs(moneySum) > 1e-6" type="warning" :icon="$icons.alert">
                The sum of all money is {{ moneySum.toFixed(4) }}
            </v-alert>

            <v-data-table :headers="tableHeaders" :items="tableItems"
                          dense disable-pagination hide-default-footer must-sort sort-by="points"
                          mobile-breakpoint="300"
                          :loading="tableItems.length === 0"
            >
                <template v-slot:[`header.points`]>
                    <v-icon size="20">{{ $icons.points }}</v-icon>
                </template>
                <template v-slot:[`header.money`]>
                    <v-icon size="20">{{ $icons.money }}</v-icon>
                </template>
                <template v-slot:[`item.points`]="{ item }">
                    <balance v-model="item.points" precise color/>
                </template>
                <template v-slot:[`item.money`]="{ item }">
                    <balance v-model="item.money" precise color/>
                </template>
            </v-data-table>
        </v-container>
    </v-main>
</template>

<script>
    import Balance from '@/components/Balance';
    import TheAppBar from '@/components/TheAppBar';

    export default {
        components: {
            Balance,
            TheAppBar,
        },

        created() {
            this.$store.dispatch('fetchUsers');
        },

        computed: {
            tableHeaders() {
                return [
                    {
                        text:     'Name',
                        value:    'name',
                        sortable: true,
                    },
                    {
                        text:     'Points',
                        value:    'points',
                        align:    'end',
                        sortable: true,
                    },
                    {
                        text:     'Money',
                        value:    'money',
                        align:    'end',
                        sortable: true,
                    },
                ];
            },

            tableItems() {
                return this.$store.getters.visibleUsers.map(user => {
                    return {
                        name:   user.name,
                        points: user.balances.points,
                        money:  user.balances.money,
                    };
                });
            },

            pointsSum() {
                return this.$store.getters.visibleUsers.reduce((acc, user) => acc + user.balances.points, 0);
            },

            moneySum() {
                return this.$store.getters.visibleUsers.reduce((acc, user) => acc + user.balances.money, 0);
            },
        },
    };
</script>
