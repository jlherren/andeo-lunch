<template>
    <v-main>
        <the-app-bar sub-page>
            Absences

            <template #buttons>
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
            <v-list-item v-for="absence of absences" :key="absence.id" :disabled="absence.past">
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

        <v-dialog v-model="addModal" max-width="600">
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

        <v-dialog v-model="confirmDelete" max-width="600">
            <v-card>
                <v-card-title>
                    Delete absence?
                </v-card-title>
                <v-card-actions>
                    <v-btn text @click="confirmDelete = false" :disabled="isBusy">No, keep it</v-btn>
                    <v-spacer/>
                    <v-btn @click="deleteAbsence" :disabled="isBusy" color="error">Yes, delete</v-btn>
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
            this.$store().fetchAbsences({userId: this.$store().ownUserId});
        },

        computed: {
            absences() {
                let absences = this.$store().absences(this.$store().ownUserId);
                if (absences === null) {
                    return null;
                }
                absences.sort((a, b) => {
                    if (a.start < b.start) {
                        return 1;
                    }
                    if (a.start > b.start) {
                        return -1;
                    }
                    return 0;
                });
                let now = Date.now();
                return absences.map(absence => {
                    let date = new Date(absence.end);
                    date.setHours(23, 59, 59, 999);
                    return {
                        id:    absence.id,
                        start: absence.start ? absence.start : '\u221e',
                        end:   absence.end ? absence.end : '\u221e',
                        past:  date.getTime() < now,
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
                    await this.$store().saveAbsence({
                        userId: this.$store().ownUserId,
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
                    await this.$store().deleteAbsence({
                        userId:    this.$store().ownUserId,
                        absenceId: this.deleteAbsenceId,
                    });
                } finally {
                    this.confirmDelete = false;
                    this.isBusy = false;
                }
            },
        },
    };
</script>
