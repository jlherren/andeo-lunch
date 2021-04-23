<template>
    <v-list-item :to="link">
        <v-list-item-icon>
            <v-icon>{{ icon }}</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
            <v-list-item-title>{{ event.name }}</v-list-item-title>
            <v-list-item-subtitle>{{ formattedDate }}</v-list-item-subtitle>
        </v-list-item-content>
    </v-list-item>

</template>

<script>
    export default {
        name: 'eventListItem',
        props: {
            event: {
                date: null,
                weekday: null,
                name: null,
            },
        },
        computed: {
            icon() {
                switch (this.event.type) {
                    case 'meal':
                        return 'mdi-food';
                    default:
                        return 'mdi-help-circle';
                }
            },

            formattedDate() {
                return this.event.date.toDateString();
            },
            link() {
                return `/events/${this.event.id}`;
            },
        },
    };
</script>
