const express = require('express')
const multer  = require('multer')
const app = express()
const path = require('path')

const request = require('request')
const imagemin = require('imagemin')
const imageminPngquant = require('imagemin-pngquant')
var upload = multer()

var plateToPlateInformation = require('./ezyreg.js')

// app.get('/', (req, res) => res.send('Hello World!'))
app.use('/', express.static(path.join(__dirname, 'static')))

var compressImageBuffer = function(buffer, quality) {
    return new Promise(function(resolve, reject) {
        imagemin.buffer(buffer, {plugins: [imageminPngquant({quality:quality})]})
            .then(function(buffer) {
                resolve(buffer) 
            })
            .catch(function(error){
                reject(error)
            })
    })
}

var base64ImageBuffer = function(buffer) {
    return new Promise(function(resolve, reject) {
        try {
            var base64 = buffer.toString("base64")
            resolve(base64);
        } catch(ex) {
            reject(null);
        }
    })
}

var base64ToPlate = function(base64) {
    return new Promise(function(resolve, reject) {
        var secret_key = 'sk_8af55fbf65cf9bcefd219b6a';
        var url = 'https://api.openalpr.com/v2/recognize_bytes?limit=1&recognize_vehicle=0&country=au&secret_key=';
        request.post({'url':url + secret_key, body: base64}, 
            function(error, response, body) {
                try {
                    let json = JSON.parse(body)
                    resolve({
                        number: json["results"][0]["plate"],
                        confidence: json["results"][0]["confidence"]                        
                    })
                } catch (ex) {
                    resolve(null)
                }
            }
        )
    })
}

app.post('/scan', upload.single('file'), function (req, res, next) {
    compressImageBuffer(req.file.buffer, '50')
        .then(base64ImageBuffer)
        .then(base64ToPlate)
        .then(plateToPlateInformation)
        .then(function(plateInformation) {
            res.json(plateInformation)
        })
        .catch(function() {
            res.status(500).send()
        })
})

app.get('/reg/:plate', function(req, res) {
    plateToPlateInformation({"number":req.params.plate})
        .then(function(plateInformation) {
            res.json(plateInformation)
        })
        .catch(function() {
            res.status(500).send()
        })
});

app.listen(8080, '0.0.0.0', () => console.log('Example app listening on port 8080!'))