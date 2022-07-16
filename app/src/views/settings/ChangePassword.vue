<template>
    <v-main>
        <the-app-bar sub-page>
            Change password

            <template v-slot:buttons>
                <v-btn color="primary" @click="save()" :disabled="isBusy">Save</v-btn>
            </template>
        </the-app-bar>

        <shy-progress v-if="isBusy"/>

        <v-container>
            <p class="text-body-1 mt-4">
                Change password for user <b>{{ $store.getters.ownUsername }}</b>.  If you forgot your password,
                please contact an admin.
            </p>

            <v-form ref="form" :disabled="isBusy" @submit.prevent="save()">
                <v-text-field type="password" v-model="oldPassword" label="Current password" autofocus
                              min="0" :rules="oldRules"
                              :append-icon="$icons.password"/>

                <v-text-field type="password" v-model="newPassword" label="New password"
                              min="0" :rules="newRules"
                              :append-icon="$icons.password"/>

                <v-text-field type="password" v-model="confirmPassword" label="Confirm new password"
                              min="0" :rules="confirmRules"
                              :append-icon="$icons.password"/>

                <!-- Button is to make it submittable by pressing enter -->
                <v-btn type="submit" :disabled="isBusy" v-show="false">Save</v-btn>
            </v-form>
        </v-container>
    </v-main>
</template>

<script>
    import ShyProgress from '@/components/ShyProgress';
    import TheAppBar from '@/components/TheAppBar';

    export default {
        name: 'Profile',

        components: {
            ShyProgress,
            TheAppBar,
        },

        data() {
            return {
                isBusy:          false,
                oldPassword:     '',
                newPassword:     '',
                confirmPassword: '',
                oldRules:        [
                    v => v !== '',
                ],
                newRules:        [
                    v => v.length >= 6,
                ],
                confirmRules:    [
                    v => v === this.newPassword,
                ],
            };
        },

        methods: {
            async save() {
                if (!this.$refs.form.validate()) {
                    return;
                }
                try {
                    this.isBusy = true;

                    let successOrReason = await this.$store.dispatch('changePassword', {
                        oldPassword: this.oldPassword,
                        newPassword: this.newPassword,
                    });

                    if (successOrReason !== true) {
                        this.isBusy = false;
                        this.$store.commit('globalSnackbar', this.getReasonText(successOrReason));
                    } else {
                        this.$store.commit('globalSnackbar', 'Password changed successfully!');
                        await this.$router.back();
                    }
                } catch (err) {
                    this.isBusy = false;
                    throw err;
                }
            },

            getReasonText(reason) {
                switch (reason) {
                    case 'old-password-invalid':
                        return 'Current password is incorrect';
                    case 'new-password-too-short':
                        return 'New password is too short';
                    default:
                        return reason;
                }
            },
        },
    };
</script>
