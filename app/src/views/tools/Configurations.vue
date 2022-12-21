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
                        <tr v-for="row of configurations" :key="row.name" @click="edit(row.name, row.value)">
                            <td>{{ row.name }}</td>
                            <td>{{ row.value }}</td>
                        </tr>
                    </tbody>
                </template>
            </v-simple-table>
        </v-container>

        <v-dialog v-model="dialog">
            <v-card>
                <v-card-title>
                    Edit {{ editName }}
                </v-card-title>
                <v-card-text>
                    <v-textarea v-model="editValue"></v-textarea>
                </v-card-text>
                <v-card-actions>
                    <v-btn text @click="dialog = false" :disabled="isBusy">Cancel</v-btn>
                    <v-spacer/>
                    <v-btn @click="save" :disabled="isBusy" color="primary">Save</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
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
                dialog:         false,
                editName:       '',
                editValue:      '',
                isBusy:         true,
            };
        },

        async created() {
            this.configurations = await this.$store().fetchConfigurations();
            this.isBusy = false;
        },

        methods: {
            edit(name, value) {
                if (this.isBusy) {
                    return;
                }

                this.editName = name;
                this.editValue = value;
                this.dialog = true;
            },

            async save() {
                this.isBusy = true;
                try {
                    await this.$store().saveConfiguration(this.editName, this.editValue);
                    this.dialog = false;
                    this.configurations = await this.$store().fetchConfigurations();
                } finally {
                    this.isBusy = false;
                }
            },
        },
    };
</script>
