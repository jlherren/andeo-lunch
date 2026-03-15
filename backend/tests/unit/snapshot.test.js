import * as Utils from '../../src/utils.js';
import {expect} from '../chai-setup.js';

describe('Snapshot diffs', () => {
    it('null with null', () => {
        let diff = Utils.snapshotDiff(null, null);
        expect(diff).to.be.undefined();
    });

    it('{} with {}', () => {
        let diff = Utils.snapshotDiff({}, {});
        expect(diff).to.be.undefined();
    });

    it('Empty on the left', () => {
        let diff = Utils.snapshotDiff({}, {a: 1, b: {c: 2}});
        expect(diff).to.deep.equal({a: [null, 1], b: {c: [null, 2]}});
    });

    it('Empty on the right', () => {
        let diff = Utils.snapshotDiff({a: 1, b: {c: 2}}, {});
        expect(diff).to.deep.equal({a: [1, null], b: {c: [2, null]}});
    });

    it('Nested identical', () => {
        let value = {a: 1, b: {c: 2}};
        let diff = Utils.snapshotDiff(value, value);
        expect(diff).to.be.undefined();
    });

    it('Nested diff', () => {
        let diff = Utils.snapshotDiff({a: 1, b: {c: 2}}, {a: 2, b: {c: 3}});
        expect(diff).to.deep.equal({a: [1, 2], b: {c: [2, 3]}});
    });

    it('Same dates', () => {
        let diff = Utils.snapshotDiff(new Date('2021-01-01T01:02:03Z'), new Date('2021-01-01T01:02:03Z'));
        expect(diff).to.be.undefined();
    });

    it('Different dates', () => {
        let diff = Utils.snapshotDiff(new Date('2021-01-01T01:02:03Z'), new Date('2021-02-01T01:02:03Z'));
        expect(diff).to.deep.equal([new Date('2021-01-01T01:02:03Z'), new Date('2021-02-01T01:02:03Z')]);
    });
});
