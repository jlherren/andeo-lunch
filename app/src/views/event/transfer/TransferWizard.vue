<template>
    <v-main>
        <the-app-bar sub-page>
            Choose a transfer scenario
        </the-app-bar>

        <v-list>
            <v-list-item to="/transfers/new/expense">
                <v-list-item-icon>
                    <v-icon>{{ $icons.transferIn }}</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                    <v-list-item-title>Simple reimbursement</v-list-item-title>
                    <v-list-item-subtitle>Get reimbursed for paying for another person</v-list-item-subtitle>
                </v-list-item-content>
            </v-list-item>

            <v-list-item @click="lunchReimbursementAlertOpen = true">
                <v-list-item-icon>
                    <v-icon>{{ $icons.transferIn }}</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                    <v-list-item-title>Reimbursement for lunch ingredients</v-list-item-title>
                    <v-list-item-subtitle>Get reimbursed for buying additional lunch ingredients</v-list-item-subtitle>
                </v-list-item-content>
            </v-list-item>

            <v-list-item to="/transfers/new/simple">
                <v-list-item-icon>
                    <v-icon>{{ $icons.transferOut }}</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                    <v-list-item-title>Virtual money or point transfer</v-list-item-title>
                    <v-list-item-subtitle>Send a gift or honor a bet</v-list-item-subtitle>
                </v-list-item-content>
            </v-list-item>

            <v-list-item to="/transfers/new/pay-up">
                <v-list-item-icon>
                    <v-icon>{{ $icons.transferPayUp }}</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                    <v-list-item-title>Pay up</v-list-item-title>
                    <v-list-item-subtitle>Pay up with real money to restore your balance</v-list-item-subtitle>
                </v-list-item-content>
            </v-list-item>

            <v-list-item to="/transfers/new/trade">
                <v-list-item-icon>
                    <v-icon>{{ $icons.transferTrade }}</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                    <v-list-item-title>Trade points</v-list-item-title>
                    <v-list-item-subtitle>Buy or sell points for money</v-list-item-subtitle>
                </v-list-item-content>
            </v-list-item>

            <v-list-item to="/transfers/new/custom">
                <v-list-item-icon>
                    <v-icon>{{ $icons.transferCustom }}</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                    <v-list-item-title>Custom</v-list-item-title>
                    <v-list-item-subtitle>Custom transfer with arbitrary transactions</v-list-item-subtitle>
                </v-list-item-content>
            </v-list-item>
        </v-list>

        <v-dialog v-model="lunchReimbursementAlertOpen" max-width="600">
            <v-card>
                <v-card-title>
                    Wrong place
                </v-card-title>
                <v-card-text>
                    Reimbursements for lunch expenses should be added to the lunch itself, not here.
                    Go to the lunch you had an expense for, tap on your own participation and add the amount
                    you spent in the "Money credited" field.
                </v-card-text>
                <v-card-actions>
                    <v-spacer/>
                    <v-btn text @click="lunchReimbursementAlertOpen = false">Oh, okay!</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-main>
</template>

<script>
    import TheAppBar from '@/components/TheAppBar';

    export default {
        name: 'TransferWizard',

        components: {
            TheAppBar,
        },

        data() {
            return {
                lunchReimbursementAlertOpen: false,
            };
        },
    };
</script>
