<template>
    <v-main>
        <the-app-bar sub-page>
            Tools
        </the-app-bar>

        <shy-progress v-if="versions === null"/>

        <v-container>
            <p class="body-2">
                Versions seen recently, period: {{ period }}
            </p>

            <v-simple-table v-if="versions !== null">
                <template #default>
                    <thead>
                        <tr>
                            <th>Version</th>
                            <th>Device count</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="row of versions" :key="row.version">
                            <td>{{ row.version }}</td>
                            <td>{{ row.count }}</td>
                        </tr>
                        <tr>
                            <td>Total</td>
                            <td>{{ deviceCount }}</td>
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
        name: 'DeviceVersions',

        components: {
            ShyProgress,
            TheAppBar,
        },

        data() {
            return {
                versions: null,
                period:   null,
            };
        },

        async created() {
            const deviceVersions = await this.$store().deviceVersions();
            this.versions = deviceVersions.versions;
            this.period = deviceVersions.period;
        },

        computed: {
            deviceCount() {
                return this.versions.reduce((sum, row) => sum + row.count, 0);
            },
        },
    };
</script>
