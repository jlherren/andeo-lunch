<template>
    <v-list-item :to="link">
        <v-list-item-icon>
            <v-icon>{{ icon }}</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
            <v-list-item-title>{{ event.name }}</v-list-item-title>
            <v-list-item-subtitle>
                <span>{{ formattedDate }}</span>
            </v-list-item-subtitle>
        </v-list-item-content>

        <v-list-item-action>
            <v-list-item-action-text>
                <balance :value="event.costs.points" small points/>
            </v-list-item-action-text>
        </v-list-item-action>
    </v-list-item>
</template>

<script>
    import Balance from '@/components/balance';
    import * as DateUtils from '@/utils/dateUtils';

    export default {
        name: 'eventListItem',

        components: {
            Balance,
        },

        props: {
            event: Object,
        },

        computed: {
            icon() {
                switch (this.event.type) {
                    case 'lunch':
                        return 'mdi-food-variant';
                    case 'event':
                        return 'mdi-party-popper';
                    case 'label':
                        return 'mdi-label';
                    default:
                        return 'mdi-help-circle';
                }
            },

            formattedDate() {
                return DateUtils.format(this.event.date);
            },

            link() {
                return `/events/${this.event.id}`;
            },
        },
    };
</script>

<style scoped lang="scss">
    span + span {
        margin-left: 1em;
    }
</style>
