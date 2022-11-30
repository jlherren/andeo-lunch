<template>
    <v-btn :disabled="disabled" @click="toggle()">
        <v-icon :left="!$vuetify.breakpoint.xs">{{ current.icon }}</v-icon>
        <span class="hidden-xs-only">{{ current.name }}</span>
    </v-btn>
</template>

<script>
    import {LUNCH_EVENT_PARTICIPATION_TYPES, SPECIAL_EVENT_PARTICIPATION_TYPES} from '@/utils/participationUtils';

    export default {
        name: 'ParticipationTypeMiniWidget',

        props: {
            value:     {
                type:     String,
                required: true,
            },
            eventType: {
                type:     String,
                required: true,
            },
            disabled:  Boolean,
            label:     Boolean,
        },

        data() {
            return {
                types: this.eventType === 'special'
                    ? SPECIAL_EVENT_PARTICIPATION_TYPES
                    : LUNCH_EVENT_PARTICIPATION_TYPES,
            };
        },

        computed: {
            current() {
                return this.types.find(type => type.id === this.value);
            },
        },

        methods: {
            toggle() {
                let index = this.types.findIndex(type => type.id === this.value);
                // Note how this conveniently also works for i === -1
                index = (index + 1) % this.types.length;
                this.$emit('input', this.types[index].id);
            },
        },
    };
</script>
