<template>
    <v-dialog v-model="open" width="290px">
        <template #activator="{ on, attrs }">
            <v-text-field v-bind="attrs" v-on="on" :append-icon="$icons.calendar"
                          :label="label" :rules="rules" :value="formatted" readonly :disabled="disabled"
            />
        </template>
        <v-date-picker :value="value" @input="update" first-day-of-week="1"/>
    </v-dialog>
</template>

<script>
    import * as DateUtils from '@/utils/dateUtils';

    export default {
        name: 'AlDatePicker',

        props: {
            value:    String,
            label:    {
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
                if (this.value === undefined || this.value === null) {
                    return null;
                }
                return DateUtils.displayFormat(new Date(this.value));
            },
        },

        methods: {
            update(value) {
                this.open = false;
                this.$emit('input', value);
            },
        },
    };
</script>
