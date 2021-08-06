<template>
    <v-main>
        <the-app-bar sub-page>
            Pay up

            <template v-slot:buttons>
                <v-btn text color="primary" @click="save()" :disabled="isBusy">Save</v-btn>
            </template>
        </the-app-bar>

        <shy-progress v-if="isBusy"/>

        <v-container>
            <p class="text-body-1 mt-4">
                Send real-world money to the recipient first, then add the transaction here
                to restore your money balance.
            </p>

            <v-form ref="form" :disabled="isBusy" @submit.prevent="save()">
                <v-select v-model="recipient" label="Recipient of real-world money"
                          :items="users" item-text="name" item-value="id"
                          :rules="recipientRules"
                          :prepend-icon="$icons.account"/>
                <v-text-field type="number" v-model="amount" label="Amount in CHF"
                              min="0" :rules="amountRules"
                              class="no-spinner" :prepend-icon="$icons.money"/>
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
                    v => !!v,
                ],
                amountRules:    [
                    v => v > 0,
                ],
            };
        },

        created() {
            this.$store.dispatch('fetchUsers');
        },

        computed: {
            ...mapGetters([
                'users',
            ]),
        },

        methods: {
            async save() {
                if (!this.$refs.form.validate()) {
                    return;
                }
                try {
                    this.isBusy = true;

                    let eventId = await this.$store.dispatch('saveEvent', {
                        name: 'Pay up transfer',
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
    };
</script>
