/**
 * Remotion configuration
 * See all configuration options: https://remotion.dev/docs/config
 * Each option is also available as a CLI flag: https://remotion.dev/docs/cli
 *
 * Note: When using the Node.JS APIs, the config file doesn't apply. Instead, pass options directly to the APIs
 */
import {Config} from '@remotion/cli/config';

// Set desired defaults
Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);

// Common CORS headers used in all environments
const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, X-Requested-With, Accept, Origin',
  // Note: With wildcard origin, credentials are not allowed by spec. Keep as 'false'
  'Access-Control-Allow-Credentials': 'false',
  // Add vary to help proxies/CDNs where origin might vary
  Vary: 'Origin',
};

/**
 * In Remotion 4.0.286, ensure CORS by configuring webpack-dev-server
 * (used by Remotion Studio/dev and preview server). We inject global headers
 * and handle OPTIONS preflight using setupMiddlewares so every response
 * includes the CORS headers and OPTIONS returns 204.
 */
Config.overrideWebpackConfig((currentConfiguration) => {
  const cfg: any = {...currentConfiguration};

  // Ensure devServer exists
  cfg.devServer = cfg.devServer ?? {};

  // Add global headers for all responses served by dev server (HTML, assets, HMR)
  cfg.devServer.headers = {
    ...(cfg.devServer.headers ?? {}),
    ...CORS_HEADERS,
  };

  // Handle OPTIONS preflight early and ensure headers are present on the response
  const existingSetup = cfg.devServer.setupMiddlewares;
  cfg.devServer.setupMiddlewares = (middlewares: any[], devServer: any) => {
    // Add our CORS middleware to the top
    middlewares.unshift({
      name: 'cors-preflight-handler',
      middleware: (req: any, res: any, next: any) => {
        // Always apply headers
        Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }
        next();
      },
    });

    // Chain any existing setupMiddlewares if present
    if (typeof existingSetup === 'function') {
      return existingSetup(middlewares, devServer);
    }
    return middlewares;
  };

  // Some environments may use a Vite-like server key; apply headers if present
  if ((cfg as any).server) {
    (cfg as any).server.headers = {
      ...((cfg as any).server.headers ?? {}),
      ...CORS_HEADERS,
    };
  }

  return cfg;
});
