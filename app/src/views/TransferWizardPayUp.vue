<template>
    <v-main>
        <the-app-bar sub-page>
            Pay up

            <template v-slot:buttons>
                <v-btn color="primary" @click="save()" :disabled="isBusy">Save</v-btn>
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
                          :items="users" item-text="name" item-value="id"
                          :rules="recipientRules"
                          :prepend-icon="$icons.account"/>
                <v-text-field type="number" v-model="amount" label="Amount in CHF"
                              min="0" :rules="amountRules"
                              class="no-spinner" :prepend-icon="$icons.money"/>

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
    import ShyProgress from '@/components/ShyProgress';
    import TheAppBar from '@/components/TheAppBar';
    import {mapGetters} from 'vuex';

    export default {
        name: 'TransferWizardPayUp',

        components: {
            ShyProgress,
            TheAppBar,
        },

        data() {
            return {
                isBusy:         false,
                amount:         null,
                recipient:      null,
                recipientRules: [
                    v => !!v && v !== this.$store.getters.ownUserId,
                ],
                amountRules:    [
                    v => v > 0,
                ],
            };
        },

        async created() {
            // noinspection ES6MissingAwait
            this.$store.dispatch('fetchUsers');

            await this.$store.dispatch('fetchPayUpDefaultRecipient');
            if (this.recipient === null) {
                let defaultRecipient = this.$store.getters.payUpDefaultRecipient;
                // Do not set if it is null/undefined, otherwise it triggers validation
                if (defaultRecipient && defaultRecipient !== this.$store.getters.ownUserId) {
                    this.recipient = defaultRecipient;
                }
            }
        },

        computed: {
            ...mapGetters([
                'users',
            ]),

            recipientPaymentInfo() {
                if (!this.recipient) {
                    return null;
                }
                return this.$store.getters.paymentInfo(this.recipient);
            },

            recipientName() {
                if (!this.users) {
                    return null;
                }
                return this.users.filter(user => user.id === this.recipient)[0].name;
            },
        },

        methods: {
            async save() {
                if (!this.$refs.form.validate()) {
                    return;
                }
                try {
                    this.isBusy = true;

                    let eventId = await this.$store.dispatch('saveEvent', {
                        name: 'Pay up',
                        date: new Date(),
                        type: 'transfer',
                    });

                    let transfers = [{
                        senderId:    this.recipient,
                        recipientId: this.$store.getters.ownUserId,
                        amount:      this.amount,
                        currency:    'money',
                    }];
                    await this.$store.dispatch('saveTransfers', {eventId, transfers});

                    await this.$router.push(`/events/${eventId}`);
                } catch (err) {
                    this.isBusy = false;
                    throw err;
                }
            },
        },

        watch: {
            recipient(userId) {
                this.$store.dispatch('fetchUserPaymentInfo', {userId});
            },
        },
    };
</script>
