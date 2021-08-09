<template>
    <v-main>
        <the-app-bar sub-page>
            Expense...

            <template v-slot:buttons>
                <v-btn text color="primary" disabled>Save</v-btn>
            </template>
        </the-app-bar>

        <v-container>
            <p class="text-body-1 mt-4">
                Lunch...
            </p>
        </v-container>
    </v-main>
</template>

<script>
    import TheAppBar from '@/components/TheAppBar';

    export default {
        name: 'TransferWizardExpense',

        components: {
            TheAppBar,
        },
    };
</script>
