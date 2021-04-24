<template>
    <v-card>
        <v-card-title>
            New event
        </v-card-title>

        <v-card-text>
            <v-form>
                <v-autocomplete label="Name" :items="names" v-model="name"/>
                <v-row>
                    <v-col>
                        <lm-date-picker v-model="date" label="Date"/>
                    </v-col>
                    <v-col>
                        <v-select label="Type" :items="types" v-model="type"></v-select>
                    </v-col>
                </v-row>
            </v-form>
        </v-card-text>

        <v-card-actions>
            <v-btn text @click="cancel()">Cancel</v-btn>
            <v-spacer></v-spacer>
            <v-btn text color="primary">Save</v-btn>
        </v-card-actions>
    </v-card>
</template>

<script>
    import LmAppBar from '@/components/lmAppBar';
    import LmDatePicker from '@/components/lmDatePicker';

    export default {
        name: 'CreateEvent',

        components: {
            LmDatePicker,
            LmAppBar,
        },

        data() {
            return {
                name: null,
                names: [
                    'Pizza',
                ],
                types: [
                    {value: 'lunch', text: 'Lunch'},
                    {value: 'event', text: 'Other event'},
                ],
                date: new Date().toISOString().substr(0, 10),
                type: null,
            };
        },

        methods: {
            cancel() {
                this.$emit('cancel');
            },

            initialize(date, type) {
                this.name = '';
                this.date = date ? date.toISOString().substr(0, 10) : null;
                this.type = type;
            },
        },
    };
</script>
