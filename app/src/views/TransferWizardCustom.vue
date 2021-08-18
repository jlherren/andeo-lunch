<template>
    <v-main>
        <the-app-bar sub-page>
            Custom transfer

            <template v-slot:buttons>
                <v-btn color="primary" @click="save()" :disabled="isBusy">Save</v-btn>
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

                <lm-date-picker v-model="date" required/>

                <!-- Button is to make it submittable by pressing enter -->
                <v-btn type="submit" :disabled="isBusy" v-show="false">Save</v-btn>
            </v-form>
        </v-container>
    </v-main>
</template>

<script>
    import LmDatePicker from '@/components/LmDatePicker';
    import ShyProgress from '@/components/ShyProgress';
    import TheAppBar from '@/components/TheAppBar';

    export default {
        name: 'TransferWizardCustom',

        components: {
            LmDatePicker,
            ShyProgress,
            TheAppBar,
        },

        data() {
            return {
                isBusy:    false,
                name:      '',
                date:      null,
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

                    let eventId = await this.$store.dispatch('saveEvent', {
                        name: this.name,
                        date: this.date,
                        type: 'transfer',
                    });

                    await this.$router.push(`/events/${eventId}`);
                } catch (err) {
                    this.isBusy = false;
                    throw err;
                }
            },
        },
    };
</script>
