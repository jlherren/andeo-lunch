<template>
    <v-main>
        <the-app-bar>Statistics</the-app-bar>

        <v-container>
            <v-data-table :headers="tableHeaders" :items="tableItems"
                          dense disable-pagination hide-default-footer must-sort sort-by="points"
                          mobile-breakpoint="300"
            >
                <template v-slot:header.points>
                    <v-icon size="20">{{ $icons.points }}</v-icon>
                </template>
                <template v-slot:header.money>
                    <v-icon size="20">{{ $icons.money }}</v-icon>
                </template>
                <template v-slot:item.points="{ item }">
                    <balance v-model="item.points" precise color/>
                </template>
                <template v-slot:item.money="{ item }">
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
                return this.$store.getters.users.map(user => {
                    return {
                        name:   user.name,
                        points: user.balances.points,
                        money:  user.balances.money,
                    };
                });
            },
        },
    };
</script>
