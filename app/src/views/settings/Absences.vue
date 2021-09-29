<template>
    <v-main>
        <the-app-bar sub-page>
            Absences

            <template v-slot:buttons>
                <dynamic-button icon="$icons.plus" label="Add" @click="addModal = true" :disabled="isBusy"/>
            </template>
        </the-app-bar>

        <shy-progress v-if="!absences"/>

        <v-container>
            <p class="text-body-1">
                During absence periods, your weekday-based defaults will be ignored and
                you will be set to opt-out automatically for any newly created event.
                However, it will never affect already existing events.
            </p>

            <p class="text-body-1">
                Absences cannot be created here yet, please contact an admin for creating absences.
            </p>

            <v-banner elevation="2" single-line :icon="$icons.information" v-if="absences && absences.length === 0">
                You have no absences
            </v-banner>
        </v-container>

        <v-list v-if="absences != null && absences.length">
            <v-list-item v-for="absence of absences" :key="absence.id">
                <v-list-item-icon>
                    <v-icon>{{ $icons.absence }}</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                    <v-list-item-title>
                        {{ absence.start }}
                        &ndash; {{ absence.end }}
                    </v-list-item-title>
                </v-list-item-content>
                <v-list-item-action>
                    <v-btn icon @click="openConfirmDelete(absence.id)" :disabled="isBusy">
                        <v-icon>
                            {{ $icons.delete }}
                        </v-icon>
                    </v-btn>
                </v-list-item-action>
            </v-list-item>
        </v-list>

        <v-dialog v-model="addModal">
            <v-card>
                <v-form :disabled="isBusy" ref="addForm">
                    <v-card-title>
                        Add absence
                    </v-card-title>

                    <v-card-text>
                        <al-date-picker v-model="start" required label="From"/>
                        <al-date-picker v-model="end" required label="To"/>

                        <!-- Button is to make it submittable by pressing enter -->
                        <v-btn type="submit" :disabled="isBusy" v-show="false">Save</v-btn>
                    </v-card-text>

                    <v-card-actions>
                        <v-btn text :disabled="isBusy" @click="addModal = false">
                            Cancel
                        </v-btn>
                        <v-spacer></v-spacer>
                        <v-progress-circular v-if="isBusy" indeterminate size="20" width="2"/>
                        <v-btn color="primary" :disabled="isBusy" @click="save">
                            Save
                        </v-btn>
                    </v-card-actions>
                </v-form>
            </v-card>
        </v-dialog>

        <v-dialog v-model="confirmDelete">
            <v-card>
                <v-card-title>
                    Confirm
                </v-card-title>
                <v-card-text>
                    Really delete this absence?
                </v-card-text>
                <v-card-actions>
                    <v-btn text @click="confirmDelete = false" :disabled="isBusy">Cancel</v-btn>
                    <v-spacer/>
                    <v-btn @click="deleteAbsence" :disabled="isBusy" color="error">Delete</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-main>
</template>

<script>
    import AlDatePicker from '@/components/AlDatePicker';
    import DynamicButton from '@/components/DynamicButton';
    import ShyProgress from '@/components/ShyProgress';
    import TheAppBar from '@/components/TheAppBar';

    export default {
        name: 'Absences',

        components: {
            AlDatePicker,
            DynamicButton,
            ShyProgress,
            TheAppBar,
        },

        data() {
            return {
                addModal:        false,
                isBusy:          false,
                start:           null,
                end:             null,
                confirmDelete:   false,
                deleteAbsenceId: null,
            };
        },

        created() {
            this.$store.dispatch('fetchAbsences', {userId: this.$store.getters.ownUserId});
        },

        computed: {
            absences() {
                return this.$store.getters.absences(this.$store.getters.ownUserId)?.map(absence => {
                    return {
                        id:    absence.id,
                        start: absence.start ? absence.start : '\u221e',
                        end:   absence.end ? absence.end : '\u221e',
                    };
                });
            },
        },

        methods: {
            async save() {
                if (!this.$refs.addForm.validate()) {
                    return;
                }
                this.isBusy = true;
                try {
                    await this.$store.dispatch('saveAbsence', {
                        userId: this.$store.getters.ownUserId,
                        start:  this.start,
                        end:    this.end,
                    });
                    this.start = null;
                    this.end = null;
                    this.addModal = false;
                } finally {
                    this.isBusy = false;
                }
            },

            openConfirmDelete(absenceId) {
                this.confirmDelete = true;
                this.deleteAbsenceId = absenceId;
            },

            async deleteAbsence() {
                try {
                    this.isBusy = true;
                    await this.$store.dispatch('deleteAbsence', {
                        userId:    this.$store.getters.ownUserId,
                        absenceId: this.deleteAbsenceId,
                    });
                } finally {
                    this.confirmDelete = false;
                    this.isBusy = false;
                }
            },
        },
    };
</script>1
