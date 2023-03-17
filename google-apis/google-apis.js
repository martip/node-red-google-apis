const { google } = require('googleapis');

module.exports = function (RED) {
  const encodeAPI = (name, version) => {
    return `${name}:${version}`;
  };

  const decodeAPI = (api) => {
    const a = api.split(':', 2);
    return {
      name: a[0],
      version: a[1],
    };
  };

  const discovery = google.discovery({ version: 'v1' });

  RED.httpAdmin.get('/google-apis/list', async (req, res) => {
    const list = await discovery.apis.list({
      fields: 'items(name,version)',
    });
    const response = list.data.items.map((x) => {
      return encodeAPI(x.name, x.version);
    });
    response.sort();
    res.json(response);
  });

  RED.httpAdmin.get('/google-apis/:api/info', async (req, res) => {
    const api = decodeAPI(req.params.api);

    try {
      const result = await discovery.apis.getRest({
        api: api.name,
        version: api.version,
        fields: 'auth,methods,resources',
      });

      const response = {
        methods: [],
        scopes: [],
      };

      const processResources = (d, parent) => {
        const prefix = parent ? parent + '.' : '';
        if (d.methods) {
          Object.keys(d.methods).forEach(function (k) {
            response.methods.push(prefix + k);
          });
        }
        if (d.resources) {
          Object.keys(d.resources).forEach(function (k) {
            processResources(d.resources[k], prefix + k);
          });
        }
      };

      processResources(result.data);

      response.methods.sort();
      response.scopes = Object.keys(result.data.auth.oauth2.scopes);

      res.json(response);
    } catch (error) {
      res.status(500).json(error);
    }
  });

  function getAuth(key, email, scopes) {
    try {
      const auth = new google.auth.JWT({
        email,
        key,
        scopes,
      });
      return auth;
    } catch (error) {
      throw 'Invalid credentials';
    }
  }

  function GoogleAPIsAuthenticationNode(config) {
    let auth = null;
    RED.nodes.createNode(this, config);
    this.key = JSON.parse(config.key);
    this.scopes = config.scopes;
    this.getAuth = function (scopes) {
      if (!auth) {
        auth = getAuth(
          this.key.private_key,
          this.key.client_email,
          this.scopes.split('\n')
        );
      }
      return auth;
    };
  }

  function GoogleAPIsNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    try {
      node.config = RED.nodes.getNode(config.authentication);
    } catch {
      node.config = null;
    }
    node.authmode = config.authmode;
    node.api = config.api;
    node.method = config.method;
    node.scopes = config.scopes;

    node.on('input', function (msg) {
      node.status({
        fill: 'blue',
        shape: 'dot',
        text: 'pending',
      });

      let auth;
      try {
        if (node.config) {
          auth = node.config.getAuth();
        } else {
          if (msg.credentials && msg.credentials) {
            const { key, email, scopes } = msg.credentials;
            if (!key) {
              throw 'Private Key not found. Cannot authenticate with Google.';
            }
            if (!email) {
              throw 'Client Email not found. Cannot authenticate with Google.';
            }
            if (!scopes) {
              throw 'Scopes not found. Cannot authenticate with Google.';
            }
            auth = getAuth(key, email, scopes);
          }
        }
      } catch (error) {
        node.status({
          fill: 'red',
          shape: 'dot',
          text: 'error',
        });
        node.error(error);
        return;
      }

      let api = decodeAPI(node.api);
      api = google[api.name]({
        version: api.version,
        auth: auth,
      });

      auth.authorize(function (err, tokens) {
        if (err) {
          node.status({
            fill: 'red',
            shape: 'dot',
            text: 'error',
          });
          node.error(err);
          return;
        }

        const props = node.method.split('.');
        let method = api;
        props.forEach(function (val) {
          method = method[val];
        });

        const s = method.bind(api);
        s(msg.payload, { responseType: 'arraybuffer' }, function (err, res) {
          if (err) {
            node.status({
              fill: 'red',
              shape: 'dot',
              text: 'error',
            });
            const error = JSON.parse(Buffer.from(err.message).toString()).error;
            node.error(error);
            return;
          }

          node.status({
            fill: 'yellow',
            shape: 'dot',
            text: 'success',
          });

          msg.payload = Buffer.from(res.data);

          node.send(msg);
        });
      });
    });
  }

  RED.nodes.registerType(
    'google-apis-authentication',
    GoogleAPIsAuthenticationNode
  );
  RED.nodes.registerType('google-apis', GoogleAPIsNode);
};
