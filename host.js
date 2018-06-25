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
    console.log("Compressing Image Buffer")
    console.log("Buffer size "+buffer.length/1024+"kb")
    return new Promise(function(resolve, reject) {
        imagemin.buffer(buffer, {plugins: [imageminPngquant({quality:quality})]})
            .then(function(buffer) {
                console.log("Compressing Image Buffer, resolve()")
                resolve(buffer)
            })
            .catch(function(error){
                console.log("Compressing Image Buffer, reject()")
                reject(error)
            })
    })
}

var imageBufferToBase64 = function(buffer) {
    console.log("Converting Image Buffer to Base64")
    console.log("Buffer size "+buffer.length/1024+"kb")
    return new Promise(function(resolve, reject) {
        try {
            var base64 = buffer.toString("base64")
            console.log("Converting Image Buffer to Base64, resolve()")
            resolve(base64);
        } catch(ex) {
            console.log("Converting Image Buffer to Base64, reject()")
            reject(null);
        }
    })
}

var base64ToPlate = function(base64) {
    console.log("Converting Base64 Image to Plate Recognition")
    console.log(base64)
    return new Promise(function(resolve, reject) {
        var secret_key = process.env.SECRET_KEY || '';
        var url = 'https://api.openalpr.com/v2/recognize_bytes?limit=1&recognize_vehicle=0&country=au&secret_key=';
        request.post({'url':url + secret_key, body: base64},
            function(error, response, body) {
                try {
                    let json = JSON.parse(body)
                    console.log("Converting Base64 Image to Plate Recognition, resolve()")
                    console.log("Response: "+body)
                    resolve({
                        number: json["results"][0]["plate"],
                        confidence: json["results"][0]["confidence"]
                    })
                } catch (ex) {
                    console.log("Converting Base64 Image to Plate Recognition, resolve(null)")
                    resolve(null)
                }
            }
        )
    })
}

app.post('/scan', upload.single('file'), function (req, res, next) {
    compressImageBuffer(req.file.buffer, '50')
        .then(imageBufferToBase64)
        .then(base64ToPlate)
        .then(plateToPlateInformation)
        .then(function(plateInformation) {
            if (plateInformation) {
                res.json(plateInformation)
            } else {
                res.status(404).send()
            }
        })
        .catch(function(error) {
            console.log("/scan 500")
            console.error(error)
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

var p = process.env.PORT || 8080;
app.listen(p, () => console.log('Example app listening on port '+p))