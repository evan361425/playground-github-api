const { createInterface } = require('readline');
const p = require('argparse');
const { createReadStream, createWriteStream } = require('fs');

function parseArgs() {
  const argParser = new p.ArgumentParser({
    description: 'Parse XML to JS object',
  });
  argParser.add_argument('__', {
    nargs: '+',
  });
  argParser.add_argument('-f', '--files', {
    help: 'files(jsonl) of candidate ',
    action: 'extend',
    default: [],
  });
  argParser.add_argument('-i', '--input', {
    help: 'List of repos',
  });
  argParser.add_argument('-o', '--output', {
    help: 'Result',
  });
  argParser.add_argument('--language', {
    help: 'Get language only',
    action: 'store_true',
  });
  return argParser.parse_args();
}

async function* iterFile(fileName) {
  const rl = createInterface({
    input: createReadStream(fileName),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    try {
      yield line.trim();
    } catch (error) {
      continue;
    }
  }
}

function pkgMgr2Lang(pkgMgr) {
  switch (pkgMgr) {
    case 'composer.json':
      return 'PHP';
    case 'package.json':
      return 'JavaScript';
    case 'pom.xml':
      return 'Java';
    case 'build.gradle':
      return 'Java';
  }
}

async function main() {
  const args = parseArgs();
  const output = createWriteStream(args.output, { flags: 'a' });

  const total = (
    await quiet($`wc -l ${args.input} | awk '{print $1}'`)
  ).stdout.trim();
  let counter = 1;

  for await (const repoInfo of iterFile(args.input)) {
    const [app, repoUrl] = repoInfo.split('\t');
    // Remove https://github.com/104corp/
    const repo = repoUrl.substring(27);
    const languages = [];
    process.stdout.write(`(${counter++}/${total}) processing...\r`);

    for (const file of args.files) {
      try {
        const pkgs = await quiet($`grep -i '^${repo}' '${file}'`);
        const pkgMgr = file.substring(5).replace('.deps.txt', '');
        const language = pkgMgr2Lang(pkgMgr);

        if (args.language) {
          languages.push(language);
          continue;
        }

        for (const pkg of pkgs.stdout.split('\n')) {
          const pkgName = pkg
            .trim()
            .split('\t')
            .slice(pkgMgr.endsWith('.json') ? 1 : 2)
            .join(':');
          if (pkgName.length === 0) continue;

          const line = [app, repoUrl, language, pkgMgr, pkgName].join('\t');
          output.write(line + '\n');
        }
      } catch (error) {}
    }

    if (args.language) {
      if (languages.length !== 0) {
        output.write([repoUrl, languages.join(',')].join('\t') + '\n');
      } else {
        output.write([repoUrl, 'unknown'].join('\t') + '\n');
      }
    }
  }
}

main()
  .then(() => console.log('\ndone'))
  .catch((e) => console.log(`\n{e}`));
