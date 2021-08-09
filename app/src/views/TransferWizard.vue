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
                    <v-list-item-title>Log an expense</v-list-item-title>
                    <v-list-item-subtitle>Reimbursement after paying for someone else</v-list-item-subtitle>
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

            <v-list-item to="/transfers/new/fine" disabled>
                <v-list-item-icon>
                    <v-icon>{{ $icons.transferFine }}</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                    <v-list-item-title>Send points to everyone</v-list-item-title>
                    <v-list-item-subtitle>Pay a fine</v-list-item-subtitle>
                    <v-list-item-subtitle>
                        <v-icon small>{{ $icons.alert }}</v-icon>
                        Not implemented
                    </v-list-item-subtitle>
                </v-list-item-content>
            </v-list-item>

            <v-list-item to="/transfers/new/custom" disabled>
                <v-list-item-icon>
                    <v-icon>{{ $icons.transferCustom }}</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                    <v-list-item-title>Custom</v-list-item-title>
                    <v-list-item-subtitle>Custom transfer with arbitrary transactions</v-list-item-subtitle>
                    <v-list-item-subtitle>
                        <v-icon small>{{ $icons.alert }}</v-icon>
                        Not implemented
                    </v-list-item-subtitle>
                </v-list-item-content>
            </v-list-item>
        </v-list>
    </v-main>
</template>

<script>
    import TheAppBar from '@/components/TheAppBar';

    export default {
        name: 'TransferWizard',

        components: {
            TheAppBar,
        },
    };
</script>
