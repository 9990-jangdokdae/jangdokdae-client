import assert from "node:assert/strict";
import test from "node:test";
import {
  clampPage,
  getOffsetForPage,
  getPaginationPages,
  normalizePageParam,
} from "./pagination.js";

test("normalizes missing or invalid page params to page 1", () => {
  assert.equal(normalizePageParam(undefined), 1);
  assert.equal(normalizePageParam(""), 1);
  assert.equal(normalizePageParam("abc"), 1);
  assert.equal(normalizePageParam("0"), 1);
  assert.equal(normalizePageParam("-3"), 1);
});

test("normalizes positive integer page params", () => {
  assert.equal(normalizePageParam("1"), 1);
  assert.equal(normalizePageParam("7"), 7);
  assert.equal(normalizePageParam(["3", "4"]), 3);
});

test("clamps pages to available page range", () => {
  assert.equal(clampPage(1, 0), 1);
  assert.equal(clampPage(9, 0), 1);
  assert.equal(clampPage(0, 12), 1);
  assert.equal(clampPage(13, 12), 12);
  assert.equal(clampPage(6, 12), 6);
});

test("calculates offset from one-based page number", () => {
  assert.equal(getOffsetForPage(1, 10), 0);
  assert.equal(getOffsetForPage(3, 10), 20);
});

test("returns at most five page numbers around the current page", () => {
  assert.deepEqual(getPaginationPages({ currentPage: 1, totalPages: 10 }), [1, 2, 3, 4, 5]);
  assert.deepEqual(getPaginationPages({ currentPage: 4, totalPages: 10 }), [2, 3, 4, 5, 6]);
  assert.deepEqual(getPaginationPages({ currentPage: 10, totalPages: 10 }), [6, 7, 8, 9, 10]);
  assert.deepEqual(getPaginationPages({ currentPage: 2, totalPages: 3 }), [1, 2, 3]);
});
