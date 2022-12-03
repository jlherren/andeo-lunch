<template>
    <v-main>
        <the-app-bar sub-page>
            Custom transfer

            <template #buttons>
                <v-btn color="primary" @click="save" :disabled="isBusy">Save</v-btn>
            </template>
        </the-app-bar>

        <shy-progress v-if="isBusy"/>

        <v-container>
            <p class="text-body-1 mt-4">
                Create an empty transfer event in order to specify transfers manually.
            </p>

            <v-form ref="form" :disabled="isBusy" @submit.prevent="save()">
                <v-text-field v-model="name" label="Description"
                              :rules="nameRules"
                              :append-icon="$icons.label"/>

                <al-date-picker v-model="date" required/>
                <al-time-picker v-model="time" required/>

                <!-- Button is to make it submittable by pressing enter -->
                <v-btn type="submit" :disabled="isBusy" v-show="false">Save</v-btn>
            </v-form>
        </v-container>
    </v-main>
</template>

<script>
    import * as DateFormatter from '@/utils/dateUtils';
    import AlDatePicker from '@/components/AlDatePicker';
    import AlTimePicker from '@/components/AlTimePicker';
    import ShyProgress from '@/components/ShyProgress';
    import TheAppBar from '@/components/TheAppBar';

    export default {
        name: 'TransferWizardCustom',

        components: {
            AlDatePicker,
            AlTimePicker,
            ShyProgress,
            TheAppBar,
        },

        data() {
            let now = new Date();
            return {
                isBusy:    false,
                name:      '',
                date:      DateFormatter.isoDate(now),
                time:      DateFormatter.isoTime(now, false),
                nameRules: [
                    v => v !== '',
                ],
            };
        },

        methods: {
            async save() {
                if (!this.$refs.form.validate()) {
                    return;
                }
                try {
                    this.isBusy = true;

                    let eventId = await this.$store().saveEvent({
                        name: this.name,
                        date: new Date(`${this.date}T${this.time}:00`),
                        type: 'transfer',
                    });

                    await this.$router.replace(`/transfers/${eventId}`);
                } catch (err) {
                    this.isBusy = false;
                    throw err;
                }
            },
        },
    };
</script>
