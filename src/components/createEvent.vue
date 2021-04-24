<template>
    <v-card>
        <v-form v-model="valid" :disabled="saving" @submit.prevent="save()" ref="form">
            <v-card-title v-if="type === 'lunch'">
                New lunch
            </v-card-title>
            <v-card-title v-else-if="type === 'label'">
                New label
            </v-card-title>
            <v-card-title v-else>
                New event
            </v-card-title>

            <v-card-text>
                <v-text-field label="Name" :items="names" v-model="name" :rules="nameRules" autofocus required/>
                <lm-date-picker v-model="date" required/>
            </v-card-text>

            <v-card-actions>
                <v-btn text @click="cancel()">Cancel</v-btn>
                <v-spacer></v-spacer>
                <v-btn text color="primary" type="submit">Save</v-btn>
            </v-card-actions>
        </v-form>
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
                time: null,
                type: null,

                nameRules: [
                    v => !!v || 'A name is required',
                ],

                saving: false,
                valid: false,
            };
        },

        methods: {
            cancel() {
                this.$emit('close');
            },

            /**
             * @param {string} type
             * @param {Date|null} date
             */
            initialize(type, date) {
                this.name = null;
                this.date = date ? date.toISOString().substr(0, 10) : null;
                this.type = type;
                this.$refs.form.resetValidation();
            },

            async save() {
                this.$refs.form.validate();
                if (!this.valid) {
                    return;
                }
                try {
                    this.saving = true;
                    await this.$store.dispatch('saveEvent', {
                        data: {
                            name: this.name,
                            date: this.date,
                            type: this.type,
                            costs: {
                                points: 0,
                                money: 0,
                            },
                            factors: {
                                vegetarian: {
                                    money: 1,
                                },
                            },
                        },
                    });
                    this.$emit('close');
                } finally {
                    this.saving = false;
                }
            },
        },
    };
</script>
