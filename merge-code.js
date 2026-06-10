import fs from 'fs';
import path from 'path';

// Output target file
const outputFile = './project.txt';

// Directories to skip completely
const ignoreDirs = ['node_modules', '.git', '.next', 'out', 'dist', 'build'];

// Files to skip completely (skipping lock files saves thousands of unnecessary tokens)
const ignoreFiles = ['package-lock.json', 'merge-code.js', 'project.txt', '.gitignore'];

// Allowed file extensions based on your frontend structure
const allowedExtensions = ['.tsx', '.ts', '.js', '.mjs', '.json', '.css'];

function bundleFiles(dir) {
    try {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            const ext = path.extname(file);

            if (stat.isDirectory()) {
                // Recursively check directories if they aren't ignored
                if (!ignoreDirs.includes(file)) {
                    bundleFiles(fullPath);
                }
            } else {
                // Process files matching your specific extension whitelist
                if (allowedExtensions.includes(ext) && !ignoreFiles.includes(file)) {
                    // Create a clean relative path (e.g., "app/page.tsx") for the AI context
                    const relativePath = path.relative(process.cwd(), fullPath).replace(/\\/g, '/');
                    const content = fs.readFileSync(fullPath, 'utf8');
                    
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

console.log('Bundling codebase into project.txt...');
bundleFiles('.');
console.log('✅ Successfully generated project.txt!');
