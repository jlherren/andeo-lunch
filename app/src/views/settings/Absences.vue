<template>
    <v-main>
        <the-app-bar sub-page>
            Absences

            <template v-slot:buttons>
                <dynamic-button icon="$icons.plus" label="Add" disabled/>
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

        <v-list v-if="absences !== null && absences.length">
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
                    <v-btn icon disabled>
                        <v-icon>
                            {{ $icons.delete }}
                        </v-icon>
                    </v-btn>
                </v-list-item-action>
            </v-list-item>
        </v-list>
    </v-main>
</template>

<script>
    import DynamicButton from '../../components/DynamicButton';
    import ShyProgress from '@/components/ShyProgress';
    import TheAppBar from '@/components/TheAppBar';

    export default {
        name: 'Absences',

        components: {
            DynamicButton,
            ShyProgress,
            TheAppBar,
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
    };
</script>1
