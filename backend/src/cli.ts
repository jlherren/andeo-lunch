import {Writable} from 'stream';
import readline from 'readline';

class MutableStdout extends Writable {
    muted: boolean = false;

    _write(chunk: Uint8Array, encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
        if (!this.muted) {
            process.stdout.write(chunk, encoding);
        }
        callback();
    }
}

let mutableStdout = new MutableStdout();

/**
 * Simple CLI interface for prompting
 */
export class Cli {
    private rl: readline.Interface;

    constructor() {
        this.rl = readline.createInterface({
            input:    process.stdin,
            output:   mutableStdout,
            terminal: true,
        });
    }

    /**
     * Prompts the user with a question.
     */
    question(question: string): Promise<string> {
        return new Promise(resolve => {
            this.rl.question(question, answer => {
                resolve(answer);
            });
        });
    }

    /**
     * Prompts the user for a password securely.
     */
    password(question: string): Promise<string> {
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
     * Close the CLI interface.
     */
    close(): void {
        this.rl.close();
    }
}
