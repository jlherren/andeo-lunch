<template>
    <v-main>
        <the-app-bar logo no-menu/>

        <shy-progress/>
    </v-main>
</template>

<script>
    import ShyProgress from '@/components/ShyProgress';
    import TheAppBar from '@/components/TheAppBar';

    export default {
        name: 'Loading',

        components: {
            ShyProgress,
            TheAppBar,
        },
    };
</script>
