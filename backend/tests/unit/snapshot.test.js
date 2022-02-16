'use strict';

const Utils = require('../../src/utils');

describe('Snapshot diffs', () => {
    it('null with null', () => {
        let diff = Utils.snapshotDiff(null, null);
        expect(diff).toBe(undefined);
    });

    it('{} with {}', () => {
        let diff = Utils.snapshotDiff({}, {});
        expect(diff).toBe(undefined);
    });

    it('Empty on the left', () => {
        let diff = Utils.snapshotDiff({}, {a: 1, b: {c: 2}});
        expect(diff).toEqual({a: [null, 1], b: {c: [null, 2]}});
    });

    it('Empty on the right', () => {
        let diff = Utils.snapshotDiff({a: 1, b: {c: 2}}, {});
        expect(diff).toEqual({a: [1, null], b: {c: [2, null]}});
    });

    it('Nested identical', () => {
        let value = {a: 1, b: {c: 2}};
        let diff = Utils.snapshotDiff(value, value);
        expect(diff).toBe(undefined);
    });

    it('Nested diff', () => {
        let diff = Utils.snapshotDiff({a: 1, b: {c: 2}}, {a: 2, b: {c: 3}});
        expect(diff).toEqual({a: [1, 2], b: {c: [2, 3]}});
    });

    it('Same dates', () => {
        let diff = Utils.snapshotDiff(new Date('2021-01-01T01:02:03Z'), new Date('2021-01-01T01:02:03Z'));
        expect(diff).toBe(undefined);
    });

    it('Different dates', () => {
        let diff = Utils.snapshotDiff(new Date('2021-01-01T01:02:03Z'), new Date('2021-02-01T01:02:03Z'));
        expect(diff).toEqual([new Date('2021-01-01T01:02:03Z'), new Date('2021-02-01T01:02:03Z')]);
    });
});
