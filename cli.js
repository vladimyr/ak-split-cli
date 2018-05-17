'use strict';

const {
  getStations,
  getTravelDates,
  getTimetable,
  Type
} = require('./client');
const { getDateStr, formatDate, normalize } = require('./helpers');
const argv = require('minimist')(process.argv.slice(2));
const chalk = require('chalk');
const fuzzysearch = require('fuzzysearch');
const inquirer = require('inquirer');
const pkg = require('./package.json');
inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));

const flag = (argv, short, long) => ({ [long]: (short && argv[short]) || argv[long] });
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
    -w, --web      Show data using web browser                         [boolean]
    -h, --help     Show help                                           [boolean]
    -v, --version  Show version number                                 [boolean]

  Homepage:     {green ${pkg.homepage}}
  Report issue: {green ${pkg.bugs.url}}
`;

program().catch(err => { throw err; });

async function program(options = getOptions(argv)) {
  const {
    version: showVersion,
    help: showHelp
  } = options;

  if (showVersion) return console.log(pkg.version);
  if (showHelp) return console.log(help);

  const type = await selectType();
  const [stations, travelDates] = await Promise.all([
    getStations(type),
    getTravelDates(type)
  ]);
  const travelDate = await selectDate(travelDates);
  const station = await selectStation(stations, type);
  const timetable = await getTimetable(type, station, travelDate);

  console.log();
  console.log(jsonify(timetable));
}

function getOptions(argv) {
  const options = {
    ...flag(argv, 'h', 'help'),
    ...flag(argv, 'v', 'version')
  };
  return options;
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
