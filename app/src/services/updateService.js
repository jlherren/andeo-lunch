/**
 * Dispatches update events
 */
export class UpdateService {
    static instance = new UpdateService();

    /**
     * Create a new error service
     */
    constructor() {
        this.handler = null;
    }

    /**
     * Register an update handler.  Returns a function to unregister again.
     *
     * @param {function()} callback
     * @returns {function()}
     */
    register(callback) {
        if (this.handler) {
            throw new Error('Cannot register a second update handler');
        }
        this.handler = callback;
        let released = false;
        return () => {
            if (released) {
                throw new Error('Cannot call release function again');
            }
            released = true;
            this.handler = null;
        };
    }

    /**
     * Dispatch an update notification
     *
     * @returns {boolean}
     */
    onUpdate() {
        if (!this.handler) {
            return false;
        }
        this.handler();
        return true;
    }
}
