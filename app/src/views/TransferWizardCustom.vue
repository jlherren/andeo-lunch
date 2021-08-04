<template>
    <v-main>
        <the-app-bar sub-page>
            Custom transfer

            <template v-slot:buttons>
                <v-btn text color="primary" disabled>Save</v-btn>
            </template>
        </the-app-bar>

        <v-container>
            <p class="text-body-1 mt-4">
                Custom...
            </p>
        </v-container>
    </v-main>
</template>

<script>
    import TheAppBar from '@/components/TheAppBar';

    export default {
        name: 'TransferWizardCustom',

        components: {
            TheAppBar,
        },
    };
</script>
