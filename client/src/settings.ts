/** Global client settings, baked in at build time from the root .env (see quasar.config.js `env`). */

/** Start the board on src/samples/sample-game.json (one move before White mates) instead of the opening. */
export const ENABLE_SAMPLE_GAME_LOAD = process.env.ENABLE_SAMPLE_GAME_LOAD === 'true';
