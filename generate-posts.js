import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const postsDir = path.join(__dirname, 'public/content/posts');
const outputDir = path.join(__dirname, 'public');
const outputFile = path.join(outputDir, 'posts.json');

// Ensure output dir exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Simple frontmatter parser
function parseFrontmatter(content) {
    const match = content.match(/^---\s*([\s\S]*?)\s*---/);
    if (!match) return {};

    const frontmatter = match[1];
    const data = {};
    const lines = frontmatter.split('\n');
    let currentKey = null;

    lines.forEach(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;

        // Check if it's a new key-value pair
        const colonIndex = line.indexOf(':');
        if (colonIndex !== -1 && !line.trim().startsWith('-')) {
            const key = line.slice(0, colonIndex).trim();
            let value = line.slice(colonIndex + 1).trim();

            // Check for multiline string (if it's just a colon followed by nothing)
            if (value === '' || value === '>' || value === '|') {
                data[key] = '';
                currentKey = key;
            } else {
                // Handle basic types
                if (value.startsWith('[') && value.endsWith(']')) {
                    value = value.slice(1, -1).split(',').map(s => s.trim().replace(/^"|"$/g, ''));
                } else if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1);
                } else if (value.startsWith("'") && value.endsWith("'")) {
                    value = value.slice(1, -1);
                } else if (value.toLowerCase() === 'true') {
                    value = true;
                } else if (value.toLowerCase() === 'false') {
                    value = false;
                } else if (!isNaN(Number(value)) && value !== '') {
                    value = Number(value);
                }
                data[key] = value;
                currentKey = key;
            }
        }
        // Check if it's a list item
        else if (trimmedLine.startsWith('- ') && currentKey) {
            const value = trimmedLine.slice(2).trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
            if (!Array.isArray(data[currentKey])) {
                data[currentKey] = [];
            }
            data[currentKey].push(value);
        }
        // Check if it's a continuation of a multiline value
        else if (line.startsWith(' ') && currentKey) {
            if (typeof data[currentKey] === 'string') {
                data[currentKey] = (data[currentKey] + ' ' + trimmedLine).trim();
            }
        }
    });

    return data;
}

if (!fs.existsSync(postsDir)) {
    console.log('No posts directory found.');
    fs.writeFileSync(outputFile, JSON.stringify([]));
    process.exit(0);
}

const posts = fs.readdirSync(postsDir)
    .filter(file => file.endsWith('.md'))
    .map(file => {
        const content = fs.readFileSync(path.join(postsDir, file), 'utf-8');
        const data = parseFrontmatter(content);
        return {
            slug: file.replace('.md', ''),
            ...data
        };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

fs.writeFileSync(outputFile, JSON.stringify(posts, null, 2));
console.log(`Generated posts.json with ${posts.length} posts.`);

// Documents Generation
const docsDir = path.join(__dirname, 'public/content/documents');
const dogsOutputFile = path.join(outputDir, 'documents.json');

if (fs.existsSync(docsDir)) {
    const documents = fs.readdirSync(docsDir)
        .filter(file => file.endsWith('.md') || file.endsWith('.json')) // Decap might save as markdown with frontmatter even for files? 
        // Actually, for file collections, Decap creates a markdown file with frontmatter pointing to the file.
        .map(file => {
            if (file.endsWith('.md')) {
                const content = fs.readFileSync(path.join(docsDir, file), 'utf-8');
                const data = parseFrontmatter(content);
                return {
                    slug: file.replace('.md', ''),
                    ...data
                };
            }
            return null;
        })
        .filter(Boolean)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    fs.writeFileSync(dogsOutputFile, JSON.stringify(documents, null, 2));
    console.log(`Generated documents.json with ${documents.length} documents.`);
} else {
    console.log('No documents directory found, skipping.');
    fs.writeFileSync(dogsOutputFile, JSON.stringify([]));
}
