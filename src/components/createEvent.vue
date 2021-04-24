<template>
    <v-card>
        <v-card-title>
            New event
        </v-card-title>

        <v-card-text>
            <v-form>
                <v-autocomplete label="Name" :items="names"/>
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
            <v-btn text >Cancel</v-btn>
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
                names: [
                    'Pizza',
                ],
                types: [
                    'Meal',
                    'Other event',
                ],
                date: new Date().toISOString().substr(0, 10),
                type: 'Meal',
            };
        },
    };
</script>
