<template>
    <v-main>
        <the-app-bar sub-page>
            Configuration
        </the-app-bar>

        <shy-progress v-if="configurations === null"/>

        <v-container>
            <v-simple-table v-if="configurations !== null">
                <template #default>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="row of configurations" :key="row.name">
                            <td>{{ row.name }}</td>
                            <td>{{ row.value }}</td>
                        </tr>
                    </tbody>
                </template>
            </v-simple-table>
        </v-container>
    </v-main>
</template>

<script>
    import ShyProgress from '@/components/ShyProgress.vue';
    import TheAppBar from '@/components/TheAppBar.vue';

    export default {
        name: 'Configurations',

        components: {
            ShyProgress,
            TheAppBar,
        },

        data() {
            return {
                configurations: null,
            };
        },

        async created() {
            this.configurations = await this.$store().configurations();
        },
    };
</script>
