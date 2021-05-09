<template>
    <v-main>
        <the-app-bar sub-page>
            Audit log
        </the-app-bar>

        <shy-progress v-if="loading"/>

        <v-container>
            <v-banner elevation="2" :icon="$icons.alert">
                Not implemented.  Audit log will appear here.
            </v-banner>
        </v-container>
    </v-main>
</template>

<script>
    import ShyProgress from '@/components/ShyProgress';
    import TheAppBar from '@/components/TheAppBar';

    export default {
        components: {
            ShyProgress,
            TheAppBar,
        },

        data() {
            return {
                loading: false,
            };
        },
    };
</script>
