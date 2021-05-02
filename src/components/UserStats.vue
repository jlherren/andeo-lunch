<template>
    <span class="stats">
        <balance :value="ownUser.balances.points" color points precise/>
        <balance :value="ownUser.balances.money" color money precise/>
    </span>
</template>

<script>
    import Balance from '@/components/Balance';
    import {mapGetters} from 'vuex';

    export default {
        name:       'userStats',

        components: {
            Balance,
        },

        computed:   {
            ...mapGetters([
                'ownUser',
            ]),
        },
    };
</script>

<style scoped lang="scss">
    .stats {
        font-size: 16pt;
        white-space: nowrap;

        span + span {
            margin-left: 0.5em;
        }
    }
</style>
