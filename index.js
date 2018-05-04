import fetch from 'node-fetch'
import Busboy from 'busboy'
const fs = require('fs')
var inspect = require('util').inspect

/*
curl -X POST \
  http://dev.box.marm.altarix.org/file/get \
  -H 'Cache-Control: no-cache' \
  -H 'Content-Type: application/json' \
  -H 'Postman-Token: a392e463-b669-40c0-b6cb-2eefd7aff84b' \
  -H 'X-Marm-Version: 3.0.0' \
  -H 'X-Project-Version: v1d1' \
  -H 'x-marm-token: blackhole_dev_' \
  -d '[
  {
    "id": "5b467137-0523-430b-a99c-bd0d063d528b"
  }
]'
*/


const body = [{
  "id": "5b467137-0523-430b-a99c-bd0d063d528b"
}]

fetch('http://dev.box.marm.altarix.org/file/get', {
  method: 'POST',
  body: JSON.stringify(body),
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    'Postman-Token': 'a392e463-b669-40c0-b6cb-2eefd7aff84b',
    'X-Marm-Version': '3.0.0',
    'X-Project-Version': 'v1d1',
    'x-marm-token': 'blackhole_dev_'
  },
  compress: true
})
  .then(res => {

    console.log("CONTENT_TYPE", res.headers.get('content-type'));

    const headers = {}
    headers['content-type'] = res.headers.get('content-type')

    // дескрипторы файлов
    const fd = {}

    var busboy = new Busboy({ headers })

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
      console.log('File [' + fieldname + ']: filename: ' + filename + ', encoding: ' + encoding + ', mimetype: ' + mimetype)

      fd[filename] = fs.openSync(filename, 'a')

      file.on('data', data => {
        console.log('File ' + filename + ' got ' + data.length + ' bytes')

        if (fd[filename]) {
          const enc = encoding === 'utf8' ? encoding : null
          fs.appendFileSync(fd[filename], data, enc)
        }
      })

      file.on('end', () => {
        console.log('File ' + filename + ' Finished')

        if (fd[filename]) {
          fs.closeSync(fd[filename]);
          delete fd[filename]
        }
      });
    })

    busboy.on('field', (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) => {
      console.log('Field [' + fieldname + ']: value: ' + inspect(val))
    })

    busboy.on('finish', () => {
      console.log('Done parsing form!');
      return Promise.resolve(JSON.stringify({ success: true }))
    })

    busboy.on('error', error => {
      console.error('Shit happens...', error)
    })

    res.body.pipe(busboy)
  })
  .then(json => console.log(json))
  .catch(error => console.error(error))
