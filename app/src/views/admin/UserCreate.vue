<template>
    <v-main>
        <the-app-bar sub-page>
            New user

            <template #buttons>
                <v-btn color="primary" @click="save" :disabled="isBusy">Save</v-btn>
            </template>
        </the-app-bar>

        <shy-progress v-if="username === null"/>

        <v-container>
            <v-form ref="form" :disabled="isBusy" @submit.prevent="save">
                <v-text-field v-model="username" label="Username" :rules="usernameRules" autofocus/>
                <v-text-field v-model="name" label="Display name" :rules="nameRules"/>
                <v-text-field type="password" v-model="password" label="Password" :rules="passwordRules"/>

                <!-- Button is to make it submittable by pressing enter -->
                <v-btn type="submit" :disabled="isBusy" v-show="false">Save</v-btn>
            </v-form>
        </v-container>
    </v-main>
</template>

<script>
    import ShyProgress from '@/components/ShyProgress.vue';
    import TheAppBar from '@/components/TheAppBar.vue';

    export default {
        name: 'UserCreate',

        components: {
            ShyProgress,
            TheAppBar,
        },

        data() {
            return {
                username:      '',
                name:          '',
                password:      '',
                isBusy:        false,
                usernameRules: [
                    value => !!value || 'A username is required',
                ],
                nameRules:     [
                    value => !!value || 'A display name is required',
                ],
                passwordRules: [
                    value => value.length >= 6 || 'The password is too short',
                ],
            };
        },

        methods: {
            async save() {
                if (!this.$refs.form.validate()) {
                    return;
                }
                this.isBusy = true;
                try {
                    let userId = await this.$store().adminCreateUser({
                        username: this.username,
                        name:     this.name,
                        password: this.password,
                    });
                    await this.$router.replace(`/admin/users/${userId}`);
                } finally {
                    this.isBusy = false;
                }
            },
        },
    };
</script>
