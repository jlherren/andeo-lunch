<template>
    <v-main>
        <the-app-bar sub-page>
            Audit log
        </the-app-bar>

        <shy-progress v-if="loading"/>

        <v-container v-if="!loading && audits.length === 0">
            <v-banner elevation="2" single-line :icon="$icons.information">
                No audit entries
            </v-banner>
        </v-container>

        <v-virtual-scroll item-height="30" :items="audits" ref="scroll">
            <template v-if="!loading" v-slot:default="{item: audit}">
                <v-list-item :key="audit.id" :class="audit.class">
                    <span>{{ formatDate(audit.date) }}</span>
                    <span>{{ audit.actingUserName }}</span>
                    <span>{{ audit.display }}</span>
                </v-list-item>
            </template>
        </v-virtual-scroll>
    </v-main>
</template>

<script>
    import * as DateUtils from '@/utils/dateUtils';
    import ShyProgress from '@/components/ShyProgress';
    import TheAppBar from '@/components/TheAppBar';
    import Vue from 'vue';

    const AUDIT_TYPES = {
        'event.create':         'Event created',
        'event.update':         'Event updated',
        'event.delete':         'Event deleted',
        'participation.create': 'Participation created',
        'participation.update': 'Participation updated',
        'participation.delete': 'Participation deleted',
    };

    export default {
        components: {
            ShyProgress,
            TheAppBar,
        },

        data() {
            return {
                loading: true,
            };
        },

        async created() {
            await this.$store.dispatch('fetchAuditLog', {userId: this.ownUserId});
            this.loading = false;
            Vue.nextTick(() => this.scrollToBottom());
        },

        computed: {
            audits() {
                let audits = this.$store.getters.audits;
                return audits.map((audit, i) => {
                    return {
                        ...audit,
                        display: this.getDisplayString(audit),
                        class:   i % 2 ? 'odd' : null,
                    };
                });
            },
        },

        watch: {
            tab() {
                Vue.nextTick(() => this.scrollToBottom());
            },
        },

        methods: {
            formatDate(date) {
                return DateUtils.isoDateTime(date);
            },

            scrollToBottom() {
                let element = this.$refs.scroll.$el;
                element.scrollTop = element.scrollHeight;
            },

            getDisplayString(audit) {
                let base = AUDIT_TYPES[audit.type] ?? audit.type;
                if (audit.type !== 'event.delete' && audit.eventName !== null) {
                    base += `, event "${audit.eventName}"`;
                }
                if (audit.affectedUserName !== null) {
                    base += `, affected user "${audit.affectedUserName}"`;
                }
                if (audit.details !== null) {
                    base += ` / ${audit.details}`;
                }
                return base;
            },
        },
    };
</script>

<style lang="scss" scoped>
    .v-virtual-scroll {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        height: auto;
    }

    .v-list-item {
        padding: 0.5ex 1em;
        height: 30px;
        min-height: auto;
        display: flex;
        max-width: 1200px;
        margin: 0 auto;
        font-size: 11pt;

        & > span {
            display: block;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        & > span:nth-child(1) {
            flex: 1 0 150px;
        }

        & > span:nth-child(2) {
            flex: 2 0 100px;
        }

        & > span:nth-child(3) {
            flex: 20 0 200px;
        }
    }

    .v-virtual-scroll__item {
        .odd {
            background: #f5f5f5;
        }
    }
</style>
