<template>
    <v-main>
        <the-app-bar sub-page>
            Log an expense

            <template v-slot:buttons>
                <v-btn color="primary" @click="save()" :disabled="isBusy">Save</v-btn>
            </template>
        </the-app-bar>

        <shy-progress v-if="isBusy"/>

        <v-container>
            <p class="text-body-1 mt-4">
                Reimburse an expense paid for someone else.
            </p>

            <v-form ref="form" :disabled="isBusy" @submit.prevent="save()">
                <v-select v-model="sender" label="At the expense of"
                          :items="users" item-text="name" item-value="id"
                          :rules="senderRules"
                          :prepend-icon="$icons.account"/>

                <v-text-field type="number" v-model="amount" label="Amount in CHF"
                              min="0" :rules="amountRules"
                              class="no-spinner" :prepend-icon="$icons.money"/>

                <v-text-field v-model="reason" label="Reason"
                              :rules="reasonRules"
                              :prepend-icon="$icons.label"/>

                <v-checkbox label="This expense is related to an event" disabled>
                    <template v-slot:label>
                        Expense is related to an event
                        <v-icon small>{{ $icons.alert }}</v-icon>
                        Not implemented
                    </template>
                </v-checkbox>

                <v-select label="Related event" disabled
                          :prepend-icon="$icons.lunch"
                />

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
                isBusy:      false,
                sender:      null,
                amount:      null,
                reason:      '',
                senderRules: [
                    v => !!v && v !== this.$store.getters.ownUserId,
                ],
                amountRules: [
                    v => v > 0,
                ],
                reasonRules: [
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

<style lang="scss" scoped>
    .v-icon {
        margin: 0 0.33em;
    }
</style>
