<template>
    <span class="stats">
        <balance :value="ownUser.balances.points" color points precise/>
        <balance :value="ownUser.balances.money" color money precise/>
    </span>
</template>

<script>
    import Balance from '@/components/Balance';
    import {mapState} from 'pinia';
    import {useStore} from '@/store';

    export default {
        name: 'UserStats',

        components: {
            Balance,
        },

        computed: {
            ...mapState(useStore, [
                'ownUser',
            ]),
        },
    };
</script>

<style lang="scss" scoped>
    .stats {
        font-size: 16pt;
        white-space: nowrap;

        span + span {
            margin-left: 0.5em;
        }
    }
</style>
