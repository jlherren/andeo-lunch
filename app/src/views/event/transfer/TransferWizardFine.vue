<template>
    <v-main>
        <the-app-bar sub-page>
            Custom transfer

            <template #buttons>
                <v-btn color="primary" disabled>Save</v-btn>
            </template>
        </the-app-bar>

        <v-container>
            <p class="text-body-1 mt-4">
                Fines...
            </p>
        </v-container>
    </v-main>
</template>

<script>
    import TheAppBar from '@/components/TheAppBar.vue';

    export default {
        name: 'TransferWizardFine',

        components: {
            TheAppBar,
        },
    };
</script>
