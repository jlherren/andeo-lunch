<template>
    <v-btn-toggle :value="value" @change="update($event)" :dense="$vuetify.breakpoint.xs" mandatory class="full-width">
        <v-btn value="omnivorous" :disabled="disabled">
            <v-icon :large="$vuetify.breakpoint.mdAndUp" left>{{ $icons.omnivorous }}</v-icon>
            <span class="hidden-xs-only">Omni</span>
        </v-btn>
        <v-btn value="vegetarian" :disabled="disabled">
            <v-icon :large="$vuetify.breakpoint.mdAndUp" left>{{ $icons.vegetarian }}</v-icon>
            <span class="hidden-xs-only">Vegi</span>
        </v-btn>
        <v-btn value="opt-out" :disabled="disabled">
            <v-icon :large="$vuetify.breakpoint.mdAndUp" left>{{ $icons.optOut }}</v-icon>
            <span class="hidden-xs-only">Out</span>
        </v-btn>
        <v-btn value="undecided" :disabled="disabled">
            <v-icon :large="$vuetify.breakpoint.mdAndUp" left>{{ $icons.undecided }}</v-icon>
            <span class="hidden-xs-only">Undecided</span>
        </v-btn>
    </v-btn-toggle>
</template>

<script>
    export default {
        name: 'ParticipationTypeWidget',

        props: {
            value:    {
                type:     String,
                required: true,
            },
            disabled: {
                type:    Boolean,
                default: false,
            },
        },

        methods: {
            update(value) {
                this.$emit('input', value);
            },
        },
    };
</script>
