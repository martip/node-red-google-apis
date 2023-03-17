# @martip/node-red-google-apis

A [Node-RED](https://nodered.org/) node for accessing the Google APIs, using the official supported client library ([google-api-nodejs-client](https://github.com/googleapis/google-api-nodejs-client)).

## Install

Either use the `Node-RED Menu - Manage Palette - Install`, or run the following command in your Node-RED user directory - typically `~/.node-red`

    npm install @martip/node-red-google-apis

## Usage

You choose the API and the method to call, either in the node configuration or dynamically (`msg.api` and `msg.method`).

The parameters are passed to the node in `msg.payload`.

### Response Parsing

Depending on the method called, the received buffer can be converted to a string (`msg.payload.toString()`), an object (`JSON.parse(msg.payload.toString())`) etc.

### Auth

This node requires a **Google Service Account**.

The credentials for this account can be set statically, using a shared configuration, or dynamically, passing some properties to the node.

#### Static

Paste the JSON of the account key and the required scopes in the configuration node.

#### Dynamic

Use `msg.credentials` to pass the required parameters to the node:

```javascript
msg.credentials = {
  key: '-----BEGIN PRIVATE KEY-----\n ... \n-----END PRIVATE KEY-----\n',
  email: '[your-account]@[your-project].iam.gserviceaccount.com',
  scopes: [
    'https://www.googleapis.com/auth/...',
    'https://www.googleapis.com/auth/...',
    ...
  ]
};
```

## References

- [Google Service Account](https://cloud.google.com/iam/docs/service-accounts)
- [google-api-nodejs-client](https://github.com/google/google-api-nodejs-client) - details of the official client library
- [Google APIs Explorer](https://developers.google.com/apis-explorer)
