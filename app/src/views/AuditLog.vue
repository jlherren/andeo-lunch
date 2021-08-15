<template>
    <v-main>
        <the-app-bar sub-page>
            Audit log
            <template v-slot:buttons>
                <v-btn icon @click.prevent="refresh()">
                    <v-icon>{{ $icons.refresh }}</v-icon>
                </v-btn>
            </template>
        </the-app-bar>

        <shy-progress v-if="loading"/>

        <v-container v-if="!loading && audits.length === 0">
            <v-banner elevation="2" single-line :icon="$icons.information">
                No audit entries
            </v-banner>
        </v-container>

        <v-virtual-scroll :item-height="$vuetify.breakpoint.smAndDown ? 60 : 30" :items="audits" ref="scroll" bench="1">
            <template v-slot:default="{item: audit}">
                <v-list-item :key="audit.id" :class="audit.class">
                    <span>{{ formatDate(audit.date) }}</span>
                    <span>{{ audit.actingUserName }}</span>
                    <span>{{ audit.display }}</span>
                    <span>
                        <v-chip small outlined label v-for="element of audit.details" :key="element.name">
                            {{ element.name }} <b>{{ element.value }}</b>
                        </v-chip>
                    </span>
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
        'transfer.create':      'Transfer created',
        'transfer.update':      'Transfer updated',
        'transfer.delete':      'Transfer deleted',
    };

    const VALUES = {
        participationType: 'Type',
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
            await this.$store.dispatch('fetchAuditLog');
            this.loading = false;
            this.scrollToBottom();
        },

        computed: {
            audits() {
                let audits = this.$store.getters.audits;
                return audits.map((audit, i) => {
                    return {
                        ...audit,
                        display: AUDIT_TYPES[audit.type] ?? audit.type,
                        details: this.getDetails(audit),
                        class:   i % 2 ? 'odd' : null,
                    };
                });
            },
        },

        methods: {
            formatDate(date) {
                return DateUtils.isoDateTime(date);
            },

            scrollToBottom() {
                Vue.nextTick(() => {
                    let element = this.$refs.scroll.$el;
                    element.scrollTop = element.scrollHeight;
                });
            },

            getDetails(audit) {
                let parts = [];
                if (audit.type !== 'event.delete' && audit.eventName !== null) {
                    parts.push({
                        name:  'Event',
                        value: audit.eventName,
                    });
                }
                if (audit.affectedUserName !== null) {
                    parts.push({
                        name:  'Affected user',
                        value: audit.affectedUserName,
                    });
                }
                if (audit.values) {
                    for (let key in audit.values) {
                        parts.push({
                            name:  VALUES[key] ?? key,
                            value: audit.values[key],
                        });
                    }
                }
                return parts;
            },

            async refresh() {
                this.loading = true;
                await this.$store.dispatch('fetchAuditLog', true);
                this.loading = false;
                this.scrollToBottom();
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
        align-items: flex-start;
        max-width: 1200px;
        margin: 0 auto;
        font-size: 14px;

        & > span {
            display: block;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        & > span:nth-child(1) {
            flex: 0 0 150px;
            color: gray;
        }

        & > span:nth-child(2) {
            flex: 0 0 120px;
            font-weight: bold;
        }

        & > span:nth-child(3) {
            flex: 1 0 100px;
        }

        & > span:nth-child(4) {
            flex: 2 0 200px;
        }
    }

    .v-virtual-scroll__item {
        .theme--light.odd {
            background: #f5f5f5;
        }

        .theme--dark.odd {
            background: #000000;
        }
    }

    .v-chip {
        margin-right: 0.5em;
        color: gray !important;

        b {
            margin-left: 0.33em;
        }
    }

    .theme--light.v-chip {
        b {
            color: black;
        }
    }

    .theme--dark.v-chip {
        b {
            color: white;
        }
    }

    @media #{map-get($display-breakpoints, 'sm-and-down')} {
        .v-list-item {
            height: 60px;
            flex-wrap: wrap;

            & > span:nth-child(1) {
                flex: 0 0 35%;
            }

            & > span:nth-child(2) {
                flex: 0 0 25%;
            }

            & > span:nth-child(3) {
                flex: 0 0 40%;
            }

            & > span:nth-child(4) {
                flex: 1 0 100%;
            }

            .v-chip {
                padding: 0 0.5em;
            }
        }
    }
</style>
