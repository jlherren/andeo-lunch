<template>
    <v-list-item :to="link" :class="{past: isPast}" two-line>
        <v-list-item-icon>
            <v-icon>{{ icon }}</v-icon>
        </v-list-item-icon>

        <v-list-item-content>
            <v-list-item-title>
                {{ event.name }}
            </v-list-item-title>
            <v-list-item-subtitle>
                <span>{{ formattedDate }}</span>
                <participation-summary v-if="event.type !== 'label' && participations" :event="event" :participations="participations"/>
            </v-list-item-subtitle>
        </v-list-item-content>

        <v-list-item-icon v-if="showPointCreditIcon">
            <v-icon>{{ $icons.points }}</v-icon>
        </v-list-item-icon>
        <v-list-item-icon v-if="ownParticipationIcon">
            <v-icon :color="ownParticipationIconColor">{{ ownParticipationIcon }}</v-icon>
        </v-list-item-icon>
    </v-list-item>
</template>

<script>
    import * as DateUtils from '@/utils/dateUtils';
    import * as ParticipationUtils from '@/utils/participationUtils';
    import ParticipationSummary from '@/components/event/ParticipationSummary';

    export default {
        name: 'LunchListItem',

        components: {
            ParticipationSummary,
        },

        props: {
            event: {
                type:     Object,
                required: true,
            },
        },

        data() {
            return {
                ownUserId: this.$store.getters.ownUserId,
            };
        },

        created() {
            this.reload();
        },

        computed: {
            ownParticipation() {
                return this.$store.getters.participation(this.event.id, this.ownUserId);
            },

            ownParticipationType() {
                if (!this.ownParticipation) {
                    return this.event.type === 'special' ? 'opt-out' : 'undecided';
                }
                return this.ownParticipation.type;
            },

            ownParticipationIcon() {
                if (this.event.type === 'label') {
                    return null;
                }
                return ParticipationUtils.icon(this.ownParticipationType);
            },

            ownParticipationIconColor() {
                return this.ownParticipationType === 'undecided' ? 'red' : null;
            },

            showPointCreditIcon() {
                return this.ownParticipation?.credits?.points > 0;
                // Note: We do not show any money credit icon, since this will annoy the person that usually
                // does the weekly groceries.
            },

            icon() {
                switch (this.event.type) {
                    case 'lunch':
                        return this.$icons.lunch;
                    case 'special':
                        return this.$icons.special;
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
                return this.$store.getters.participations(this.event.id);
            },

            isPast() {
                return this.event.date.getTime() < Date.now();
            },
        },

        methods: {
            async reload() {
                await this.$store.dispatch('fetchParticipations', {eventId: this.event.id});
            },
        },
    };
</script>

<style lang="scss" scoped>
    span + span {
        margin-left: 0.5em;
    }

    .v-list-item__icon:last-child > .v-icon {
        // Align equally with the plus buttons
        margin-right: 6px;
    }

    .v-list-item__icon:not(:first-child) {
        // It seems that multiple icons isn't really a supported use-case, they lack the margin.
        margin-left: 16px;
    }

    .past {
        opacity: 0.5;
    }
</style>
