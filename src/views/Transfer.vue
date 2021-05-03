<template>
    <v-main>
        <the-app-bar>Transfer</the-app-bar>

        <v-container>
            <v-banner elevation="2" :icon="$icons.alert">
                Not implemented.  Direct points and money transfers will appear here.
            </v-banner>
        </v-container>
    </v-main>
</template>

<script>
    import TheAppBar from '@/components/TheAppBar';

    export default {
        name: 'Menus',

        components: {
            TheAppBar,
        },
    };
</script>
