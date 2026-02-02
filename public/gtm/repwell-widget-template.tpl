___INFO___

{
  "type": "TAG",
  "id": "repwell_widget",
  "version": 1,
  "securityGroups": [],
  "displayName": "RepWell Review Widget",
  "brand": {
    "id": "repwell",
    "displayName": "RepWell"
  },
  "description": "Embeds a RepWell review widget on your page. Enter your Widget ID from the RepWell dashboard to display reviews, ratings, and testimonials.",
  "containerContexts": [
    "WEB"
  ]
}


___TEMPLATE_PARAMETERS___

[
  {
    "type": "TEXT",
    "name": "widgetId",
    "displayName": "Widget ID",
    "simpleValueType": true,
    "help": "Find your Widget ID in the RepWell dashboard under Widgets → Embed Code.",
    "valueValidators": [
      {
        "type": "NON_EMPTY"
      }
    ]
  },
  {
    "type": "TEXT",
    "name": "hostUrl",
    "displayName": "RepWell Host URL",
    "simpleValueType": true,
    "defaultValue": "https://app.repwell.com",
    "help": "The base URL of your RepWell instance. Change only if using a custom domain."
  },
  {
    "type": "SELECT",
    "name": "loadTrigger",
    "displayName": "Load Trigger",
    "macrosInSelect": false,
    "selectItems": [
      { "value": "domReady", "displayValue": "DOM Ready" },
      { "value": "pageLoad", "displayValue": "Page Load (Window Loaded)" },
      { "value": "immediate", "displayValue": "Immediate" }
    ],
    "simpleValueType": true,
    "defaultValue": "domReady",
    "help": "When to inject the widget. DOM Ready is recommended for most sites."
  }
]


___SANDBOXED_JS_FOR_WEB_TEMPLATE___

const injectScript = require('injectScript');
const queryPermission = require('queryPermission');
const createQueue = require('createQueue');
const callInWindow = require('callInWindow');
const log = require('logToConsole');

const widgetId = data.widgetId;
const hostUrl = data.hostUrl || 'https://app.repwell.com';
const scriptUrl = hostUrl + '/embed.js';

// Create the widget container element
const containerId = 'repwell-widget-' + widgetId;

// Inject the embed script
if (queryPermission('inject_script', scriptUrl)) {
  injectScript(scriptUrl, function() {
    log('RepWell: embed.js loaded successfully');
    data.gtmOnSuccess();
  }, function() {
    log('RepWell: Failed to load embed.js');
    data.gtmOnFailure();
  });
} else {
  log('RepWell: Script injection not permitted for ' + scriptUrl);
  data.gtmOnFailure();
}


___WEB_PERMISSIONS___

[
  {
    "instance": {
      "key": {
        "publicId": "inject_script",
        "vpiId": "INJECT_SCRIPT"
      },
      "param": [
        {
          "key": "urls",
          "value": {
            "type": 2,
            "listItem": [
              {
                "type": 1,
                "string": "https://app.repwell.com/embed.js"
              },
              {
                "type": 1,
                "string": "https://*.repwell.com/embed.js"
              }
            ]
          }
        }
      ]
    },
    "isRequired": true
  },
  {
    "instance": {
      "key": {
        "publicId": "logging",
        "vpiId": "LOGGING"
      },
      "param": [
        {
          "key": "environments",
          "value": {
            "type": 1,
            "string": "debug"
          }
        }
      ]
    },
    "isRequired": false
  }
]


___NOTES___

RepWell Review Widget - Google Tag Manager Template
Version: 1.0.0

Usage:
1. Add this template to your GTM container
2. Create a new tag using the "RepWell Review Widget" template
3. Enter your Widget ID (found in RepWell Dashboard → Widgets → Embed Code)
4. Set the trigger (DOM Ready recommended)
5. Add a Custom HTML tag with:
   <div data-repwell-widget="{{your-widget-id}}"></div>
6. Publish your container

For support, visit https://app.repwell.com/dashboard/widgets/integrations
