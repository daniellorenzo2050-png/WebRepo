import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import YAML from 'yaml';

// Captura os argumentos do terminal (ex: node wpm.js install monaco-editor)
const [, , command, packageName] = process.argv;

if (!command || !packageName) {
    console.log(`\x1b[31m[WPM] Erro: Use o formato correto -> node wpm.js install <nome-do-pacote>\x1b[0m`);
    process.exit(1);
}

const packageFolder = path.join('./libary', packageName);
const metadataPath = path.join(packageFolder, 'METADATA.yml');

// Função Principal de Instalação
function installPackage() {
    console.log(`\x1b[36m[WPM] Procurando por "${packageName}" no WebRepo...\x1b[0m`);

    // 1. Verifica se a pasta e o manifesto existem
    if (!fs.existsSync(metadataPath)) {
        console.error(`\x1b[31m[WPM] Erro: Pacote "${packageName}" ou seu METADATA.yml não foi encontrado em ./libary/\x1b[0m`);
        process.exit(1);
    }

    // 2. Lê e faz o parse do arquivo METADATA.yml
    const file = fs.readFileSync(metadataPath, 'utf8');
    const metadata = YAML.parse(file);

    console.log(`\x1b[32m[WPM] Encontrado: ${metadata.project.name} v${metadata.project.version} por ${metadata.project.author}\x1b[0m`);

    // 3. Procura por arquivos de instalação (.tgz ou .zip) mapeados
    let archiveName = null;
    if (metadata.installation && metadata.installation.archive_path) {
        archiveName = path.basename(metadata.installation.archive_path);
    } else {
        // Fallback caso use a estrutura antiga ou o arquivo físico .tgz esteja na pasta
        const filesInFolder = fs.readdirSync(packageFolder);
        archiveName = filesInFolder.find(f => f.endsWith('.tgz') || f.endsWith('.zip'));
    }

    if (!archiveName) {
        console.log(`\x1b[33m[WPM] Aviso: Nenhum arquivo compactado (.tgz/.zip) encontrado. O pacote já pode estar descompactado.\x1b[0m`);
        return;
    }

    const archivePath = path.join(packageFolder, archiveName);

    // 4. Executa a descompactação dependendo da extensão do arquivo
    try {
        console.log(`\x1b[34m[WPM] Instalando/Descompactando ${archiveName}...\x1b[0m`);
        
        if (archiveName.endsWith('.tgz')) {
            // Comando nativo do tar (funciona no Windows atual, Linux e Mac)
            execSync(`tar -xvzf "${archivePath}" -C "${packageFolder}"`, { stdio: 'ignore' });
            console.log(`\x1b[32m[WPM] Sucesso: Monaco Editor extraído com sucesso na pasta do WebRepo!\x1b[0m`);
        } else if (archiveName.endsWith('.zip')) {
            // Comando caso use o formato zip (via PowerShell no Windows)
            execSync(`powershell -Command "Expand-Archive -Path '${archivePath}' -DestinationPath '${packageFolder}' -Force"`);
            console.log(`\x1b[32m[WPM] Sucesso: Arquivo ZIP extraído com sucesso!\x1b[0m`);
        }
    } catch (error) {
        console.error(`\x1b[31m[WPM] Erro ao descompactar o pacote: ${error.message}\x1b[0m`);
    }
}

// Inicializador do roteador de comandos
if (command === 'install') {
    installPackage();
} else {
    console.log(`\x1b[33m[WPM] Comando "${command}" não reconhecido. Atualmente suportamos apenas "install".\x1b[0m`);
}
