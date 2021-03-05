'use strict';

const Router = require('../../index');

function createRouter(paths) {
  const router = new Router();

  for (const path of paths) {
    const store = router.register(path);
    store.path = path;
  }

  return router;
}

module.exports = createRouter;
