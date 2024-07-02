<template>
    <v-main>
        <the-app-bar sub-page>
            Reset password

            <template #buttons>
                <v-btn color="primary" @click="save" :disabled="isBusy">Reset password</v-btn>
            </template>
        </the-app-bar>

        <shy-progress v-if="isBusy"/>

        <v-container>
            <v-form ref="form" :disabled="isBusy" @submit.prevent="save()">
                <p class="text-body-1 mt-4">
                    Reset password for user <b>{{ name }}</b>.
                </p>

                <v-text-field type="password" v-model="newPassword" :label="`New password for ${name}`"
                              :rules="newRules"
                              :append-icon="$icons.password"/>

                <p class="text-body-1 mt-4">
                    As a safety measure, please enter your own password:
                </p>

                <v-text-field type="password" v-model="ownPassword" label="Own password"
                              :rules="ownRules"
                              :append-icon="$icons.password"/>

                <!-- Button is to make it submittable by pressing enter -->
                <v-btn type="submit" :disabled="isBusy" v-show="false">Reset password</v-btn>
            </v-form>
        </v-container>
    </v-main>
</template>

<script>
    import ShyProgress from '@/components/ShyProgress';
    import TheAppBar from '@/components/TheAppBar';

    export default {
        name: 'UserResetPassword',

        components: {
            ShyProgress,
            TheAppBar,
        },

        data() {
            return {
                userId:      null,
                name:        null,
                isBusy:      true,
                newPassword: '',
                ownPassword: '',
                newRules:    [
                    value => value.length >= 6 || 'The password is too short',
                ],
                ownRules:    [
                    value => value !== '' || 'Your own password is required',
                ],
            };
        },

        async created() {
            this.userId = parseInt(this.$route.params.id, 10);
            let users = await this.$store().adminFetchUsers();
            let user = users.find(u => u.id === this.userId);
            this.name = user.name;
            this.isBusy = false;
        },

        methods: {
            async save() {
                if (!this.$refs.form.validate()) {
                    return;
                }
                try {
                    this.isBusy = true;

                    let successOrReason = await this.$store().adminResetPassword(this.userId, this.newPassword, this.ownPassword);

                    if (successOrReason !== true) {
                        this.isBusy = false;
                        this.$store().setGlobalSnackbar(this.getReasonText(successOrReason));
                    } else {
                        this.$store().setGlobalSnackbar('Password reset successfully!');
                        await this.$router.back();
                    }
                } catch (err) {
                    this.isBusy = false;
                    throw err;
                }
            },

            getReasonText(reason) {
                switch (reason) {
                    case 'new-password-too-short':
                        return 'New password is too short';
                    case 'own-password-invalid':
                        return 'Your own password is incorrect';
                    default:
                        return reason;
                }
            },
        },
    };
</script>
