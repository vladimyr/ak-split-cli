'use strict';

const dicaritics = require('diacritics');

const removeDiacritics = str => dicaritics.remove(str.replace(/đ/g, 'dj'));
const normalize = str => removeDiacritics(str.toLowerCase().trim());

const getDateStr = date => date.toISOString().split('T')[0];
const pad = num => (num + '').padStart(2, 0);
const formatDate = date => {
  return pad(date.getDate()) + '.' + pad(date.getMonth() + 1) + '.';
};

module.exports = { normalize, formatDate, getDateStr };
