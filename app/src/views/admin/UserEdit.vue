<template>
    <v-main>
        <the-app-bar sub-page>
            Edit {{ name }}

            <template #buttons>
                <v-btn color="primary" @click="save" :disabled="isBusy">Save</v-btn>
            </template>
        </the-app-bar>

        <shy-progress v-if="user === null"/>

        <v-container v-else>
            <v-form ref="form" :disabled="isBusy" @submit.prevent="save">
                <v-text-field v-model="userId" label="User ID" disabled/>
                <v-text-field v-model="user.username" label="Username" disabled/>
                <v-text-field v-model="name" label="Display name" :rules="nameRules"/>
                <v-checkbox v-model="active" label="Active" :hint="this.active ? 'User is allowed to log in and use the app' : 'User cannot log in or use the app'" persistent-hint/>
                <v-checkbox v-model="hidden" label="Hidden" :hint="hidden ? 'User is not displayed in lists' : 'User appears normally in all lists'" persistent-hint/>
                <v-checkbox v-model="restrictEdit" label="Restrict editing past events" persistent-hint/>
                <number-field v-model="maxPastDaysEdit" label="Number of days into the past to allow editing events" :disabled="!restrictEdit"/>

                <number-field v-model="user.points" label="Exact points balance" readonly/>
                <number-field v-model="user.money" label="Exact money balance" readonly/>

                <!-- Button is to make it submittable by pressing enter -->
                <v-btn type="submit" :disabled="isBusy" v-show="false">Save</v-btn>
            </v-form>
        </v-container>
    </v-main>
</template>

<script>
    import NumberField from '@/components/NumberField.vue';
    import ShyProgress from '@/components/ShyProgress.vue';
    import TheAppBar from '@/components/TheAppBar.vue';

    export default {
        name: 'UserEdit',

        components: {
            NumberField,
            ShyProgress,
            TheAppBar,
        },

        data() {
            return {
                userId:          null,
                user:            null,
                name:            null,
                active:          false,
                hidden:          false,
                restrictEdit:    false,
                maxPastDaysEdit: null,
                isBusy:          true,
                nameRules:       [
                    value => !!value || 'A display name is required',
                ],
            };
        },

        async created() {
            this.userId = parseInt(this.$route.params.id, 10);
            let users = await this.$store().adminFetchUsers();
            let user = users.find(u => u.id === this.userId);
            this.user = user;
            this.name = user.name;
            this.active = user.active;
            this.hidden = user.hidden;
            this.restrictEdit = user.maxPastDaysEdit !== null;
            this.maxPastDaysEdit = user.maxPastDaysEdit;
            this.isBusy = false;
        },

        methods: {
            async save() {
                if (!this.$refs.form.validate()) {
                    return;
                }
                this.isBusy = true;
                try {
                    await this.$store().adminSaveUser({
                        id:              this.userId,
                        name:            this.name,
                        active:          this.active,
                        hidden:          this.hidden,
                        maxPastDaysEdit: this.restrictEdit ? this.maxPastDaysEdit : null,
                    });
                    await this.$router.back();
                } finally {
                    this.isBusy = false;
                }
            },
        },
    };
</script>
