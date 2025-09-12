const fs = require("fs");
const path = require("path");

// Caminhos
const serverFile = path.join(__dirname, "src", "server.js");
const controllersPath = path.join(__dirname, "src", "controllers");

// Lê o server.js e procura por handlers no formato controller.function
const serverContent = fs.readFileSync(serverFile, "utf-8");
const routeRegex = /handler:\s*([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)/g;

let matches = [];
let match;
while ((match = routeRegex.exec(serverContent)) !== null) {
  matches.push({ controller: match[1], func: match[2] });
}

// Função para checar cada controller
matches.forEach(({ controller, func }) => {
  const filePath = path.join(controllersPath, `${controller}.js`);
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Controller não encontrado: ${controller}.js`);
    return;
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const exportRegex = new RegExp(`exports\\.${func}\\s*=`);
  if (!exportRegex.test(fileContent)) {
    console.log(`⚠️ Função ausente: ${func} em ${controller}.js`);
  }
});

console.log("\n✅ Verificação concluída.");
