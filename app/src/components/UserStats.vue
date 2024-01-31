<template>
    <span class="stats">
        <balance :value="user?.balances?.points" color points precise/>
        <balance :value="user?.balances?.money" color money precise/>
    </span>
</template>

<script>
    import Balance from '@/components/Balance';

    export default {
        name: 'UserStats',

        components: {
            Balance,
        },

        props: {
            user: {
                type:     Object,
                required: true,
            },
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
