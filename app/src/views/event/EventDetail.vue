<template>
    <lunch-detail v-if="eventType === 'lunch' || eventType === 'special'"/>
    <transfer-detail v-else-if="eventType === 'transfer'"/>
</template>

<script>
    import LunchDetail from '@/views/event/LunchDetail';
    import TransferDetail from '@/views/event/TransferDetail';

    export default {
        name: 'EventDetail',

        components: {
            TransferDetail,
            LunchDetail,
        },

        data() {
            return {
                eventId: parseInt(this.$route.params.id, 10),
            };
        },

        async created() {
            try {
                await this.$store.dispatch('fetchEvent', {eventId: this.eventId});
            } catch (err) {
                if (err?.response?.status === 404) {
                    await this.$router.push('/');
                }
            }
        },

        computed: {
            eventType() {
                return this.$store.getters.event(this.eventId)?.type;
            },
        },
    };
</script>
