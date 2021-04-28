<template>
    <v-main>
        <custom-app-bar>Menus</custom-app-bar>

        <v-container>
            <v-banner single-line elevation="2">
                <v-icon slot="icon">mdi-alert</v-icon>
                Not implemented.  Recurring menus will appear here.
            </v-banner>
        </v-container>
    </v-main>
</template>

<script>
    import CustomAppBar from '@/components/lmAppBar';

    export default {
        name: 'Menus',

        components: {
            CustomAppBar,
        },
    };
</script>
