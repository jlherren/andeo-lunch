<template>
    <v-list-item :to="link" :class="{past: isPast}">
        <v-list-item-icon>
            <v-icon>{{ icon }}</v-icon>
        </v-list-item-icon>

        <v-list-item-content>
            <v-list-item-title>
                {{ event.name }}
            </v-list-item-title>
            <v-list-item-subtitle>
                <span>{{ formattedDate }}</span>
                <participation-summary :participations="participations"/>
            </v-list-item-subtitle>
        </v-list-item-content>

        <v-list-item-action v-if="ownParticipationIcon">
            <v-icon :color="ownParticipationIconColor">{{ ownParticipationIcon }}</v-icon>
        </v-list-item-action>
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
            event:     {
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
            ownParticipationType() {
                let ownParticipation = this.$store.getters.participation(this.event.id, this.ownUserId);
                if (!ownParticipation) {
                    return 'undecided';
                }
                return ownParticipation.type;
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

    .v-list-item__action > .v-icon {
        // Align equally with the plus buttons
        margin-right: 6px;
    }

    .past {
        opacity: 0.5;
    }
</style>
