<template>
    <v-main>
        <the-app-bar sub-page>
            Simple transfer

            <template v-slot:buttons>
                <v-btn text color="primary" @click="save()" :disabled="isBusy">Save</v-btn>
            </template>
        </the-app-bar>

        <shy-progress v-if="isBusy"/>

        <v-container>
            <p class="text-body-1 mt-4">
                Send points or money to someone as a gift, or to honor a lost bet.
            </p>

            <v-form ref="form" :disabled="isBusy" @submit.prevent="save()">
                <v-select v-model="sender" label="Sender"
                          :items="users" item-text="name" item-value="id"
                          :rules="senderRules"
                          :prepend-icon="$icons.account"/>
                <v-select v-model="recipient" label="Recipient"
                          :items="users" item-text="name" item-value="id"
                          :rules="recipientRules"
                          :prepend-icon="$icons.account"/>

                <v-row>
                    <v-col cols="6">
                        <v-text-field type="number" v-model="amount" label="Amount"
                                      min="0" :rules="amountRules"
                                      class="no-spinner" :prepend-icon="currency === 'money' ? $icons.money : $icons.points"/>
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
                              :prepend-icon="$icons.label"/>

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
        name: 'TransferWizardSimple',

        components: {
            ShyProgress,
            TheAppBar,
        },

        data() {
            return {
                isBusy:         false,
                sender:         this.$store.getters.ownUserId,
                recipient:      null,
                amount:         null,
                currency:       'points',
                reason:         '',
                senderRules:    [
                    v => !!v,
                ],
                recipientRules: [
                    v => !!v && v !== this.sender,
                ],
                amountRules:    [
                    v => v > 0,
                ],
                reasonRules:    [
                    v => v !== '',
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
                        name: this.reason,
                        date: new Date(),
                        type: 'transfer',
                    });

                    let transfers = [{
                        senderId:    this.sender,
                        recipientId: this.recipient,
                        amount:      this.amount,
                        currency:    this.currency,
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
