<template>
    <v-main>
        <the-app-bar>
            Grocery list
        </the-app-bar>

        <shy-progress v-if="loading"/>

        <v-list>
            <template v-if="loading && !groceries.length">
                <v-skeleton-loader type="list-item-avatar"/>
            </template>
            <template v-else>
                <v-list-item>
                    <v-list-item-icon>
                        <v-icon>
                            {{ $icons.groceryList }}
                        </v-icon>
                    </v-list-item-icon>
                    <v-list-item-content>
                        <v-list-item-title>
                            <v-combobox ref="combobox" :items="autocompleteItems" item-text="label" item-value="id"
                                        v-model="newItemLabel" :disabled="busyNewItem"
                                        hide-details dense hide-no-data autofocus
                                        placeholder="Add item..." @input="changed" @keydown="keydown"/>
                        </v-list-item-title>
                    </v-list-item-content>
                    <v-list-item-action>
                        <v-btn @click="addButton" fab small color="primary" :disabled="busyNewItem">
                            <v-icon>{{ $icons.plus }}</v-icon>
                        </v-btn>
                    </v-list-item-action>
                </v-list-item>
                <v-list-item v-for="grocery of groceries" :key="grocery.id" :class="{checked: grocery.checked}">
                    <v-list-item-action>
                        <v-checkbox v-model="grocery.checked" @change="onChangeChecked(grocery)" :disabled="grocery.id in busyItems" hide-details/>
                    </v-list-item-action>
                    <v-list-item-content>
                        <v-list-item-title>
                            <v-text-field v-model="grocery.label" dense hide-details @change="onChangeLabel(grocery)" :disabled="grocery.id in busyItems"/>
                        </v-list-item-title>
                    </v-list-item-content>
                    <v-list-item-action>
                        <v-btn icon @click="deleteItem(grocery)" :disabled="grocery.id in busyItems">
                            <v-icon>
                                {{ $icons.delete }}
                            </v-icon>
                        </v-btn>
                    </v-list-item-action>
                </v-list-item>
            </template>
        </v-list>
    </v-main>
</template>

<script>
    import ShyProgress from '../components/ShyProgress';
    import TheAppBar from '../components/TheAppBar';
    import Vue from 'vue';
    import {mapState} from 'pinia';
    import {useStore} from '@/store';

    export default {
        name: 'GroceryList',

        components: {
            ShyProgress,
            TheAppBar,
        },

        data() {
            return {
                loading:      true,
                busyNewItem:  true,
                // TODO: For Vue 3 this can be replaced by new Set() and usages of Vue.set() and Vue.delete() removed.
                busyItems:    {},
                newItemLabel: '',
            };
        },

        async created() {
            await this.$store().fetchGroceries();
            this.loading = false;
            this.busyNewItem = false;
            this.reloadTimer = null;
            this.removeBusyOnRefresh = {};
        },

        beforeUnmount() {
            this.cancelTimer();
        },

        computed: {
            ...mapState(useStore, [
                'groceries',
            ]),

            autocompleteItems() {
                return this.groceries.filter(item => item.checked);
            },
        },

        methods: {
            changed(event) {
                if (typeof event === 'string') {
                    return;
                }
                let label = event.label;
                this.$refs.combobox.blur();
                Vue.nextTick(() => {
                    this.addItem(label);
                    this.newItemLabel = '';
                });
            },

            keydown(event) {
                if (event.key === 'Enter') {
                    this.$refs.combobox.blur();
                    Vue.nextTick(async () => {
                        await this.addItem(this.newItemLabel);
                        this.newItemLabel = '';
                        Vue.nextTick(() => {
                            this.$refs.combobox.focus();
                        });
                    });
                }
            },

            addButton() {
                this.$refs.combobox.blur();
                Vue.nextTick(() => {
                    this.addItem(this.newItemLabel);
                    this.newItemLabel = '';
                });
            },

            async addItem(label) {
                if (label === '') {
                    return;
                }
                // Check if an identical item exists already
                let existing = this.groceries.find(grocery => grocery.label === label && grocery.checked);
                if (existing) {
                    Vue.set(this.busyItems, existing.id, true);
                    await this.$store().saveGrocery({
                        id:      existing.id,
                        checked: false,
                    });
                    Vue.delete(this.busyItems, existing.id);
                } else {
                    this.busyNewItem = true;
                    await this.$store().saveGrocery({
                        label,
                        checked: false,
                    });
                    this.busyNewItem = false;
                }
            },

            async onChangeChecked(grocery) {
                Vue.set(this.busyItems, grocery.id, true);
                await this.$store().saveGrocery({
                    id:            grocery.id,
                    checked:       grocery.checked,
                    noUpdateOrder: true,
                    refresh:       false,
                });
                this.removeBusyOnRefresh[grocery.id] = true;
                this.resetTimer();
            },

            async onChangeLabel(grocery) {
                Vue.set(this.busyItems, grocery.id, true);
                await this.$store().saveGrocery({
                    id:            grocery.id,
                    label:         grocery.label,
                    noUpdateOrder: true,
                });
                Vue.delete(this.busyItems, grocery.id);
            },

            async deleteItem(grocery) {
                Vue.set(this.busyItems, grocery.id, true);
                await this.$store().deleteGrocery({
                    id:      grocery.id,
                    refresh: false,
                });
                this.removeBusyOnRefresh[grocery.id] = true;
                this.resetTimer();
            },

            cancelTimer() {
                if (this.reloadTimer) {
                    clearTimeout(this.reloadTimer);
                }
            },

            resetTimer() {
                this.cancelTimer();

                this.reloadTimer = setTimeout(async () => {
                    await this.$store().fetchGroceries();
                    for (let id of Object.keys(this.removeBusyOnRefresh)) {
                        Vue.delete(this.busyItems, id);
                    }
                    this.removeBusyOnRefresh = {};
                }, 1000);
            },
        },
    };

</script>

<style lang="scss">
    .checked {
        .v-list-item__title {
            text-decoration: line-through;
            opacity: 0.7;
        }
    }
</style>
