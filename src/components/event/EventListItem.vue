<template>
    <v-list-item :to="link">
        <template v-if="prominent">
            <v-list-item-content class="center-text">
                <v-list-item-title class="headline">{{ event.name }}</v-list-item-title>
                <v-list-item-subtitle>{{ formattedDate }}</v-list-item-subtitle>

                <v-list-item-content>
                    <participation-summary class="justify-center" :participations="participations"/>
                </v-list-item-content>
            </v-list-item-content>

            <v-list-item-action v-if="undecidedParticipation">
                <v-icon>{{ $icons.alertCircle }}</v-icon>
            </v-list-item-action>
        </template>

        <template v-else>
            <v-list-item-icon>
                <v-icon>{{ icon }}</v-icon>
            </v-list-item-icon>

            <v-list-item-content>
                <v-list-item-title>
                    {{ event.name }}
                </v-list-item-title>
                <v-list-item-subtitle>
                    <span>{{ formattedDate }}</span>
                </v-list-item-subtitle>
            </v-list-item-content>

            <v-list-item-action v-if="undecidedParticipation">
                <v-icon title="You have not decided yet!">{{ $icons.alertCircle }}</v-icon>
            </v-list-item-action>
        </template>
    </v-list-item>
</template>

<script>
    import * as DateUtils from '@/utils/dateUtils';
    import ParticipationSummary from '@/components/event/ParticipationSummary';

    export default {
        name: 'eventListItem',

        components: {
            ParticipationSummary,
        },

        props: {
            event:     {
                type:     Object,
                required: true,
            },
            prominent: Boolean,
        },

        data() {
            return {
                ownUserId: this.$store.getters.ownUserId,
            };
        },

        created() {
            this.reload();
        },

        watch: {
            prominent() {
                this.reload();
            },
        },

        computed: {
            undecidedParticipation() {
                if (this.event.type === 'label') {
                    return false;
                }
                let ownParticipation = this.$store.getters.participation(this.event.id, this.ownUserId);
                return !ownParticipation || ownParticipation.type === 'undecided';
            },

            icon() {
                switch (this.event.type) {
                    case 'lunch':
                        return this.$icons.lunch;
                    case 'event':
                        return this.$icons.event;
                    case 'label':
                        return this.$icons.label;
                    default:
                        return this.$icons.missingIcon;
                }
            },

            formattedDate() {
                return DateUtils.displayFormat(this.event.date);
            },

            link() {
                return `/events/${this.event.id}`;
            },

            participations() {
                return this.$store.getters.participations(this.event.id) ?? [];
            },
        },

        methods: {
            reload() {
                if (this.prominent) {
                    this.$store.dispatch('fetchParticipations', {eventId: this.event.id});
                }
            },
        },
    };
</script>

<style scoped lang="scss">
    span + span {
        margin-left: 1em;
    }
</style>
