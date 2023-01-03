<template>
    <v-main>
        <the-app-bar sub-page>
            Users
        </the-app-bar>

        <shy-progress v-if="users === null"/>

        <v-container>
            <v-simple-table v-if="users !== null">
                <template #default>
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Name</th>
                            <th>Flags</th>
                            <th>Edit limit (days)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="user of users" :key="user.name" @click="edit(user)">
                            <td>{{ user.username }}</td>
                            <td>{{ user.name }}</td>
                            <td>{{ getFlags(user) }}</td>
                            <td>{{ user.maxPastDaysEdit ?? '&mdash;' }}</td>
                        </tr>
                    </tbody>
                </template>
            </v-simple-table>
        </v-container>

        <v-dialog v-model="dialog" max-width="600">
            <v-card>
                <v-card-title>
                    Edit {{ editName }}
                </v-card-title>
                <v-card-text>
                    <v-text-field v-model="editUsername" label="Username" disabled/>
                    <v-text-field v-model="editName" label="Display name" :disabled="isBusy"/>
                    <v-row>
                        <v-col cols="6">
                            <v-checkbox v-model="editActive" label="Active" hint="Allow user to log in and use the app" persistent-hint :disabled="isBusy"/>
                        </v-col>
                        <v-col cols="6">
                            <v-checkbox v-model="editHidden" label="Hidden" hint="Hide the user from most lists" persistent-hint :disabled="isBusy"/>
                        </v-col>
                    </v-row>
                    <v-row>
                        <v-col cols="6">
                            <v-checkbox v-model="editRestrictEdit" label="Restrict editing events" hint="Do not allow editing events far in the past" persistent-hint :disabled="isBusy"/>
                        </v-col>
                        <v-col cols="6">
                            <number-field v-model="editMaxPastDaysEdit" hint="Number of days into the past to allow editing events" :disabled="isBusy || !editRestrictEdit"/>
                        </v-col>
                    </v-row>
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
    import NumberField from '@/components/NumberField.vue';
    import ShyProgress from '@/components/ShyProgress.vue';
    import TheAppBar from '@/components/TheAppBar.vue';

    export default {
        name: 'Users',

        components: {
            NumberField,
            ShyProgress,
            TheAppBar,
        },

        data() {
            return {
                users:               null,
                dialog:              false,
                editId:              0,
                editUsername:        '',
                editName:            '',
                editActive:          false,
                editHidden:          false,
                editRestrictEdit:    false,
                editMaxPastDaysEdit: null,
                isBusy:              true,
            };
        },

        async created() {
            this.users = await this.$store().adminFetchUsers();
            this.isBusy = false;
        },

        methods: {
            edit(user) {
                if (this.isBusy) {
                    return;
                }

                this.editId = user.id;
                this.editUsername = user.username;
                this.editName = user.name;
                this.editActive = user.active;
                this.editHidden = user.hidden;
                this.editRestrictEdit = user.maxPastDaysEdit !== null;
                this.editMaxPastDaysEdit = user.maxPastDaysEdit ?? 30;
                this.dialog = true;
            },

            getFlags(user) {
                let flags = [];
                if (!user.active) {
                    flags.push('Inactive');
                }
                if (user.hidden) {
                    flags.push('Hidden');
                }
                return flags.join(', ');
            },

            async save() {
                this.isBusy = true;
                try {
                    await this.$store().adminSaveUser({
                        id:              this.editId,
                        name:            this.editName,
                        active:          this.editActive,
                        hidden:          this.editHidden,
                        maxPastDaysEdit: this.editRestrictEdit ? this.editMaxPastDaysEdit : null,
                    });
                    this.dialog = false;
                    this.users = await this.$store().adminFetchUsers();
                } finally {
                    this.isBusy = false;
                }
            },
        },
    };
</script>
