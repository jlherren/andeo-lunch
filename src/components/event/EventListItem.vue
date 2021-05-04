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

            <v-list-item-action v-if="ownParticipationIcon">
                <v-icon>{{ ownParticipationIcon }}</v-icon>
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

            <v-list-item-action v-if="ownParticipationIcon">
                <v-icon>{{ ownParticipationIcon }}</v-icon>
            </v-list-item-action>
        </template>
    </v-list-item>
</template>

<script>
    import * as DateUtils from '@/utils/dateUtils';
    import * as ParticipationUtils from '@/utils/participationUtils';
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

    .v-list-item__action > .v-icon {
        // Align equally with the plus buttons
        margin-right: 6px;
    }
</style>
