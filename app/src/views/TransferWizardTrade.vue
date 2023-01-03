<template>
    <v-main>
        <the-app-bar sub-page>
            Trade points

            <template #buttons>
                <v-btn color="primary" @click="save" :disabled="isBusy">Save</v-btn>
            </template>
        </the-app-bar>

        <shy-progress v-if="isBusy"/>

        <v-container>
            <p class="text-body-1 mt-4">
                Buy points from, or sell points to another user for money.
            </p>

            <v-form ref="form" :disabled="isBusy" @submit.prevent="save()">
                <v-select v-model="buyer" label="Buyer"
                          :items="visibleUsers" item-text="name" item-value="id"
                          :rules="buyerRules"
                          :append-icon="$icons.account"/>
                <v-select v-model="seller" label="Seller"
                          :items="visibleUsers" item-text="name" item-value="id"
                          :rules="sellerRules"
                          :append-icon="$icons.account"/>

                <v-text-field type="number" v-model="points" label="Points"
                              min="0" :rules="positiveRules"
                              class="no-spinner" :append-icon="$icons.points"/>

                <v-text-field type="number" v-model="money" label="Total money"
                              min="0" :rules="positiveRules"
                              class="no-spinner" :append-icon="$icons.money"/>

                <v-text-field type="number" :value="price" label="Price per point"
                              disabled class="no-spinner" :append-icon="$icons.money"/>

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
        name: 'TransferWizardTrade',

        components: {
            ShyProgress,
            TheAppBar,
        },

        data() {
            return {
                isBusy:        false,
                buyer:         null,
                seller:        null,
                points:        null,
                money:         null,
                buyerRules:    [
                    value => !!value || 'A buyer is required',
                ],
                sellerRules:   [
                    value => !!value || 'A seller is required',
                    value => value !== this.buyer || 'Seller must be different from buyer',
                ],
                positiveRules: [
                    value => value > 0 || 'A positive amount is required',
                ],
            };
        },

        created() {
            this.$store().fetchUsers();
        },

        computed: {
            ...mapState(useStore, [
                'visibleUsers',
            ]),

            price() {
                return this.points > 0 && this.money > 0 ? this.money / this.points : null;
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
                        name: 'Trade',
                        date: new Date(),
                        type: 'transfer',
                    });

                    let transfers = [{
                        senderId:    this.buyer,
                        recipientId: this.seller,
                        amount:      this.money,
                        currency:    'money',
                    }, {
                        senderId:    this.seller,
                        recipientId: this.buyer,
                        amount:      this.points,
                        currency:    'points',
                    }];
                    await this.$store().saveTransfers({eventId, transfers});

                    await this.$router.replace(`/transfers/${eventId}`);
                } catch (err) {
                    this.isBusy = false;
                    throw err;
                }
            },
        },
    };
</script>
