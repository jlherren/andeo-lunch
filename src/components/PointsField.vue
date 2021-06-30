<template>
    <v-text-field type="number" min="0" step="0.5" label="Points credited" :value="value" @input="input($event)" class="no-spinner" :disabled="disabled">
        <template v-slot:append>
            <v-btn small icon @click="addPoints(-1)" :disabled="value <= 0">
                <v-icon small>{{ $icons.minus }}</v-icon>
            </v-btn>
            <v-btn small icon @click="addPoints(1)">
                <v-icon small>{{ $icons.plus }}</v-icon>
            </v-btn>
        </template>
    </v-text-field>
</template>

<script>
    export default {
        name: 'PointsField',

        props: {
            value: {
                type:     Number,
                required: false,
            },

            disabled: {
                type:    Boolean,
                default: false,
            },
        },

        methods: {
            validate(value) {
                return parseFloat(`${value}`) || 0;
            },

            addPoints(increment) {
                let value = this.validate(this.value);
                value += increment;
                if (value < 0) {
                    value = 0;
                }
                this.$emit('input', value);
            },

            input(value) {
                this.$emit('input', this.validate(value));
            },
        },
    };
</script>
