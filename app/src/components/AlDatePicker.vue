<template>
    <v-dialog v-model="open" width="290px">
        <template #activator="{ on, attrs }">
            <v-text-field v-bind="attrs" v-on="on" :append-icon="$icons.calendar"
                          :label="label" :rules="rules" :value="formatted" readonly :disabled="disabled"
            />
        </template>
        <v-date-picker :value="modelValue" @input="update" first-day-of-week="1"/>
    </v-dialog>
</template>

<script>
    import * as DateUtils from '@/utils/dateUtils';

    export default {
        name: 'AlDatePicker',

        model: {
            prop:  'modelValue',
            event: 'update:modelValue',
        },

        props: {
            modelValue: String,
            label:      {
                type:    String,
                default: 'Date',
            },
            required: {
                type:    Boolean,
                default: false,
            },
            disabled: {
                type:    Boolean,
                default: false,
            },
        },

        data() {
            return {
                open:  false,
                rules: [
                    value => !this.required || !!value || 'A date is required',
                ],
            };
        },

        computed: {
            formatted() {
                if (this.modelValue === undefined || this.modelValue === null) {
                    return null;
                }
                return DateUtils.displayFormat(new Date(this.modelValue));
            },
        },

        methods: {
            update(value) {
                this.open = false;
                this.$emit('update:modelValue', value);
            },
        },
    };
</script>
