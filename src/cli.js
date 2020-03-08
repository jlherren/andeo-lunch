'use strict';

const readline = require('readline');

/**
 * Simple CLI interface for prompting
 */
class Cli {
    constructor() {
        this.rl = readline.createInterface({
            input:  process.stdin,
            output: process.stdout,
        });
    }

    /**
     * @param {string} question
     * @returns {Promise<string>}
     */
    question(question) {
        return new Promise(resolve => {
            this.rl.question(question, answer => {
                resolve(answer);
            });
        });
    }

    /**
     * Close the CLI
     */
    close() {
        this.rl.close();
    }
}

module.exports = Cli;
