const { readFileSync } = require("fs");
const { join } = require("path");

module.exports = {
  middleware: [
    function spaFallback(req, res, next) {
      const url = req.url.split("?")[0];
      // Skip static files and known directories
      if (url.match(/\.\w+$/) || url.startsWith("/data/") || url.startsWith("/api/") || url.startsWith("/img/") || url.startsWith("/css/") || url.startsWith("/js/") || url.startsWith("/acknowledgements/") || url.startsWith("/contact/") || url.startsWith("/release-notes/")) {
        return next();
      }
      // Serve index.html for SPA routes
      if (url.startsWith("/db/") || url === "/build-planner" || url === "/version-compare" || url === "/favorites" || url === "/recent") {
        req.url = "/index.html";
      }
      next();
    },
  ],
};
