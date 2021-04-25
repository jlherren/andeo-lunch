<template>
    <span class="stats">
        <span :class="getValueClass(ownUser.balances.points)">
            {{ ownUser.balances.points }}
            <v-icon>mdi-handshake</v-icon>
        </span>
        <span :class="getValueClass(ownUser.balances.money)">
            {{ ownUser.balances.money }} CHF
        </span>
    </span>
</template>

<script>
    import {mapGetters} from 'vuex';

    export default {
        name:     'userStats',
        computed: {
            ...mapGetters([
                'ownUser',
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
    .stats {
        font-size: 16pt;

        span + span {
            margin-left: 1em;
        }
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
