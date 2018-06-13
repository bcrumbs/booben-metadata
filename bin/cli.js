#!/usr/bin/env node

'use strict';

const co = require('co');
const fs = require('mz/fs');
const path = require('path');
const minimist = require('minimist');
const gatherMetadata = require('../lib/gatherMetadata');

co(function* () {
  const argv = minimist(process.argv.slice(2));
  if (!argv._.length) throw new Error('Path is required');
  
  const libraryPath = path.resolve(process.cwd(), argv._[0]);
  
  if (!(yield fs.exists(libraryPath))) {
    throw new Error(`${libraryPath} does not exist`);
  }
  
  const stats = yield fs.stat(libraryPath);
  
  if (!stats.isDirectory()) {
    throw new Error(`${libraryPath} is not a directory`);
  }
  
  yield gatherMetadata(libraryPath);
  console.log(`Metadata is OK in ${libraryPath}`);
  process.exit();
}).catch(err => {
  let message = err.message || err.toString();
  if (err.validationErrors) {
    message +=
      `\nValidation errors:\n${
        err.validationErrors.map(e => JSON.stringify(e)).join('\n')}`;
  }
  
  console.error(message);
  process.exit(1);
});
