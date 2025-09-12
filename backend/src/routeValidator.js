// routeValidator.js
const path = require("path");

function validateRoutes(routes) {
  let allValid = true;

  for (const { method, path: routePath, handler, file } of routes) {
    if (typeof handler !== "function") {
      console.error(`❌ Erro: A rota [${method.toUpperCase()} ${routePath}] não tem função válida! Arquivo: ${file}`);
      allValid = false;
    } else {
      console.log(`✅ Rota [${method.toUpperCase()} ${routePath}] OK`);
    }
  }

  return allValid;
}

module.exports = validateRoutes;
