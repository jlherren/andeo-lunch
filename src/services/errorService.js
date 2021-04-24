/**
 * Dispatches errors to registered handlers
 */
export class ErrorService {
    // We could pull in rxjs to implement this, but it's not really worth it for just one class
    static instance = new ErrorService();

    /**
     * Create a new error service
     */
    constructor() {
        this.nextId = 1;
        this.handlers = {};
    }

    /**
     * Register an error handler.  Returns a function to unregister again.
     *
     * @param {function(error: Error)} callback
     * @return {function()}
     */
    register(callback) {
        let id = this.nextId++;
        this.handlers[id] = callback;
        return () => {
            delete this.handlers[id];
        };
    }

    /**
     * Dispatch an error
     *
     * @param {Error} error
     */
    onError(error) {
        for (let handler of Object.values(this.handlers)) {
            handler(error);
        }
    }
}
