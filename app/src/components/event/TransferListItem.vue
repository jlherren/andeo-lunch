<template>
    <v-list-item :to="`/events/${this.event.id}`">
        <v-list-item-icon>
            <v-icon>{{ $icons.transfers }}</v-icon>
        </v-list-item-icon>

        <v-list-item-content>
            <v-list-item-title>
                {{ event.name }}
            </v-list-item-title>
            <v-list-item-subtitle>
                <span>{{ formattedDate }}</span>
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

        computed: {
            formattedDate() {
                return DateUtils.displayFormat(this.event.date);
            },
        },
    };
</script>
