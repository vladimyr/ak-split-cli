#!/usr/bin/env node

'use strict';

const {
  getStations,
  getTravelDates,
  getTimetable,
  Type
} = require('./client');
const { getDateStr, formatDate, normalize } = require('./helpers');
const chalk = require('chalk');
const fuzzysearch = require('fuzzysearch');
const inquirer = require('inquirer');
const pkg = require('./package.json');
const print = require('./printer');
inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));

const jsonify = obj => JSON.stringify(obj, null, 2);
const search = (needle, haystack) => {
  return fuzzysearch(needle.toLowerCase(), haystack.toLowerCase());
};
const toDate = str => {
  const [day, month, year] = str.split('.');
  return new Date(Date.UTC(year, month - 1, day));
};

const name = Object.keys(pkg.bin)[0];
const help = chalk`
  {bold ${name}} v${pkg.version}

  Usage:
    $ ${name}

  Options:
    -j, --json     Output data in JSON format                          [boolean]
    -h, --help     Show help                                           [boolean]
    -v, --version  Show version number                                 [boolean]

  Homepage:     {green ${pkg.homepage}}
  Report issue: {green ${pkg.bugs.url}}
`;

const options = require('minimist-options')({
  help: { type: 'boolean', alias: 'h' },
  version: { type: 'boolean', alias: 'v' },
  json: { type: 'boolean', alias: 'j' }
});
const argv = require('minimist')(process.argv.slice(2), options);

program(argv).catch(err => { throw err; });

async function program(flags) {
  if (flags.version) return console.log(pkg.version);
  if (flags.help) return console.log(help);

  const type = await selectType();
  const [stations, travelDates] = await Promise.all([
    getStations(type),
    getTravelDates(type)
  ]);
  const travelDate = await selectDate(travelDates);
  const station = await selectStation(stations, type);
  const timetable = await getTimetable(type, station, travelDate);

  console.log();
  if (flags.json) return console.log(jsonify(timetable));
  print(timetable, type);
}

async function selectType() {
  const { type } = await inquirer.prompt([{
    type: 'list',
    name: 'type',
    message: 'Choose travel type',
    choices: [{
      name: 'Arrival',
      value: Type.Arrival
    }, {
      name: 'Departure',
      value: Type.Departure
    }]
  }]);
  return type;
}

async function selectStation(stations, type) {
  stations = stations.map(station => {
    station.value = station;
    station.normalizedName = normalize(station.name);
    return station;
  });
  const message = 'Select ' + (type === Type.Arrival ? 'start' : 'destination');
  const { city } = await inquirer.prompt([{
    type: 'autocomplete',
    name: 'city',
    message,
    pageSize: 10,
    source: async (_, input) => {
      if (!input) return stations;
      return stations.filter(it => search(normalize(input), it.normalizedName));
    }
  }]);
  return city;
}

async function selectDate(dates) {
  const choices = dates.map(str => {
    const date = toDate(str);
    const name = formatDate(date);
    return { name, value: getDateStr(date) };
  });
  choices.push(new inquirer.Separator());
  const { date } = await inquirer.prompt([{
    type: 'list',
    name: 'date',
    message: 'Choose travel date',
    choices
  }]);
  return date;
}
