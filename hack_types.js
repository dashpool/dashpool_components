// a node js helper that updates the types of some interface libraries
// to be more compatible with the typescript compiler

const fs = require('fs');
const path = require('path');

hacks = [
    {
        "file": "node_modules/react-chat-elements/src/type.d.ts",
        "search": "text: string",
        "replace": "text: any"
    },
    {
        "file": "node_modules/react-chat-elements/dist/type.d.ts",
        "search": "text: string",
        "replace": "text: any"
    },    
]

hacks.forEach(hack => {
    const filePath = path.resolve(__dirname, hack.file);
    // check if file exists
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${hack.file}`);
        return;
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');

    // check if the file contains the string to be replaced
    if (!fileContent.includes(hack.search)) {
        console.error(`String not found: ${hack.search}`);
        return;
    }

    // replace all instances of the string
    const newContent = fileContent.replace(new RegExp(hack.search, 'g'), hack.replace);
    fs.writeFileSync(filePath, newContent);
    console.log(`Updated ${hack.file}`);
})
