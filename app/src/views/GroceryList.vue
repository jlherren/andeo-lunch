<template>
    <v-main>
        <the-app-bar>
            Grocery list
        </the-app-bar>

        <shy-progress v-if="loading"/>

        <v-list>
            <template v-if="groceries.length || !loading">
                <v-list-item>
                    <v-list-item-icon>
                        <v-icon>
                            {{ $icons.groceryList }}
                        </v-icon>
                    </v-list-item-icon>
                    <v-list-item-content>
                        <v-list-item-title>
                            <v-combobox ref="combobox" :items="autocompleteItems" item-text="label" item-value="id"
                                        v-model="newItemLabel"
                                        hide-details dense hide-no-data autofocus
                                        placeholder="Add item..." @input="changed($event)" @keydown="keydown($event)"/>
                        </v-list-item-title>
                    </v-list-item-content>
                    <v-list-item-action>
                        <v-btn @click="addButton" fab small color="primary">
                            <v-icon>{{ $icons.plus }}</v-icon>
                        </v-btn>
                    </v-list-item-action>
                </v-list-item>
                <v-list-item v-for="grocery of groceries" :key="grocery.id" :class="{checked: grocery.checked}">
                    <v-list-item-action>
                        <v-checkbox v-model="grocery.checked" @change="onChangeChecked(grocery)"/>
                    </v-list-item-action>
                    <v-list-item-content>
                        <v-list-item-title>
                            <v-text-field v-model="grocery.label" dense hide-details @change="onChangeLabel(grocery)"/>
                        </v-list-item-title>
                    </v-list-item-content>
                    <v-list-item-action>
                        <v-btn icon @click="deleteItem(grocery)">
                            <v-icon>
                                {{ $icons.delete }}
                            </v-icon>
                        </v-btn>
                    </v-list-item-action>
                </v-list-item>
            </template>
            <template v-else>
                <v-skeleton-loader type="list-item-avatar"/>
            </template>
        </v-list>
    </v-main>
</template>

<script>
    import ShyProgress from '../components/ShyProgress';
    import TheAppBar from '../components/TheAppBar';
    import Vue from 'vue';
    import {mapGetters} from 'vuex';

    export default {
        name: 'GroceryList',

        components: {
            ShyProgress,
            TheAppBar,
        },

        data() {
            return {
                loading:      true,
                newItemLabel: '',
            };
        },

        async created() {
            await this.$store.dispatch('fetchGroceries');
            this.loading = false;
        },

        computed: {
            ...mapGetters([
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
                this.$refs.combobox.blur();
                Vue.nextTick(() => {
                    this.addItem(event.label);
                    this.newItemLabel = '';
                });
            },

            keydown(event) {
                if (event.key === 'Enter') {
                    this.$refs.combobox.blur();
                    Vue.nextTick(() => {
                        this.addItem(this.newItemLabel);
                        this.newItemLabel = '';
                        // Somehow nextTick() does not work here
                        setTimeout(() => {
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

            addItem(label) {
                if (label === '') {
                    return;
                }
                // Check if an identical item exists already
                let existing = this.groceries.find(grocery => grocery.label === label && grocery.checked);
                if (existing) {
                    this.$store.dispatch('saveGrocery', {
                        id:      existing.id,
                        checked: false,
                    });
                    return;
                }

                this.$store.dispatch('saveGrocery', {
                    label,
                    checked: false,
                });
            },

            onChangeChecked(grocery) {
                this.$store.dispatch('saveGrocery', {
                    id:      grocery.id,
                    checked: grocery.checked,
                });
            },

            onChangeLabel(grocery) {
                this.$store.dispatch('saveGrocery', {
                    id:            grocery.id,
                    label:         grocery.label,
                    noUpdateOrder: true,
                });
            },

            deleteItem(grocery) {
                this.$store.dispatch('deleteGrocery', grocery.id);
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
