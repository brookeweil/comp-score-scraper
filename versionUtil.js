const fs = require('fs');

const main = () => {
    let html = fs.readFileSync('build/index.html', { encoding: 'utf8', flag: 'r' });
    const version = (new Date()).toString();
    html = html.replace(
        '<meta name="version" content="beta"/>',
        `<meta name="version" content="${version}"/>`
    )
    fs.writeFileSync('build/index.html', html);
    console.log(`Set version to ${version}.\n`)
}

main();