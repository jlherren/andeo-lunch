<template>
    <svg xmlns="http://www.w3.org/2000/svg" :width="width" :height="height" fill="#e0e0e0" v-if="flakes.length">
        <circle v-for="flake of flakes" :key="flake.id"
                :r="flake.size" :cx="flake.x" :cy="flake.y"
        />
    </svg>
</template>

<script>
    let nextId = 1;

    class Flake {
        constructor(parent) {
            this.id = nextId++;
            this.init(parent, false);
        }

        init(parent, top) {
            this.x = Math.random() * parent.width;
            this.y = top ? 0 : Math.random() * parent.height;
            this.size = Math.random() + 0.25;
            this.vx = (Math.random() - 0.5) * 0.025;
            this.vy = (Math.random() + this.size) * 0.05;
        }

        tick(delta, parent) {
            // This uses many temporary variables to avoid excessive property setters/getters, since they are reactive.
            let newX = this.x + (this.vx + parent.wind) * delta;
            let newY = this.y + this.vy * delta;
            this.y = newY;
            if (newY > parent.height) {
                return false;
            }
            let parentWidth = parent.width;
            if (newX < 0) {
                newX += parentWidth;
            } else if (newX >= parentWidth) {
                newX -= parentWidth;
            }
            this.x = newX;
            return true;
        }
    }

    export default {
        name: 'SnowOverlay',

        data() {
            return {
                nFlakes:        0,
                flakes:         [],
                animationTimer: null,
                refreshTimer:   null,
                lastTimestamp:  null,
                wind:           0.0,
                width:          window.innerWidth,
                height:         window.innerHeight,
            };
        },

        mounted() {
            if (!this.refreshTimer) {
                this.refreshTimer = setInterval(() => this.refresh(), 60000);
                this.refresh();
            }
            window.addEventListener('resize', this.updateSize);
            this.updateSize();
        },

        beforeDestroy() {
            // Note: Unlike other cleanup hooks, this one also gets called during hot-reload.
            this.cancelAnimationFrame();
            if (this.refreshTimer) {
                clearInterval(this.refreshTimer);
                this.refreshTimer = null;
            }
            window.removeEventListener('resize', this.updateSize);
        },

        methods: {
            requestAnimationFrame() {
                if (this.animationTimer) {
                    return;
                }
                this.animationTimer = window.requestAnimationFrame(timestamp => {
                    this.animationTimer = null;
                    this.tick(timestamp);
                });
            },

            cancelAnimationFrame() {
                if (!this.animationTimer) {
                    return;
                }
                window.cancelAnimationFrame(this.animationTimer);
                this.animationTimer = null;
            },

            updateSize() {
                this.width = window.innerWidth;
                this.height = window.innerHeight;
            },

            style(flake) {
                return {
                    top:  `${flake.y}px`,
                    left: `${flake.x}px`,
                };
            },

            tick(timestamp) {
                if (this.lastTimestamp) {
                    let delta = timestamp - this.lastTimestamp;
                    if (delta > 250) {
                        // Avoid huge jumps, there's no need to catch up if the window was in the background for a while
                        delta = 0;
                    }
                    let t = Date.now() - 1701181319185;
                    this.wind = (Math.sin(t * 0.00001) + Math.sin(t * 0.000015)) * 0.075;
                    let nDelete = Math.max(0, this.flakes.length - this.nFlakes);
                    for (let i = 0; i < this.flakes.length; i++) {
                        let flake = this.flakes[i];
                        if (flake.tick(delta, this)) {
                            continue;
                        }
                        if (nDelete === 0 || Math.random() > 0.5) {
                            flake.init(this, true);
                        } else {
                            this.flakes.splice(i, 1);
                            i--;
                            nDelete--;
                        }
                    }
                    if (this.flakes.length < this.nFlakes) {
                        this.flakes.push(new Flake(this));
                    }
                }
                this.lastTimestamp = timestamp;
                if (this.nFlakes > 0 || this.flakes.length) {
                    this.requestAnimationFrame();
                }
            },

            async refresh() {
                await this.$store().fetchSnowfall();
                this.updateNFlakes(this.$store().nSnowFlakes);
            },

            updateNFlakes(nFlakes) {
                this.nFlakes = nFlakes;
                if (nFlakes > 0) {
                    this.requestAnimationFrame();
                }
            },
        },
    };
</script>

<style lang="scss" scoped>
    svg {
        position: fixed;
        top: 0;
        left: 0;
        z-index: 1000;
        pointer-events: none;
    }
</style>
