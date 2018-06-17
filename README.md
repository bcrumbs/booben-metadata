# Metadata reading and validation for Booben
## Installation
`npm install --save-dev booben-metadata`
## CLI validator
`validate-booben-meta path/to/dir`
## API usage
```ecmascript 6
const co = require('co');
const { gatherMetadata } = require('booben-metadata');

co(function* () {
  const meta = yield gatherMetadata('path/to/dir');
  // Do something with metadata
}).catch(err => {
  // Deal with error
});
```
