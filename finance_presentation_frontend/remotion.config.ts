/**
 * Remotion configuration
 * See all configuration options: https://remotion.dev/docs/config
 * Each option is also available as a CLI flag: https://remotion.dev/docs/cli
 *
 * Note: When using the Node.JS APIs, the config file doesn't apply. Instead, pass options directly to the APIs
 */
import { Config } from "@remotion/cli/config";

// Set desired defaults
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);

/**
 * Configure permissive CORS for the Remotion Studio dev server by overriding the
 * underlying bundler (Vite/webpack) dev server headers. This ensures:
 * - Access-Control-Allow-Origin: *
 * - Access-Control-Allow-Methods
 * - Access-Control-Allow-Headers
 * Dev server will also handle OPTIONS automatically.
 */
Config.overrideWebpackConfig((currentConfiguration) => {
  // For both webpack-dev-server and Vite compatibility, we attempt to set headers
  // on devServer if present, otherwise return config unchanged for production builds.
  const cfg: any = { ...currentConfiguration };

  // webpack-dev-server style
  if (cfg.devServer) {
    cfg.devServer.headers = {
      ...(cfg.devServer.headers ?? {}),
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, X-Requested-With, Accept, Origin",
      "Access-Control-Allow-Credentials": "false",
    };
  }

  // Vite-style (if present via server.headers)
  if (cfg.server) {
    cfg.server.headers = {
      ...(cfg.server.headers ?? {}),
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, X-Requested-With, Accept, Origin",
      "Access-Control-Allow-Credentials": "false",
    };
  }

  return cfg;
});
