/**
 * Dispatches events to registered handlers
 */
export class EventService {
    // We could pull in rxjs to implement this, but it's not really worth it for just one class

    static error = new EventService();

    static systemMessage = new EventService();

    /**
     * Create a new error service
     */
    constructor() {
        this.nextId = 1;
        this.handlers = {};
    }

    /**
     * Register an event handler.  Returns a function to unregister the handler again.
     *
     * @param {function(payload: any)} handler
     * @return {function(): void}
     */
    register(handler) {
        let id = this.nextId++;
        this.handlers[id] = handler;
        return () => {
            delete this.handlers[id];
        };
    }

    /**
     * Dispatch an error
     *
     * @param {any} payload
     */
    dispatch(payload) {
        for (let handler of Object.values(this.handlers)) {
            handler(payload);
        }
    }
}
