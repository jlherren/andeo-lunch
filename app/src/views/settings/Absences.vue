<template>
    <v-main>
        <the-app-bar sub-page>
            Absences
        </the-app-bar>

        <shy-progress v-if="!absences"/>

        <v-list v-if="absences !== null">
            <v-list-item v-for="absence of absences" :key="absence.id">
                <v-list-item-content>
                    <v-list-item-title>
                        From {{ absence.start }}
                        to {{ absence.end }}
                    </v-list-item-title>
                </v-list-item-content>
            </v-list-item>
        </v-list>

        <v-container v-if="absences && absences.length === 0">
            <v-banner elevation="2" single-line :icon="$icons.information">
                You have no absences
            </v-banner>
        </v-container>
    </v-main>
</template>

<script>
    import ShyProgress from '@/components/ShyProgress';
    import TheAppBar from '@/components/TheAppBar';

    export default {
        name: 'Absences',

        components: {
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
