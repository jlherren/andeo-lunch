<template>
    <v-dialog v-model="open" width="290px">
        <template v-slot:activator="{ on, attrs }">
            <v-text-field :label="label" :value="formatted" readonly
                          append-icon="mdi-calendar"
                          v-bind="attrs" v-on="on" :rules="rules"
            />
        </template>
        <v-date-picker :value="value" @input="update($event)" first-day-of-week="1"/>
    </v-dialog>
</template>

<script>
    import * as DateUtils from '@/utils/dateUtils';

    export default {
        name: 'LmDatePicker',

        props: {
            value: String,
            label: {
                type: String,
                default: 'Date',
            },
            required: {
                type: Boolean,
                default: false,
            },
        },

        data() {
            return {
                open: false,
                rules: [
                    v => this.required && !!v || 'A date is required',
                ],
            };
        },

        computed: {
            formatted() {
                if (this.value === undefined || this.value === null) {
                    return null;
                }
                return DateUtils.format(new Date(this.value));
            },


        },

        methods: {
            update(value) {
                this.open = false;
                this.$emit('input', value);
            }
        }
    };
</script>
