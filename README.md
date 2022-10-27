# @martip/node-red-google-apis

A [Node-RED](https://nodered.org/) node for accessing the Google APIs, using the official supported client library ([google-api-nodejs-client](https://github.com/googleapis/google-api-nodejs-client)).

## Install

Either use the `Node-RED Menu - Manage Palette - Install`, or run the following command in your Node-RED user directory - typically `~/.node-red`

    npm install @martip/node-red-google-apis

## Usage

This node requires a [Google Service account](https://cloud.google.com/iam/docs/service-accounts).
Paste the account key and the required scopes in the configuration node. 

You choose the API and the method to call, either in the node configuration or dynamically (`msg.api` and `msg.method`).

The parameters are passed to the node in `msg.payload`.
