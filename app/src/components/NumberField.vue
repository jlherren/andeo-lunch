<template>
    <v-text-field
        type="number"
        :min="min"
        :max="max"
        :step="step"
        :label="label"
        :value="modelValue"
        @input="input"
        @blur="$emit('blur', $event)"
        @change="$emit('change', $event)"
        class="no-spinner"
        :disabled="isDisabled"
        :readonly="readonly"
        :suffix="suffix"
        :hint="hint"
        :persistent-hint="hint !== null"
    >
        <template #append>
            <v-btn small icon @click="addPoints(-step)" :disabled="min !== undefined && modelValue <= min" v-if="!isDisabled && !readonly">
                <v-icon small>{{ icons.minus }}</v-icon>
            </v-btn>
            <v-btn small icon @click="addPoints(step)" :disabled="max !== undefined && modelValue >= max" v-if="!isDisabled && !readonly">
                <v-icon small>{{ icons.plus }}</v-icon>
            </v-btn>
            <v-icon>{{ icon }}</v-icon>
        </template>
    </v-text-field>
</template>

<script>
    import {icons} from '@/plugins/icons';

    export default {
        setup() {
            return {icons};
        },

        name: 'NumberField',

        model: {
            prop:  'modelValue',
            event: 'update:modelValue',
        },

        emits: [
            'blur',
            'change',
            'update:modelValue',
        ],

        inject: [
            'form',
        ],

        props: {
            modelValue: Number,
            disabled:   Boolean,
            readonly:   Boolean,
            min:        {
                type:    Number,
                default: 0,
            },
            max:      {
                type:    Number,
                default: undefined,
            },
            step:     {
                type:    Number,
                default: 1,
            },
            label:    String,
            suffix:   String,
            icon:     String,
            hint:     String,
        },

        computed: {
            isDisabled() {
                return this.disabled || this.form?.disabled;
            },
        },

        methods: {
            validate(value) {
                return parseFloat(`${value}`) || 0;
            },

            addPoints(increment) {
                let value = this.validate(this.modelValue);
                value += increment;
                if (value < this.min) {
                    value = this.min;
                } else if (value > this.max) {
                    value = this.max;
                }
                this.$emit('update:modelValue', value);
            },

            input(value) {
                this.$emit('update:modelValue', this.validate(value));
            },
        },
    };
</script>
