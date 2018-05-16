'use strict';

const cheerio = require('cheerio');
const r = require('got');
const urlJoin = require('url-join');

const apiKey = 'pass1pass2';
const baseUrl = 'http://www.ak-split.hr/';

const Type = {
  Arrival: Symbol('arrival'),
  Departure: Symbol('departure')
};

const route = (station, type) => {
  if (type === Type.Departure) return { id1: 1, id2: station.id };
  return { id1: station.id, id2: 1 };
};
const today = () => new Date().toISOString().split('T')[0];
const timetableFormUrl = type => {
  const path = type === Type.Arrival ? '/dolasci-u-split' : '/polasci-iz-splita';
  return urlJoin(baseUrl, path);
};
const without = (stations, name) => stations.filter(it => {
  return it.name.toLowerCase() !== name.toLowerCase();
});

module.exports = {
  getArrivals: getTimetable.bind(null, Type.Arrival),
  getDepartures: getTimetable.bind(null, Type.Departure),
  getStations,
  getTimetable,
  getTravelDates,
  Type
};

async function getStations(type = Type.Departure) {
  const url = timetableFormUrl(type);
  const { body } = await r.get(url);
  return parseStations(body, type);
}

async function getTravelDates(type = Type.Departure) {
  const url = timetableFormUrl(type);
  const { body } = await r.get(url);
  return parseTravelDates(body, type);
}

async function getTimetable(type, station, date = today()) {
  const url = urlJoin(baseUrl, '/ak-api');
  const query = Object.assign({ 'api-key': apiKey, date }, route(station, type));
  const { body } = await r.get(url, { query, json: true });
  return body;
}

function parseStations(html, type) {
  const $ = cheerio.load(html);
  const name = type === Type.Arrival ? 'dolasci' : 'polasci';
  const stations = $(`#select_${name} option`).map((_, el) => ({
    id: parseInt($(el).attr('value'), 10),
    name: $(el).text().trim()
  })).get();
  if (type === Type.Departure) return without(stations, 'Split');
  return stations;
}

function parseTravelDates(html) {
  const $ = cheerio.load(html);
  return $('#select_date option').map((_, el) => $(el).attr('value')).get();
}
