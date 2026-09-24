import assert from 'node:assert/strict';
import test from 'node:test';
import { distanceMeters, getRoutePrefix, getRouteSampler, toCoordinate } from '../src/utils/coordinates.js';

test('toCoordinate normalizes array and AMap-like points', () => {
  assert.deepEqual(toCoordinate([120.98, 31.35, 100]), [120.98, 31.35]);
  assert.deepEqual(toCoordinate({ toArray: () => [120.99, 31.36] }), [120.99, 31.36]);
  assert.deepEqual(toCoordinate({ getLng: () => 121, getLat: () => 31.4 }), [121, 31.4]);
  assert.equal(toCoordinate(null), null);
});

test('distanceMeters returns a positive geographic distance', () => {
  const distance = distanceMeters([120.98, 31.35], [120.99, 31.36]);
  assert.ok(distance > 1000 && distance < 2000);
});

test('getRouteSampler interpolates along a route', () => {
  const sampler = getRouteSampler([[120.98, 31.35], [120.99, 31.36], [121, 31.36]]);
  assert.ok(sampler.totalDistance > 0);
  assert.deepEqual(sampler.sample(0), [120.98, 31.35]);
  assert.deepEqual(sampler.sample(1), [121, 31.36]);
  const midpoint = sampler.sample(0.5);
  assert.ok(midpoint[0] > 120.98 && midpoint[0] < 121);
});

test('getRoutePrefix reveals a route by distance', () => {
  const route = [[120.98, 31.35], [120.99, 31.35], [121, 31.35]];
  assert.deepEqual(getRoutePrefix(route, 0), [[120.98, 31.35]]);
  assert.deepEqual(getRoutePrefix(route, 1), route);
  const midpoint = getRoutePrefix(route, 0.5);
  assert.equal(midpoint.length, 2);
  assert.ok(midpoint[1][0] > 120.98 && midpoint[1][0] < 121);
});
