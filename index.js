var exec = require("child_process").exec;
var request = require("request");

var Service;
var Characteristic;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-rf-fan", "RF-Remote Fan", FanLightAccessory);
};

function FanLightAccessory(log, config) {
  this.log = log;

  this.host = config.host;
  this.name = config.name;
  this.device_id = config.id;
  this.speeds = config.speeds;
  this.light_name = config.light_name || this.name + " Light";

  this.stateCache = {
    "light-on": 0,
    "fan-on": 0,
    "fan-speed": 0
  };
  this.lastCacheRefresh = 0;
}

FanLightAccessory.prototype.identify = function(callback) {
  this.log("Identify requested!");
  callback();
};

FanLightAccessory.prototype.getServices = function() {
  // Fan
  this.fanService = new Service.Fan();
  this.fanService
    .getCharacteristic(Characteristic.On)
    .on("get", this.getFanOn.bind(this))
    .on("set", this.setFanOn.bind(this));
  this.fanService
    .getCharacteristic(Characteristic.RotationSpeed)
    .setProps({
      minValue: 0,
      maxValue: Math.floor(100 / this.speeds) * this.speeds,
      minStep: Math.floor(100 / this.speeds)
    })
    .on("get", this.getFanSpeed.bind(this))
    .on("set", this.setFanSpeed.bind(this));

  // Light
  this.lightService = new Service.Lightbulb(this.light_name);
  this.lightService
    .getCharacteristic(Characteristic.On)
    .on("get", this.getLightOn.bind(this))
    .on("set", this.setLightOn.bind(this));

  var informationService = new Service.AccessoryInformation();
  informationService
    .setCharacteristic(Characteristic.Manufacturer, "Ben Carroll")
    .setCharacteristic(Characteristic.Model, "RF Fan API")
    .setCharacteristic(Characteristic.SerialNumber, "RF-API-" + this.name);

  return [informationService, this.fanService, this.lightService];
};

FanLightAccessory.prototype.getDeviceChar = function(mode, callback) {
  this.checkIn(callback, mode);
};

FanLightAccessory.prototype.setDeviceChar = function(mode, value, callback) {
  this.stateCache[mode] = value;
  this.checkIn(callback, "update");
};

FanLightAccessory.prototype.isCacheFresh = function() {
  return this.lastCacheRefresh > +new Date() - 5000;
};

FanLightAccessory.prototype.checkIn = function(callback, callbackMode) {
  body = {
    id: this.device_id
  };
  if (callbackMode == "update") {
    body["sync"] = this.stateCache;
    urlFragment = "update";
  } else {
    urlFragment = "status";
    if (this.isCacheFresh()) {
      callback(null, this.stateCache[callbackMode]);
      return;
    }
  }

  that = this;
  this.log.info("API Request made. Body: " + JSON.stringify(body));
  request(
    {
      url: "http://" + this.host + "/apiv2/" + urlFragment,
      method: "GET",
      json: true,
      body: body
    },
    function(error, response, body) {
      if (error) {
        callback(error);
      } else {
        if (response.statusCode == 200) {
          that.log.info("API Request result:" + JSON.stringify(body));
        } else {
          that.log.error(new Error("HTTP response " + response.statusCode + ": " + JSON.stringify(body)));
        }
        that.stateCache = body.sync;
        that.lastCacheRefresh = +new Date();
        callback(null, callbackMode == "update" ? undefined : that.stateCache[callbackMode]);
      }
    }
  );
};

// Methods called by homebridge, redirecting to get/setDeviceChar
FanLightAccessory.prototype.getFanOn = function(callback) {
  this.getDeviceChar("fan-on", callback);
};
FanLightAccessory.prototype.setFanOn = function(value, callback) {
  this.setDeviceChar("fan-on", value, callback);
};
FanLightAccessory.prototype.getFanSpeed = function(callback) {
  this.getDeviceChar("fan-speed", callback);
};
FanLightAccessory.prototype.setFanSpeed = function(value, callback) {
  this.setDeviceChar("fan-speed", value, callback);
};
FanLightAccessory.prototype.getLightOn = function(callback) {
  this.getDeviceChar("light-on", callback);
};
FanLightAccessory.prototype.setLightOn = function(value, callback) {
  this.setDeviceChar("light-on", value, callback);
};
