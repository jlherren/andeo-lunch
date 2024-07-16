import {Writable} from 'stream';
import readline from 'readline';

let mutableStdout = new Writable({
    write: function (chunk, encoding, callback) {
        if (!this.muted) {
            process.stdout.write(chunk, encoding);
        }
        callback();
    },
});

/**
 * Simple CLI interface for prompting
 */
export class Cli {
    constructor() {
        this.rl = readline.createInterface({
            input:    process.stdin,
            output:   mutableStdout,
            terminal: true,
        });
    }

    /**
     * @param {string} question
     * @return {Promise<string>}
     */
    question(question) {
        return new Promise(resolve => {
            this.rl.question(question, answer => {
                resolve(answer);
            });
        });
    }

    /**
     * @param {string} question
     * @return {Promise<string>}
     */
    password(question) {
        return new Promise(resolve => {
            this.rl.question(question, answer => {
                console.log();
                mutableStdout.muted = false;
                resolve(answer);
            });
            mutableStdout.muted = true;
        });
    }

    /**
     * Close the CLI
     */
    close() {
        this.rl.close();
    }
}
