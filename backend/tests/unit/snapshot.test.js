import * as Utils from '../../src/utils.ts';
import {expect} from '../chai-setup.ts';

describe('Snapshot diffs', () => {
    it('undefined with undefined', () => {
        let diff = Utils.snapshotDiff(undefined, undefined);
        expect(diff).to.be.undefined();
    });

    it('undefined with null', () => {
        let diff = Utils.snapshotDiff(undefined, null);
        expect(diff).to.be.undefined();
    });

    it('null with undefined', () => {
        let diff = Utils.snapshotDiff(null, undefined);
        expect(diff).to.be.undefined();
    });

    it('null with null', () => {
        let diff = Utils.snapshotDiff(null, null);
        expect(diff).to.be.undefined();
    });

    it('{} with {}', () => {
        let diff = Utils.snapshotDiff({}, {});
        expect(diff).to.be.undefined();
    });

    it('{} with null', () => {
        let diff = Utils.snapshotDiff({}, null);
        expect(diff).to.be.undefined();
    });

    it('{} with undefined', () => {
        let diff = Utils.snapshotDiff({}, undefined);
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
        let date = new Date('2021-01-01T01:02:03Z');
        let diff = Utils.snapshotDiff(date, date);
        expect(diff).to.be.undefined();
    });

    it('Identical dates', () => {
        let diff = Utils.snapshotDiff(new Date('2021-01-01T01:02:03Z'), new Date('2021-01-01T01:02:03Z'));
        expect(diff).to.be.undefined();
    });

    it('Different dates', () => {
        let diff = Utils.snapshotDiff(new Date('2021-01-01T01:02:03Z'), new Date('2021-02-01T01:02:03Z'));
        expect(diff).to.deep.equal([new Date('2021-01-01T01:02:03Z'), new Date('2021-02-01T01:02:03Z')]);
    });

    it('Date and null', () => {
        let diff = Utils.snapshotDiff(new Date('2021-01-01T01:02:03Z'), null);
        expect(diff).to.deep.equal([new Date('2021-01-01T01:02:03Z'), null]);
    });

    it('null and Date', () => {
        let diff = Utils.snapshotDiff(null, new Date('2021-01-01T01:02:03Z'));
        expect(diff).to.deep.equal([null, new Date('2021-01-01T01:02:03Z')]);
    });
});
