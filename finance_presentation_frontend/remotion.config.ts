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
   // Use wildcard to simplify, while still allowing common headers.
   'Access-Control-Allow-Headers': '*',
   // Note: With wildcard origin, credentials cannot be used by spec. Keep as 'false'
   'Access-Control-Allow-Credentials': 'false',
   // Helps intermediaries if origin varies
   Vary: 'Origin',
 };

 /**
  * Remotion 4.x uses webpack-dev-server for Studio and preview.
  * We enforce global CORS by:
  * - Setting devServer.headers to include our CORS headers on ALL responses (HTML at '/', static assets, HMR, etc.)
  * - Adding a setupMiddlewares handler that:
  *    - Always injects the headers
  *    - Returns 204 for OPTIONS preflights with the same headers
  *
  * This ensures the Network panel shows Access-Control-Allow-Origin: * on '/' and other routes,
  * and that OPTIONS preflight requests succeed.
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
     // Add our CORS middleware to the very beginning
     middlewares.unshift({
       name: 'cors-preflight-handler',
       middleware: (req: any, res: any, next: any) => {
         // Always apply headers
         Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));

         // Quick exit for preflight
         if (req.method === 'OPTIONS') {
           res.statusCode = 204;
           res.end();
           return;
         }

         return next();
       },
     });

     // Chain any existing setupMiddlewares if present
     if (typeof existingSetup === 'function') {
       return existingSetup(middlewares, devServer);
     }

     return middlewares;
   };

   // If some environments expose a "server" (Vite-like), apply headers as well (no harm if unused)
   if ((cfg as any).server) {
     (cfg as any).server.headers = {
       ...((cfg as any).server.headers ?? {}),
       ...CORS_HEADERS,
     };
   }

   return cfg;
 });
