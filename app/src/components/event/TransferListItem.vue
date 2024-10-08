<template>
    <v-list-item :to="`/transfers/${this.event.id}`">
        <v-list-item-icon>
            <v-icon :color="iconColor">{{ $icons.transfers }}</v-icon>
        </v-list-item-icon>

        <v-list-item-content>
            <v-list-item-title>
                {{ event.name }}
                <small class="text--secondary">{{ involvedUsers }}</small>
            </v-list-item-title>
            <v-list-item-subtitle>
                {{ formattedDate }}
            </v-list-item-subtitle>
        </v-list-item-content>

        <v-list-item-action>
            <v-icon>{{ $icons.chevronRight }}</v-icon>
        </v-list-item-action>
    </v-list-item>
</template>

<script>
    import * as DateUtils from '@/utils/dateUtils';

    export default {
        name: 'TransferListItem',

        props: {
            event: {
                type:     Object,
                required: true,
            },
        },

        created() {
            this.$store().fetchTransfers(this.event.id);
        },

        computed: {
            formattedDate() {
                return DateUtils.displayFormat(this.event.date);
            },

            involvedUsers() {
                let transfers = this.$store().transfers(this.event.id) ?? [];
                let userIds = new Set();
                for (let transfer of transfers) {
                    userIds.add(transfer.senderId);
                    userIds.add(transfer.recipientId);
                }
                userIds.delete(-1);
                return Array.from(userIds)
                    .map(userId => this.$store().user(userId)?.name ?? 'Unknown')
                    .join(', ');
            },

            selfInvolved() {
                let transfers = this.$store().transfers(this.event.id) ?? [];
                let ownUser = this.$store().ownUserId;
                return transfers.some(transfer => transfer.senderId === ownUser || transfer.recipientId === ownUser);
            },

            iconColor() {
                return this.selfInvolved ? 'primary' : 'secondary';
            },
        },
    };
</script>
