var exec = require("child_process").exec;
var request = require("request");

var Service;
var Characteristic;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory(
    "homebridge-rfremote-fan",
    "RF-Remote Fan",
    FanLightAccessory
  );
};

function FanLightAccessory(log, config) {
  this.log = log;

  this.host = config.host;
  this.name = config.name;
  this.id = config.id;
  this.light_name = config.light_name || this.name + " Light";

  this.state = {
    power: false,
    speed: 25
  };
}

FanLightAccessory.prototype.getRelays = function(value, callback) {
  this.log.info("INFO ASKED OF STATUS API: " + JSON.stringify(value));
  logger = this.log.info;
  request(
    {
      url: "http://" + this.host + "/api/status",
      method: "GET",
      json: true,
      body: value
    },
    function(error, response, body) {
      if (error) {
        callback(error);
      } else if (response.statusCode == 200) {
        logger("INFO RETND BY STATUS API: " + body.toString());
        callback(null, body);
      } else {
        callback(
          new Error(
            "HTTP response " + response.statusCode + ": " + JSON.stringify(body)
          )
        );
      }
    }
  );
};

FanLightAccessory.prototype.updateRelays = function(value, callback) {
  this.log.info("updateRelays called. Request body: " + value);

  request(
    {
      url: "http://" + this.host + "/api/update",
      method: "GET",
      json: true,
      body: value
    },
    function(error, response, body) {
      if (error) {
        callback(error);
      } else if (response.statusCode == 200) {
        callback(null);
      } else {
        callback(
          new Error(
            "HTTP response " + response.statusCode + ": " + JSON.stringify(body)
          )
        );
      }
    }
  );
};

FanLightAccessory.prototype.getFanState = function(callback) {
  info = {
    id: this.id
  };
  this.getRelays(info, (error, data) => {
    if (error) {
      callback(error);
    } else {
      var state = {};
      speed = data["speed"];
      if (speed == 3) {
        state.power = true;
        state.speed = 100;
      } else if (speed == 2) {
        state.power = true;
        state.speed = 50;
      } else if (speed == 1) {
        state.power = true;
        state.speed = 25;
      } else {
        state.power = false;
        state.speed = 25;
      }
      // state.temperature = data.temperature;
      this.log.info(
        "getFanState called. Retreived fan speed as: " + state.speed
      );
      this.state = state;
      callback(null, state);
    }
  });
};

FanLightAccessory.prototype.setFanState = function(state, callback) {
  var relay;
  if (state.power && state.speed > 50) {
    relay = 3;
  } else if (state.power && state.speed > 25) {
    relay = 2;
  } else if (state.power && state.speed > 0) {
    relay = 1;
  } else {
    relay = 0;
  }
  this.log.info("setFanState called. Setting fan state to " + relay);

  var update1 = {
    id: this.id,
    state: relay
  };

  this.updateRelays(update1, error => {
    if (error) {
      callback(error);
      return;
    } else {
      callback();
    }
  });
};

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
      maxValue: 100,
      minStep: 25
    })
    .on("get", this.getFanSpeed.bind(this))
    .on("set", this.setFanSpeed.bind(this));

  // Light
  this.lightService = new Service.Lightbulb(this.light_name);
  this.lightService
    .getCharacteristic(Characteristic.On)
    .on("get", this.getLightOn.bind(this))
    .on("set", this.setLightOn.bind(this));

  return [this.fanService, this.lightService];
};

FanLightAccessory.prototype.getFanOn = function(callback) {
  this.log.info("getFanOn called.");
  this.getFanState(function(error, state) {
    callback(null, state && state.power);
  });
};

FanLightAccessory.prototype.setFanOn = function(value, callback) {
  this.log.info("setFanOn called. Setting fan power to " + value);
  if (this.state.power != value) {
    this.log.info("Set fan state to: " + value);
    this.state.power = value;
    this.setFanState(this.state, callback);
  } else {
    callback(null);
  }
};

FanLightAccessory.prototype.getFanSpeed = function(callback) {
  this.log.info("getFanSpeed called.");
  this.getFanState(function(error, state) {
    callback(null, state && state.speed);
  });
};

FanLightAccessory.prototype.setFanSpeed = function(value, callback) {
  this.log.info("setFanSpeed called. Setting fan speed to " + value);
  this.state.speed = value;
  this.setFanState(this.state, callback);
};

FanLightAccessory.prototype.getLightOn = function(callback) {
  this.log.info("getLightOn called.");
  this.getRelays(
    {
      id: this.id,
      light: 1
    },
    callback
  );
};

FanLightAccessory.prototype.setLightOn = function(newValue, callback) {
  this.log.info("setLightOn called. Setting light state to: " + newValue);
  this.updateRelays(
    {
      id: this.id,
      light: 1,
      state: newValue
    },
    callback
  );
};
