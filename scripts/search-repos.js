const { createInterface } = require('readline');
const p = require('argparse');
const { createReadStream, createWriteStream } = require('fs');

let debug = false;

function parseArgs() {
  const argParser = new p.ArgumentParser({
    description: 'Parse XML to JS object',
  });
  argParser.add_argument('__');
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
  argParser.add_argument('--framework', {
    help: 'Get framework only',
    action: 'store_true',
  });
  argParser.add_argument('--one', {
    help: 'Run one only',
    action: 'store_true',
  });
  argParser.add_argument('--debug', {
    action: 'store_true',
  });
  return argParser.parse_args();
}

const pkgMgrFramework = {
  'package.json': [
    { p: 'express', n: 'Express' },
    { p: 'socket.io', n: 'socket.io' },
  ],
  'composer.json': [
    { p: 'laravel/framework', n: 'Laravel' },
    { p: 'slim/slim', n: 'Slim' },
    { p: '104corp/sledium', n: 'Sledium' },
  ],
  'pom.xml': [{ p: ['dependency', 'org.springframework.boot'], n: 'Spring' }],
  'build.gradle': [
    { p: ['dependency', 'org.springframework.boot'], n: 'Spring' },
    { p: ['dependency', 'org.springframework', 'spring-webmvc'], n: 'Spring' },
  ],
};

const pkgMgr2Lang = {
  'composer.json': 'PHP',
  'package.json': 'JavaScript',
  'pom.xml': 'Java',
  'build.gradle': 'Java',
};

function q(func) {
  return debug ? func : quiet(func);
}

/**
 * @param {string} fileName
 * @returns {AsyncGenerator<string>}
 */
async function* iterFile(fileName) {
  const totalRaw = await quiet($`wc -l ${fileName} | awk '{print $1}'`);
  const total = totalRaw.stdout.trim();
  if (!(parseInt(total) > 0)) {
    console.log(`empty ${fileName}`);
    return;
  }

  const rl = createInterface({
    input: createReadStream(fileName),
    crlfDelay: Infinity,
  });
  let counter = 1;

  for await (const line of rl) {
    try {
      process.stdout.write(`(${counter++}/${total}) processing...\r`);
      yield line.trim();
    } catch (error) {}
  }
}

/**
 * @param {string} repoInfo
 * @param {object} files
 * @returns {AsyncGenerator<{
 *  repo: string;
 *  pkgs: {stdout:string};
 *  pkgMgr: string;
 *  file: string;
 * }>}
 */
async function* iterRepo(repoUrl, args) {
  // Remove https://github.com/104corp/
  const repo = repoUrl.substring(27);

  for (const file of args.files) {
    try {
      const pkgs = await q($`grep -i '^${repo}\\t' '${file}'`);
      const pkgMgr = file.substring(5).replace('.deps.txt', '');

      yield { file, repo, pkgs, pkgMgr };
    } catch (error) {}
  }
}

/**
 * @param {string} repo
 * @param {string|string[]} pattern
 * @param {string} file
 * @returns {Promise<boolean>}
 */
async function grepExist(repo, pattern, file) {
  try {
    if (Array.isArray(pattern)) {
      if (pattern.length === 2) {
        await q(
          $`grep -i '^${repo}\\t${pattern[0]}\\t${pattern[1]}' '${file}'`,
        );
      } else if (pattern.length === 3) {
        await q(
          $`grep -i '^${repo}\\t${pattern[0]}\\t${pattern[1]}\\t${pattern[2]}' '${file}'`,
        );
      } else {
        return false;
      }
    } else {
      await q($`grep -i '^${repo}\\t${pattern}' '${file}'`);
    }
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  const args = parseArgs();
  debug = Boolean(args.debug);
  const output = createWriteStream(args.output, { flags: 'a' });
  console.log(JSON.stringify(args, undefined, 2));

  for await (const repoInfo of iterFile(args.input)) {
    const [app, repoUrl] = repoInfo.split('\t');
    const simple = [];
    for await (const data of iterRepo(repoUrl, args)) {
      if (args.framework) {
        for (const framework of pkgMgrFramework[data.pkgMgr]) {
          if (await grepExist(data.repo, framework.p, data.file)) {
            simple.push(framework.n);
          }
        }
      } else if (args.language) {
        simple.push(pkgMgr2Lang[data.pkgMgr]);
      } else {
        for (const pkg of data.pkgs.stdout.split('\n')) {
          const pkgName = pkg
            .trim()
            .split('\t')
            .slice(pkgMgr.endsWith('.json') ? 1 : 2)
            .join(':');
          if (pkgName.length === 0) continue;

          const line = [
            app,
            repoUrl,
            pkgMgr2Lang[data.pkgMgr],
            data.pkgMgr,
            pkgName,
          ].join('\t');
          output.write(line + '\n');
        }
      }
    }

    if (simple.length !== 0) {
      const uniqSimple = simple
        .filter((value, index, self) => self.indexOf(value) === index)
        .join(',');
      output.write([repoInfo, uniqSimple].join('\t') + '\n');
    } else {
      output.write([repoInfo, 'unknown'].join('\t') + '\n');
    }

    if (args.one) {
      break;
    }
  }
}

main()
  .then(() => console.log('\ndone'))
  .catch((e) => console.log(`\n${e}`));
