const fs = require('fs');
const path = require('path');

// Parse CLI Arguments
const args = process.argv.slice(2);
const coreOnly = args.includes('--core-only');
const noComponents = args.includes('--no-components') || coreOnly;

// Output target file
const outputFile = './project.txt';

// Directories to skip completely
const ignoreDirs = ['node_modules', '.git', '.next', 'out', 'dist', 'build', '.gemini', 'artifacts', 'tests', 'locales', 'scripts'];
if (noComponents) {
    ignoreDirs.push('components');
}

// Files to skip completely
const ignoreFiles = [
  'package-lock.json', 
  'merge-code.js', 
  'project.txt', 
  '.gitignore', 
  '.env', 
  '.env.local', 
  '.env.development', 
  '.env.production',
  'tsconfig.tsbuildinfo',
  'venture-iq-499019-af0a70f3ce3d.json'
];

// Allowed file extensions
const allowedExtensions = ['.tsx', '.ts', '.js', '.mjs', '.json', '.css', '.md'];

let totalChars = 0;
let fileCount = 0;
const fileSizes = [];
const bundledPaths = [];

// Clean comments and reduce empty lines to save tokens
function preprocessContent(content) {
    let lines = content.replace(/\r\n/g, '\n').split('\n');
    let cleanedLines = [];
    let inBlockComment = false;

    for (let line of lines) {
        let trimmed = line.trim();

        if (inBlockComment) {
            if (trimmed.includes('*/')) {
                inBlockComment = false;
                const idx = trimmed.indexOf('*/');
                trimmed = trimmed.substring(idx + 2).trim();
            } else {
                continue;
            }
        } else if (trimmed.startsWith('/*')) {
            if (trimmed.includes('*/')) {
                const startIdx = trimmed.indexOf('/*');
                const endIdx = trimmed.indexOf('*/');
                trimmed = (trimmed.substring(0, startIdx) + trimmed.substring(endIdx + 2)).trim();
            } else {
                inBlockComment = true;
                continue;
            }
        }

        // Skip single-line comments that take up the whole line
        if (trimmed.startsWith('//')) {
            continue;
        }

        // Collapse empty lines
        if (trimmed === '') {
            if (cleanedLines.length > 0 && cleanedLines[cleanedLines.length - 1] !== '') {
                cleanedLines.push('');
            }
        } else {
            const indentMatch = line.match(/^(\s*)/);
            const indent = indentMatch ? indentMatch[1] : '';
            // Convert every 2 spaces in the leading indentation to a single tab character
            const compressedIndent = indent.replace(/ {2}/g, '\t');
            cleanedLines.push(compressedIndent + trimmed);
        }
    }

    return cleanedLines.join('\n');
}

// Determine if a path is core logic (for --core-only)
// Core logic includes: lib/, app/api/, context/, store/, hooks/, and root configuration files
function isCoreFile(relativePath) {
    if (!coreOnly) return true;
    
    // Core directories
    if (relativePath.startsWith('lib/') || 
        relativePath.startsWith('app/api/') || 
        relativePath.startsWith('context/') || 
        relativePath.startsWith('store/') || 
        relativePath.startsWith('hooks/')) {
        return true;
    }
    
    // Root level configuration files (no slashes in path)
    if (!relativePath.includes('/')) {
        return true;
    }
    
    return false;
}

// Generate Directory Tree representation
function generateTree(dir, prefix = '') {
    let result = '';
    try {
        const files = fs.readdirSync(dir);
        const sorted = files.map(file => {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            return { name: file, isDir: stat.isDirectory() };
        }).sort((a, b) => (b.isDir - a.isDir) || a.name.localeCompare(b.name));

        sorted.forEach((item, index) => {
            if (item.isDir && ignoreDirs.includes(item.name)) return;
            if (!item.isDir) {
                const ext = path.extname(item.name);
                const isEnvFile = item.name.startsWith('.env');
                const isServiceAccount = item.name.endsWith('.json') && (item.name.includes('key') || item.name.includes('credentials') || item.name.startsWith('venture-iq-'));
                const isTestFile = item.name.includes('.test.') || item.name.includes('.spec.');
                if (!allowedExtensions.includes(ext) || ignoreFiles.includes(item.name) || isEnvFile || isServiceAccount || isTestFile) {
                    return;
                }
            }

            const relativePath = path.relative(process.cwd(), path.join(dir, item.name)).replace(/\\/g, '/');
            if (coreOnly && !item.isDir && !isCoreFile(relativePath)) {
                return;
            }

            // For directories in coreOnly mode, only show if they contain core files
            if (coreOnly && item.isDir && 
                !relativePath.startsWith('lib') && 
                !relativePath.startsWith('app/api') && 
                !relativePath.startsWith('context') && 
                !relativePath.startsWith('store') && 
                !relativePath.startsWith('hooks')) {
                return;
            }

            const isLast = index === sorted.length - 1;
            const marker = isLast ? '└── ' : '├── ';
            result += `${prefix}${marker}${item.name}\n`;

            if (item.isDir) {
                const newPrefix = prefix + (isLast ? '    ' : '│   ');
                result += generateTree(path.join(dir, item.name), newPrefix);
            }
        });
    } catch (e) {
        // Ignore
    }
    return result;
}

function bundleFiles(dir) {
    try {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            const ext = path.extname(file);

            if (stat.isDirectory()) {
                if (!ignoreDirs.includes(file)) {
                    bundleFiles(fullPath);
                }
            } else {
                const isEnvFile = file.startsWith('.env');
                const isServiceAccount = file.endsWith('.json') && (file.includes('key') || file.includes('credentials') || file.startsWith('venture-iq-'));
                const isTestFile = file.includes('.test.') || file.includes('.spec.');
                
                if (allowedExtensions.includes(ext) && !ignoreFiles.includes(file) && !isEnvFile && !isServiceAccount && !isTestFile) {
                    const relativePath = path.relative(process.cwd(), fullPath).replace(/\\/g, '/');
                    
                    if (!isCoreFile(relativePath)) {
                        continue;
                    }

                    let content = fs.readFileSync(fullPath, 'utf8');
                    
                    // Preprocess content (strip comments and collapse spaces) for JS/TS/CSS/JSON
                    if (['.ts', '.tsx', '.js', '.jsx', '.css', '.json'].includes(ext)) {
                        content = preprocessContent(content);
                    }
                    
                    totalChars += content.length;
                    fileCount++;
                    fileSizes.push({ path: relativePath, size: content.length });
                    bundledPaths.push(relativePath);

                    // Append file path header and its contents
                    fs.appendFileSync(
                        outputFile, 
                        `\n\n=========================================\nFILE: ${relativePath}\n=========================================\n\n${content}`
                    );
                }
            }
        }
    } catch (error) {
        console.error(`Error processing directory ${dir}:`, error.message);
    }
}

// Reset output file if it already exists
if (fs.existsSync(outputFile)) {
    fs.unlinkSync(outputFile);
}

console.log('Generating directory tree structure...');
const treeOutput = `=========================================\nPROJECT DIRECTORY STRUCTURE\n=========================================\n.\n${generateTree('.')}`;

fs.writeFileSync(outputFile, treeOutput);

console.log('Bundling codebase into project.txt...');
bundleFiles('.');

const estimatedTokens = Math.ceil(totalChars / 4);
console.log('-----------------------------------------');
console.log(`✅ Successfully generated ${outputFile}`);
console.log(`📂 Total files bundled: ${fileCount}`);
console.log(`🔤 Total characters: ${totalChars}`);
console.log(`🤖 Estimated tokens (code only): ~${estimatedTokens}`);

if (estimatedTokens > 200000) {
    console.log('\n⚠️  WARNING: Estimated token count exceeds 200,000 (2 lakh) tokens!');
    console.log('👉 Try running one of the following commands to fit under the limit:');
    console.log('   node merge-code.js --no-components   (skips the UI components folder)');
    console.log('   node merge-code.js --core-only       (skips all UI code: page views & components)');
} else {
    console.log('\n🎉 Codebase is successfully under the 200,000 token limit.');
}

console.log('\nTop 15 Largest Files in Bundle:');
fileSizes.sort((a, b) => b.size - a.size);
fileSizes.slice(0, 15).forEach((f, i) => {
    console.log(`${i + 1}. ${f.path} (${(f.size / 1024).toFixed(2)} KB)`);
});




