"use strict";

const Hawk = require('hawk');
const https = require("https");

const ruleData = {
   "name": "API Test Rule: Sudo Usage",
   "title": "API Test Rule: Sudo Usage",
   "type": "host",
   "severityOfAlerts": 2,
   "alertDescription": "This rule was created as a test of the Threat Stack REST API. It monitors for usage of sudo",
   "aggregateFields": ["user", "session"],
   "filter": "command = 'sudo'",
   "window": 3600,
   "threshold": 1,
   "suppressions": ["user = 'alice' OR user = 'bob'"],
   "enabled": true
};

var postData = JSON.stringify(ruleData);

function makeRequest(options, onResult) {
const req = https.request(options, function (res) {
let output;
res.setEncoding('utf8');

res.on('data', function (chunk) {
  if (!output) {
    output = '';
  }
  output += chunk;
});

res.on('end', function () {
  onResult(null, {resp: res, content: output});
});
});

req.on('error', function (err) {
onResult(err);
});

req.write(postData);
req.end();
}

function getEnv(key, defaultValue) {
let res = process.env[key];
if (res === undefined && defaultValue !== undefined) {
res = defaultValue;
}
if (res === undefined) {
throw new Error(`Environment variable '${key}' must be set.`)
}
return res;
}

const organizationId = getEnv('TS_ORGANIZATION_ID');
const userId = getEnv('TS_USER_ID');
const apiKey = getEnv('TS_API_KEY');
const tsHost = getEnv('TS_HOST', 'api.threatstack.com');
const tsRulesetId = getEnv('TS_RULESET_ID');

const credentials = {
  id: userId,
  key: apiKey,
  algorithm: 'sha256'
};

const path = '/v2/rulesets/' + tsRulesetId + '/rules';
const headerOptions = {
  credentials: credentials,
  ext: organizationId,
  payload: postData,
  contentType: "application/json"
};
const authorizationHeader = Hawk.client.header(`https://${tsHost}${path}`, 'POST', headerOptions);

makeRequest({
  host: tsHost,
  port: 443,
  path: path,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': authorizationHeader.field
  }
}, function (err, result) {
  if (err) {
    console.log('Error making request', err);
    process.exit(1);
  }

  console.log(result.content);
  process.exit(0);
});