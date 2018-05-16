'use strict';

const cheerio = require('cheerio');
const r = require('got');
const urlJoin = require('url-join');

const baseUrl = 'http://www.ak-split.hr/';

const Type = {
  Arrival: Symbol('arrival'),
  Departure: Symbol('departure')
};

const timetableUrl = type => {
  const path = type === Type.Arrival ? '/dolasci-u-split' : '/polasci-iz-splita';
  return urlJoin(baseUrl, path);
};

const without = (stations, name) => stations.filter(it => {
  return it.name.toLowerCase() !== name.toLowerCase();
});

module.exports = {
  getTravelDates,
  getStations,
  Type
};

async function getStations(type = Type.Departure) {
  const url = timetableUrl(type);
  const { body } = await r.get(url);
  return parseStations(body, type);
}

async function getTravelDates(type = Type.Departure) {
  const url = timetableUrl(type);
  const { body } = await r.get(url);
  return parseTravelDates(body, type);
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
