'use strict';

const { getStations, getTravelDates, Type } = require('./');
const test = require('tape');

const year = new Date().getFullYear();
const reDate = new RegExp(`^\\d{2}\\.\\d{2}\\.${year}$`);

const contains = (stations, name) => !!stations.find(it => it.name === name);
const isDate = arg => reDate.test(arg);
const isString = arg => typeof arg === 'string';
const isStation = obj => obj && Number.isFinite(obj.id) && isString(obj.name);
const toJSON = arg => JSON.stringify(arg);

test('Fetch stations', async t => {
  t.plan(2);
  const stations = await getStations(Type.Arrival);
  t.notEqual(stations.length, 0, `${stations.length} stations fetched`);
  t.comment(`stations: ${printArray(stations)}`);
  t.ok(isStation(stations[0]), 'stations have `id` and `name` properties');
});

test('Fetch destinations', async t => {
  t.plan(2);
  const stations = await getStations();
  t.notEqual(stations.length, 0, `${stations.length} stations fetched`);
  t.false(contains(stations, 'Split'), 'Split is not valid destination');
});

test('Fetch travel dates', async t => {
  t.plan(2);
  const dates = await getTravelDates();
  t.notEqual(dates.length, 0, `${dates.length} travel dates available`);
  t.comment(`dates: ${printArray(dates)}`);
  t.ok(isDate(dates[0]), 'travel dates have DD.MM.YYYY format');
});

function printArray(arr, limit = 3) {
  let members = arr.slice(0, limit).map(it => toJSON(it)).join(', ');
  if (limit < arr.length) members += '...' + toJSON(arr[arr.length - 1]);
  return '[' + members + ']';
}
