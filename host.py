import tornado.httpserver
import tornado.websocket
import tornado.ioloop
from tornado.concurrent import return_future
from tornado.gen import coroutine
from tornado.httputil import HTTPHeaders
import tornado.web
import socket
import json

import os
import sys
from bs4 import BeautifulSoup
import requests

def extract_car_data(data):
    try:
        print data

        for car in data.get("results",[]):
            plate = {
                "confidence": car.get("confidence"),
                "name": car.get("plate")
            }
            colour = car.get("vehicle",{}).get("color")[0] #{confidence, name}
            make = car.get("vehicle",{}).get("make")[0] #{confidence, name}
            body_type = car.get("vehicle",{}).get("body_type")[0] #{confidence, name}
            year = car.get("vehicle",{}).get("year")[0] #{confidence, name} (range)
            model = {
                "confidence": car.get("vehicle",{}).get("make_model")[0].get("confidence"),
                "name": "_".join(car.get("vehicle",{}).get("make_model")[0].get("name","").split("_")[1:])
            }

            obj = {
                "plate": plate,
                "colour": colour,
                "year": year,
                "body_type": body_type,
                "make": make,
                "model": model
            }
            print obj
            return obj
    except Exception as ex:
        print "{}".format(ex)
        return {}
    else:
        return {}

def extract_plate_data(reg):
    try:
        if not reg:
            return {}

        #create session
        s = requests.Session()

        #login
        url = "https://www.ecom.transport.sa.gov.au/et/checkRegistrationExpiryDate.do"
        r = s.get(url)

        #query
        url = "https://www.ecom.transport.sa.gov.au/et/cred_registration_details.do"
        data = {"plateNumber": reg.upper()}
        r = s.post(url, data)
        soup = BeautifulSoup(r.text, 'html.parser')

        #get data
        def clean(str):
            return str.encode('utf-8').replace('\xc2\xa0', '_').lower().strip()
        domData = dict(zip(soup.find_all('td', {'class':'fieldTitle'}),soup.find_all('td', {'class':'fieldSpace'})))
        data = {clean(k.text):clean(v.text) for (k,v) in domData.iteritems()}

        if "please_enter_a_south_australian_plate_number" in data:
            return None

        #use data
        return data
    except Exception as ex:
        print "{}".format(ex)
        return {}

class RESTHandler(tornado.web.RequestHandler):
    def initialize(self, **kwargs):
        pass

    def options(self, *args):
        allowedMethods = list(["OPTIONS", "GET"])
        self.set_header("Access-Control-Allow-Methods", ",".join(allowedMethods))
        self.finish()

    @coroutine
    def post(self):

        #get post data
        input_json = tornado.escape.json_decode(self.request.body)
        img_base64 = input_json.get("img_src")
        _, img_base64_data = img_base64.split(',')

        #make request
        SECRET_KEY = os.environ.get('SECRET_KEY','')
        url = 'https://api.openalpr.com/v2/recognize_bytes?recognize_vehicle=1&country=au&secret_key=%s' % (SECRET_KEY)
        r = requests.post(url, data = img_base64_data)

        #extract car data
        print "Response from recognition lookup: {}".format(r.status_code)
        car_data = extract_car_data(r.json() or {})

        #fetch/extract plate data from car_data.plate.name
        plate_data = extract_plate_data(car_data.get("plate",{}).get("name") if car_data else None)

        data = {
            "car": car_data,
            "plate": plate_data
        }

        if any(data):
            self.set_status(200)
            self.finish(data)
        else:
            self.set_status(400)
            self.finish()

def main():
    application = tornado.web.Application([
        (r'/scan', RESTHandler),
        (r"/(.*)", tornado.web.StaticFileHandler, {"path": 'static', "default_filename": "index.html"})
    ])
    http_server = tornado.httpserver.HTTPServer(application)
    port = int(os.environ.get("PORT", 8080))
    http_server.listen(port)
    tornado.ioloop.IOLoop.current().start()

if __name__ == "__main__":
    main()