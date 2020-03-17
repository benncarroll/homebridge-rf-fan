# @benncarroll/homebridge-rf-fan

Homebridge plugin for utilising RF-controllable fans (yypically 433MHz). This plugin interfaces with [@benncarroll/homebridge-rf-fan-api](https://github.com/benncarroll/homebridge-rf-fan-api), which works by first learning the RF codes, and sending them out to control the fan and lights in the desired way.

## Installation

This doc assumes you alreayd have homebridge up and running, as well as [the API](https://github.com/benncarroll/homebridge-rf-fan-api). 

1. Install this plugin using: `npm install -g @benncarroll/homebridge-rf-fan`
2. Edit config as per below
3. Run/restart homebridge

## Homebridge Configuration:

#### Example config

```json
  "accessories": [
      {
          "accessory": "RF-Remote Fan",
          "name": "Bedroom Fan",
          "light_name": "Bedroom Light",
          "host": "192.168.1.50:5010",
          "id": 1,
          "speeds": 3
      },
      ...
   ]
```

#### Parameters

| Property   | Description                                                                                         |
|------------|-----------------------------------------------------------------------------------------------------|
| accessory  | Required. Must be "RF-Remote Fan"                                                                   |
| name       | Required. Desired name of your device, e.g. "Bedroom Fan"                                           |
| light_name | Optional. Name of Light. If not set, will be `name + " Light"`                                      |
| host       | Required. IP Address & Port of [API Instance](https://github.com/benncarroll/homebridge-rf-fan-api) |
| id         | Required. Device ID as configured on API (One API instance can support multiple fans)               |
| speeds     | Required. Number of fan speeds, e.g. 3 for Fan with Off, __Low__, __Med__, __High__                  |

