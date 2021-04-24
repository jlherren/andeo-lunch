<template>
    <v-container>
        <v-row>
            <v-col cols="6" :class="getValueClass(this.balances.points)">
                {{ this.balances.points }}
                <v-icon>mdi-handshake</v-icon>
            </v-col>
            <v-col cols="6" :class="getValueClass(this.balances.money)">
                {{ this.balances.money }} CHF
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
    import {mapGetters} from 'vuex';

    export default {
        name:     'userStats',
        computed: {
            ...mapGetters([
                'balances',
            ]),
        },
        methods:  {
            getValueClass(value) {
                let classString = 'center-text ';
                classString += value >= 0 ? 'positive' : 'negative';
                return classString;
            },
        },
    };
</script>

<style scoped lang="scss">
    .container {
        font-size: 16pt;
    }

    .v-icon {
        color: inherit;
    }

    .positive {
        color: #43a047;
    }

    .negative {
        color: #c62828;
    }
</style>
