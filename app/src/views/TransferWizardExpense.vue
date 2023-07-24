<template>
    <v-main>
        <the-app-bar sub-page>
            Log an expense

            <template #buttons>
                <v-btn color="primary" @click="save" :disabled="isBusy">Save</v-btn>
            </template>
        </the-app-bar>

        <shy-progress v-if="isBusy"/>

        <v-container>
            <p class="text-body-1 mt-4">
                Reimburse an expense paid for someone else.
            </p>

            <v-form ref="form" :disabled="isBusy" @submit.prevent="save()">
                <v-select v-model="sender" label="At the expense of"
                          :items="visibleUsers" item-text="name" item-value="id"
                          :rules="senderRules"
                          :append-icon="$icons.account"/>

                <v-text-field type="number" v-model="amount" label="Amount in CHF"
                              min="0" :rules="amountRules"
                              class="no-spinner" :append-icon="$icons.money"/>

                <v-text-field v-model="reason" label="Reason"
                              :rules="reasonRules"
                              :append-icon="$icons.label"/>

                <v-checkbox label="This expense is related to an event" disabled>
                    <template #label>
                        Expense is related to an event
                        <v-icon small>{{ $icons.alert }}</v-icon>
                        Not implemented
                    </template>
                </v-checkbox>

                <v-select label="Related event" disabled
                          :append-icon="$icons.lunch"
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
                isBusy:      true,
                sender:      null,
                amount:      null,
                reason:      '',
                senderRules: [
                    value => !!value || 'A sender is required',
                    value => value !== this.$store().ownUserId || 'You cannot log an expense for yourself',
                ],
                amountRules: [
                    value => value > 0 || 'A positive amount is required',
                ],
                reasonRules: [
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
    };
</script>

<style lang="scss" scoped>
    .v-icon {
        margin: 0 0.33em;
    }
</style>
