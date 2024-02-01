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

                <v-banner elevation="2" :icon="$icons.alert" icon-color="red" class="my-4" v-if="balanceWarning">
                    Do not hide users with non-zero balances!
                </v-banner>

                <v-checkbox v-model="restrictEdit" label="Restrict editing past events" persistent-hint/>
                <number-field v-model="maxPastDaysEdit" label="Number of days into the past to allow editing events" :disabled="!restrictEdit"/>

                <number-field v-model="user.points" label="Exact points balance" readonly/>
                <number-field v-model="user.money" label="Exact money balance" readonly/>

                <v-btn type="button" :disabled="isBusy || !decommissionContraUser || userId === decommissionContraUser" @click="openDecommissionConfirm">
                    Clear balances {{ decommissionContraUser ? null : '(not configured)' }}
                </v-btn>

                <!-- Button is to make it submittable by pressing enter -->
                <v-btn type="submit" :disabled="isBusy" v-show="false">Save</v-btn>
            </v-form>
        </v-container>

        <v-dialog v-model="decommissionConfirm">
            <v-card>
                <v-card-title>
                    Clear the balances of user "{{ user?.name }}"?
                </v-card-title>
                <v-card-text>
                    <p>
                        This will bring the balances to zero by creating transfers to or from user
                        "{{ decommissionContraUserName?.name }}". Please note:
                    </p>

                    <ul>
                        <li>Make sure that all lunches have been accounted for, point-wise and money-wise.</li>
                        <li>It's best to do this no earlier than two months after the last participation.</li>
                    </ul>
                </v-card-text>
                <v-card-actions>
                    <v-btn text @click="decommissionConfirm = false" :disabled="isBusy">Cancel</v-btn>
                    <v-spacer/>
                    <v-btn @click="decommission" :disabled="isBusy" color="error">Yes, clear balances</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-main>
</template>

<script>
    import NumberField from '@/components/NumberField.vue';
    import ShyProgress from '@/components/ShyProgress.vue';
    import TheAppBar from '@/components/TheAppBar.vue';
    import {mapState} from 'pinia';
    import {useStore} from '@/store';

    export default {
        name: 'UserEdit',

        components: {
            NumberField,
            ShyProgress,
            TheAppBar,
        },

        data() {
            return {
                userId:              null,
                user:                null,
                name:                null,
                active:              false,
                hidden:              false,
                restrictEdit:        false,
                maxPastDaysEdit:     null,
                isBusy:              true,
                nameRules:           [
                    value => !!value || 'A display name is required',
                ],
                decommissionConfirm: false,
            };
        },

        created() {
            this.userId = parseInt(this.$route.params.id, 10);
            this.load();
        },

        methods: {
            async load() {
                this.isBusy = true;
                let users = await this.$store().adminFetchUsers();
                await this.$store().fetchDecommissionContraUser();
                let user = users.find(u => u.id === this.userId);
                this.user = user;
                this.name = user.name;
                this.active = user.active;
                this.hidden = user.hidden;
                this.restrictEdit = user.maxPastDaysEdit !== null;
                this.maxPastDaysEdit = user.maxPastDaysEdit;
                this.isBusy = false;
            },

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

            openDecommissionConfirm() {
                this.decommissionConfirm = true;
            },

            async decommission() {
                let transfers = [];

                if (this.user.points < -1e-6) {
                    transfers.push({
                        senderId:    this.decommissionContraUser,
                        recipientId: this.userId,
                        amount:      -this.user.points,
                        currency:    'points',
                    });
                } else if (this.user.points > 1e-6) {
                    transfers.push({
                        senderId:    this.userId,
                        recipientId: this.decommissionContraUser,
                        amount:      this.user.points,
                        currency:    'points',
                    });
                }
                if (this.user.money < -1e-6) {
                    transfers.push({
                        senderId:    this.decommissionContraUser,
                        recipientId: this.userId,
                        amount:      -this.user.money,
                        currency:    'money',
                    });
                } else if (this.user.money > 1e-6) {
                    transfers.push({
                        senderId:    this.userId,
                        recipientId: this.decommissionContraUser,
                        amount:      this.user.money,
                        currency:    'money',
                    });
                }

                try {
                    this.isBusy = true;
                    if (transfers.length) {
                        await this.$store().saveEvent({
                            name:      `Decommission ${this.user.name}`,
                            date:      new Date(),
                            type:      'transfer',
                            immutable: true,
                            transfers: transfers,
                        });
                    }
                    await this.load();
                    this.decommissionConfirm = false;
                } finally {
                    this.isBusy = false;
                }
            },
        },

        computed: {
            ...mapState(useStore, [
                'decommissionContraUser',
            ]),

            decommissionContraUserName() {
                return this.$store().user(this.decommissionContraUser);
            },

            balanceWarning() {
                return this.hidden && (Math.abs(this.user.points) > 1e-6 || Math.abs(this.user.money) > 1e-6);
            },
        },
    };
</script>
