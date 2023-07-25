<template>
    <v-main>
        <the-app-bar sub-page :to="`/transfers/${isoDate}`">
            {{ name }}
            <template v-if="event" #buttons>
                <dynamic-button label="Edit" :icon="$icons.edit" disabled/>
                <dynamic-button label="Delete" :icon="$icons.delete" :disabled="isBusy || !event?.canEdit" @click="openDeleteEventDialog"/>
            </template>
        </the-app-bar>

        <shy-progress v-if="isBusy"/>

        <div v-if="event">
            <v-container class="text-center">
                <div class="headline">{{ name }}</div>
                <p class="text--secondary">{{ formattedDate }}</p>
                <p v-if="!event?.canEdit" class="text--secondary">
                    This transfer is too far in the past for you to edit.  Contact an admin if you need changes to be made.
                </p>
            </v-container>
        </div>

        <v-list>
            <v-list-item v-for="transfer of transfers" :key="transfer.id">
                <v-list-item-icon>
                    <v-icon>
                        {{ transfer.icon }}
                    </v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                    <v-list-item-title>
                        {{ transfer.senderName }} &rarr; {{ transfer.recipientName }}
                    </v-list-item-title>
                    <v-list-item-subtitle>
                        <balance :value="transfer.actualAmount"
                                 :points="transfer.currency === 'points'"
                                 :money="transfer.currency === 'money'"
                                 precise small no-sign
                        />
                        <span v-if="transfer.unspent" class="ml-4">
                            <v-icon small color="red">
                                {{ $icons.alert }}
                            </v-icon>
                            Amount is unspent
                        </span>
                        <span v-if="transfer.isShare" class="ml-4">
                            {{ transfer.amount }} share
                        </span>
                    </v-list-item-subtitle>
                </v-list-item-content>
                <v-list-item-action>
                    <v-btn icon @click="openDeleteTransferDialog(transfer.id)" :disabled="!event?.canEdit">
                        <v-icon>{{ $icons.delete }}</v-icon>
                    </v-btn>
                </v-list-item-action>
            </v-list-item>

            <v-list-item v-if="transfers && transfers.length === 0">
                <v-list-item-content>
                    <v-list-item-title>
                        <i>No transfers</i>
                    </v-list-item-title>
                </v-list-item-content>
            </v-list-item>

            <v-skeleton-loader v-if="!transfers" type="list-item-avatar"/>

            <v-list-item v-else @click="openAddTransferDialog" :disabled="isBusy || !event?.canEdit">
                <v-list-item-icon>
                    <v-icon>{{ $icons.plus }}</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                    <v-list-item-title>
                        Add transfer entry
                    </v-list-item-title>
                </v-list-item-content>
            </v-list-item>
        </v-list>

        <v-dialog v-model="deleteEventDialog" max-width="600">
            <v-card>
                <v-card-title>
                    Delete this transfer?
                </v-card-title>
                <v-card-text>
                    The transfer and all its entries will be permanently deleted!
                </v-card-text>
                <v-card-actions>
                    <v-btn text @click="deleteEventDialog = false" :disabled="isBusy">No, keep it</v-btn>
                    <v-spacer/>
                    <v-btn @click="deleteEvent" :disabled="isBusy" color="error">Yes, delete</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="deleteTransferDialog" max-width="600">
            <v-card>
                <v-card-title>
                    Delete transfer entry?
                </v-card-title>
                <v-card-actions>
                    <v-btn text @click="deleteTransferDialog = false" :disabled="isBusy">No, keep it</v-btn>
                    <v-spacer/>
                    <v-btn @click="deleteTransfer(deleteTransferDialogTransferId)" :disabled="isBusy" color="error">Yes, delete</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="addTransferDialog" max-width="600">
            <transfer-edit :event="event" @close="addTransferDialog = false" ref="addDialog"/>
        </v-dialog>
    </v-main>
</template>

<script>
    import * as DateUtils from '@/utils/dateUtils';
    import Balance from '@/components/Balance.vue';
    import DynamicButton from '@/components/DynamicButton.vue';
    import ShyProgress from '@/components/ShyProgress.vue';
    import TheAppBar from '@/components/TheAppBar.vue';
    import TransferEdit from '@/components/event/TransferEdit.vue';
    import Vue from 'vue';

    export default {
        name: 'TransferDetail',

        components: {
            Balance,
            DynamicButton,
            ShyProgress,
            TheAppBar,
            TransferEdit,
        },

        data() {
            return {
                eventId:                        parseInt(this.$route.params.id, 10),
                isBusy:                         false,
                deleteEventDialog:              false,
                deleteTransferDialog:           false,
                deleteTransferDialogTransferId: null,
                addTransferDialog:              false,
            };
        },

        async created() {
            try {
                this.isBusy = true;
                await this.$store().fetchEvent({eventId: this.eventId});
                let event = this.$store().event(this.eventId);
                if (event.type !== 'transfer') {
                    // Oops, you're in the wrong view, redirect.
                    await this.$router.replace(`/events/${this.eventId}`);
                    return;
                }
                await this.$store().fetchTransfers({eventId: this.eventId});
            } finally {
                this.isBusy = false;
            }
        },

        computed: {
            event() {
                return this.$store().event(this.eventId);
            },

            transfers: function () {
                let transfers = this.$store().transfers(this.eventId);
                if (!transfers) {
                    return null;
                }

                let potBalances = {};
                let totalShares = {};
                for (let transfer of transfers) {
                    let currency = transfer.currency;
                    if (transfer.recipientId === -1) {
                        potBalances[currency] = (potBalances[currency] ?? 0.0) + transfer.amount;
                    } else if (transfer.senderId === -1) {
                        totalShares[currency] = (totalShares[currency] ?? 0.0) + transfer.amount;
                    }
                }

                transfers = transfers.map(transfer => {
                    let currency = transfer.currency;
                    let isShare = transfer.senderId === -1;
                    let actualAmount = 0.0;
                    if (!isShare) {
                        actualAmount = transfer.amount;
                    } else if (totalShares[currency]) {
                        actualAmount = (potBalances[currency] ?? 0.0) / totalShares[currency] * transfer.amount;
                    }
                    return {
                        ...transfer,
                        senderName:    this.getDisplayName(transfer.senderId),
                        recipientName: this.getDisplayName(transfer.recipientId),
                        icon:          currency === 'points' ? this.$icons.points : this.$icons.money,
                        isShare,
                        actualAmount,
                        unspent:       transfer.recipientId === -1 && !totalShares[currency],
                        ordering:      this.getOrdering(transfer),
                    };
                });
                transfers.sort((a, b) => a.ordering - b.ordering);
                return transfers;
            },

            name() {
                return this.event?.name || 'Loading...';
            },

            formattedDate() {
                return this.event?.date ? DateUtils.displayFormat(this.event.date) : null;
            },

            isoDate() {
                return this.event?.date ? DateUtils.isoDate(this.event.date) : null;
            },
        },

        methods: {
            getDisplayName(userId) {
                if (userId === -1) {
                    return 'Temporary pot';
                }
                return this.$store().user(userId)?.name;
            },

            getOrdering(transfer) {
                if (transfer.recipientId === -1) {
                    return 1;
                }
                if (transfer.sender === -1) {
                    return 2;
                }
                return 3;
            },

            openDeleteEventDialog() {
                this.deleteEventDialog = true;
            },

            async deleteEvent() {
                try {
                    this.isBusy = true;
                    await this.$store().deleteEvent({eventId: this.eventId});
                    this.deleteEventDialog = false;
                    this.$router.go(-1);
                } catch (err) {
                    this.isBusy = false;
                    throw err;
                }
            },

            openDeleteTransferDialog(transferId) {
                this.deleteTransferDialogTransferId = transferId;
                this.deleteTransferDialog = true;
            },

            async deleteTransfer(transferId) {
                try {
                    this.isBusy = true;
                    await this.$store().deleteTransfer({eventId: this.event.id, transferId});
                    this.deleteTransferDialog = false;
                } finally {
                    this.isBusy = false;
                }
            },

            openAddTransferDialog() {
                this.addTransferDialog = true;
                Vue.nextTick(() => this.$refs.addDialog.reset());
            },
        },
    };
</script>
