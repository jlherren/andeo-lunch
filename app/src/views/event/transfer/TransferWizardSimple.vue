<template>
    <v-main>
        <the-app-bar sub-page>
            Simple transfer

            <template #buttons>
                <v-btn color="primary" @click="save" :disabled="isBusy">Save</v-btn>
            </template>
        </the-app-bar>

        <shy-progress v-if="isBusy"/>

        <v-container>
            <p class="text-body-1 mt-4">
                Send points or money to someone as a gift, or to honor a lost bet.
            </p>

            <v-form ref="form" :disabled="isBusy" @submit.prevent="save()">
                <v-select v-model="sender" label="Sender"
                          :items="visibleUsers" item-text="name" item-value="id"
                          :rules="senderRules"
                          :append-icon="$icons.account"/>
                <v-select v-model="recipient" label="Recipient"
                          :items="visibleUsers" item-text="name" item-value="id"
                          :rules="recipientRules"
                          :append-icon="$icons.account"/>

                <v-row>
                    <v-col cols="6">
                        <v-text-field type="number" v-model="amount" label="Amount"
                                      min="0" :rules="amountRules"
                                      class="no-spinner" :append-icon="currency === 'money' ? $icons.money : $icons.points"/>
                    </v-col>
                    <v-col cols="6">
                        <v-btn-toggle v-model="currency" class="full-width" mandatory>
                            <v-btn value="points">
                                <v-icon left :large="$vuetify.breakpoint.mdAndUp">{{ $icons.points }}</v-icon>
                                <span class="hidden-xs-only">Points</span>
                            </v-btn>
                            <v-btn value="money">
                                <v-icon left :large="$vuetify.breakpoint.mdAndUp">{{ $icons.money }}</v-icon>
                                <span class="hidden-xs-only">Money</span>
                            </v-btn>
                        </v-btn-toggle>
                    </v-col>
                </v-row>

                <v-text-field v-model="reason" label="Reason"
                              :rules="reasonRules"
                              :append-icon="$icons.label"/>

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
        name: 'TransferWizardSimple',

        components: {
            ShyProgress,
            TheAppBar,
        },

        data() {
            return {
                isBusy:         true,
                sender:         this.$store().ownUserId,
                recipient:      null,
                amount:         null,
                currency:       'points',
                reason:         '',
                senderRules:    [
                    value => !!value || 'A sender is required',
                ],
                recipientRules: [
                    value => !!value || 'A recipient is required',
                    value => value !== this.sender || 'Recipient must be different from sender',
                ],
                amountRules:    [
                    value => value > 0 || 'A positive amount is required',
                ],
                reasonRules:    [
                    value => value !== '' || 'A reason is required',
                ],
            };
        },

        created() {
            this.$store().fetchUsers();
            this.isBusy = false;
        },

        computed: {
            ...mapState(useStore, [
                'visibleUsers',
            ]),
        },

        methods: {
            async save() {
                if (!this.$refs.form.validate()) {
                    return;
                }
                try {
                    this.isBusy = true;

                    let eventId = await this.$store().saveEvent({
                        name:      this.reason,
                        date:      new Date(),
                        type:      'transfer',
                        transfers: [{
                            senderId:    this.sender,
                            recipientId: this.recipient,
                            amount:      this.amount,
                            currency:    this.currency,
                        }],
                    });

                    await this.$router.replace(`/transfers/${eventId}`);
                } catch (err) {
                    this.isBusy = false;
                    throw err;
                }
            },
        },
    };
</script>
