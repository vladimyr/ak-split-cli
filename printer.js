'use strict';

const { Type } = require('./client');
const chalk = require('chalk');
const Table = require('easy-table');
const reRecord = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;

const isString = arg => typeof arg === 'string';
const pad = num => (num + '').padStart(2, 0);

const Label = {
  [Type.Departure]: 'Departure',
  [Type.Arrival]: 'Arrival'
};

module.exports = function print(data, type) {
  const table = new Table();
  data.forEach(entry => {
    table.cell(formatLabel('Departure', type), formatTimeRecord(entry.polazak));
    table.cell(formatLabel('Arrival', type), formatTimeRecord(entry.dolazak));
    table.cell(chalk.whiteBright('Duration'), formatTimeRecord(entry.trajanje));
    table.cell(chalk.whiteBright('Position'), isString(entry.peron) ? entry.peron : 'N/A');
    table.cell(chalk.whiteBright('Operator'), entry.txtprijevoznik);
    table.newRow();
  });
  console.log(table.toString());
};

function formatLabel(name, type) {
  if (name === Label[type]) return chalk.bgCyan.whiteBright(name);
  return chalk.whiteBright(name);
}

function formatTimeRecord(record) {
  const match = record.match(reRecord);
  if (!match) return '';
  const [, hours = 0, minutes = 0] = match;
  return pad(hours) + ':' + pad(minutes);
}
