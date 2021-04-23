<template>
    <v-main>
        <custom-app-bar>Menus</custom-app-bar>

        <v-container>
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
