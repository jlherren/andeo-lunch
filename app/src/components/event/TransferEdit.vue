<template>
    <v-card>
        <v-form :disabled="isBusy" @submit.prevent="save()" ref="form">
            <v-card-title>New transfer entry</v-card-title>

            <v-card-text>
                <v-row>
                    <v-col>
                        <v-select v-model="sender" label="Sender"
                                  :items="users" item-text="name" item-value="id"
                                  :rules="senderRules"
                                  :append-icon="sender === -1 ? $icons.transferPot : $icons.account"/>
                    </v-col>
                    <v-col>
                        <v-select v-model="recipient" label="Recipient"
                                  :items="users" item-text="name" item-value="id"
                                  :rules="recipientRules"
                                  :append-icon="recipient === -1 ? $icons.transferPot : $icons.account"/>
                    </v-col>
                </v-row>

                <v-row>
                    <v-col>
                        <v-text-field type="number" v-model="amount" :label="sender === -1 ? 'Shares' : 'Amount'"
                                      min="0" :rules="amountRules"
                                      class="no-spinner" :append-icon="currency === 'money' ? $icons.money : $icons.points"/>
                    </v-col>
                    <v-col>
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
            </v-card-text>

            <v-card-actions>
                <v-btn text :disabled="isBusy" @click="cancel()">Cancel</v-btn>
                <v-spacer></v-spacer>
                <v-progress-circular v-if="isBusy" indeterminate size="20" width="2"/>
                <v-btn type="submit" :disabled="isBusy" color="primary">Save</v-btn>
            </v-card-actions>
        </v-form>
    </v-card>
</template>

<script>
    export default {
        name: 'TransferEdit',

        props: {
            event: Object,
        },

        data() {
            return {
                sender:         null,
                recipient:      null,
                amount:         null,
                currency:       'points',
                senderRules:    [
                    v => !!v,
                ],
                recipientRules: [
                    v => !!v && v !== this.sender,
                ],
                amountRules:    [
                    v => v > 0,
                ],
                isBusy:         false,
            };
        },

        created() {
            // noinspection ES6MissingAwait
            this.$store().fetchUsers();
        },

        computed: {
            users() {
                return this.$store().visibleUsers.concat({
                    id:   -1,
                    name: 'Temporary pot',
                });
            },
        },

        methods: {
            reset() {
                Object.assign(this.$data, this.$options.data.apply(this));
            },

            cancel() {
                this.$emit('close');
            },

            async save() {
                if (!this.$refs.form.validate()) {
                    return;
                }
                try {
                    this.isBusy = true;
                    let transfers = [{
                        senderId:    this.sender,
                        recipientId: this.recipient,
                        amount:      this.amount,
                        currency:    this.currency,
                    }];
                    await this.$store().saveTransfers({eventId: this.event.id, transfers});
                    this.$emit('close');
                } catch (err) {
                    // Disabled flag is only released on errors, otherwise we risk double saving after the first
                    // one is successful and the modal is closing.
                    this.isBusy = false;
                    throw err;
                }
            },
        },
    };
</script>
