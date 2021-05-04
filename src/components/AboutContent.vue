<template>
    <v-card>
        <v-card-title>
            About Lunch Money
        </v-card-title>

        <v-card-text>
            Frontend version: {{ frontendVersion }}<br>

            Backend version:
            <v-progress-circular size="10" width="1" indeterminate v-if="backendVersionLoading"/>
            <span v-else>{{ backendVersion }}</span>
            <br>
        </v-card-text>

        <v-card-actions>
            <v-spacer />
            <v-btn text @click="$emit('close')">
                Close
            </v-btn>
        </v-card-actions>
    </v-card>
</template>

<script>
    import {mapGetters} from 'vuex';

    export default {
        data() {
            return {
                backendVersionLoading: true,
            };
        },

        async created() {
            try {
                await this.$store.dispatch('fetchBackendVersion');
            } finally {
                this.backendVersionLoading = false;
            }
        },

        computed: {
            ...mapGetters([
                'ownUser',
                'backendVersion',
                'frontendVersion',
            ]),
        },
    };
</script>
