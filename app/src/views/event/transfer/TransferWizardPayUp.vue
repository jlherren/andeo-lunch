<template>
    <v-main>
        <the-app-bar sub-page>
            Pay up

            <template #buttons>
                <v-btn color="primary" @click="save" :disabled="isBusy">Save</v-btn>
            </template>
        </the-app-bar>

        <shy-progress v-if="isBusy"/>

        <v-container>
            <p class="text-body-1 mt-4">
                Send real money to someone else in order to restore your money balance.
                Please send the money to the recipient <i>before</i> adding the transfer here.
            </p>

            <v-form ref="form" :disabled="isBusy" @submit.prevent="save()">
                <v-select v-model="recipient" label="Recipient of real money"
                          :items="visibleUsers" item-text="name" item-value="id"
                          :rules="recipientRules"
                          :append-icon="$icons.account"/>
                <v-text-field type="number" v-model="amount" label="Amount in CHF"
                              min="0" :rules="amountRules"
                              class="no-spinner" :append-icon="$icons.money"/>

                <v-card v-if="recipientPaymentInfo !== null">
                    <v-card-title class="subtitle-2">
                        Payment information for {{ this.recipientName }}
                    </v-card-title>
                    <v-card-text v-html="recipientPaymentInfo"/>
                </v-card>

                <!-- Button is to make it submittable by pressing enter -->
                <v-btn type="submit" :disabled="isBusy" v-show="false">Save</v-btn>
            </v-form>
        </v-container>
    </v-main>
</template>

<script>
    import ShyProgress from '@/components/ShyProgress.vue';
    import TheAppBar from '@/components/TheAppBar.vue';
    import {mapState} from 'pinia';
    import {useStore} from '@/store';

    export default {
        name: 'TransferWizardPayUp',

        components: {
            ShyProgress,
            TheAppBar,
        },

        data() {
            return {
                isBusy:         true,
                amount:         null,
                recipient:      null,
                recipientRules: [
                    value => !!value || 'A recipient is required',
                    value => value !== this.$store().ownUserId || 'The recipient cannot be you',
                ],
                amountRules:    [
                    value => value > 0 || 'A positive amount is required',
                ],
            };
        },

        async created() {
            // noinspection ES6MissingAwait
            this.$store().fetchUsers();

            await this.$store().fetchPayUpDefaultRecipient();
            if (this.recipient === null) {
                let defaultRecipient = this.$store().payUpDefaultRecipient;
                // Do not set if it is null/undefined, otherwise it triggers validation
                if (defaultRecipient && defaultRecipient !== this.$store().ownUserId) {
                    this.recipient = defaultRecipient;
                }
            }

            this.isBusy = false;
        },

        computed: {
            ...mapState(useStore, [
                'visibleUsers',
            ]),

            recipientPaymentInfo() {
                if (!this.recipient) {
                    return null;
                }
                return this.$store().paymentInfo(this.recipient);
            },

            recipientName() {
                if (!this.recipient) {
                    return null;
                }
                return this.$store().user(this.recipient).name;
            },
        },

        methods: {
            async save() {
                if (!this.$refs.form.validate()) {
                    return;
                }
                try {
                    this.isBusy = true;

                    let eventId = await this.$store().saveEvent({
                        name:      'Pay up',
                        date:      new Date(),
                        type:      'transfer',
                        transfers: [{
                            senderId:    this.recipient,
                            recipientId: this.$store().ownUserId,
                            amount:      this.amount,
                            currency:    'money',
                        }],
                    });

                    await this.$router.replace(`/transfers/${eventId}`);
                } catch (err) {
                    this.isBusy = false;
                    throw err;
                }
            },
        },

        watch: {
            recipient(userId) {
                this.$store().fetchUserPaymentInfo({userId});
            },
        },
    };
</script>
