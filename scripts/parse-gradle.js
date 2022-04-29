const g2js = require('./gradle-parser');
const p = require('argparse');

const parser = new p.ArgumentParser({
  description: 'Parse Gradle to JS object',
});
parser.add_argument('files', {
  help: 'file to parse',
  nargs: '+',
});
const args = parser.parse_args();

const numberChecker = RegExp('\\d');

function parseFolder(f) {
  const index = f.lastIndexOf('/');
  f = f.substring(0, index);
  const index2 = f.lastIndexOf('/');
  return f.substring(index2 === -1 ? 0 : index2 + 1);
}

function hasNumber(str) {
  return numberChecker.test(str) && !str.includes('e104');
}

function e2s(entry) {
  return entry[0].toString() + ' ' + entry[1].toString();
}

function sanitizeStr(str) {
  const index = str.indexOf('//');

  str = str.substring(0, index === -1 ? undefined : index).trim();
  if (['"', "'"].includes(str.charAt(0))) {
    str = str.substring(1, str.length - 1).trim();
  }

  if (str.toLowerCase() === 'utf-8') {
    return;
  }

  return str;
}

function loopValues(data, log, prefix = '') {
  if (Array.isArray(data)) {
    data.forEach((e) => loopValues(e, log, prefix));
  } else if (typeof data === 'object') {
    Object.entries(data).forEach((entry) => {
      if (entry[0] === 'dependencies') {
        entry[1].forEach((dep) => {
          if (typeof dep.type === 'string') {
            if (dep.type.startsWith('test')) {
              return;
            }
          }
          log(
            prefix.concat(
              ['dependency', dep.group, dep.name, dep.version].join(' '),
            ),
          );
        });
        return;
      }

      if (Array.isArray(entry[1])) {
        entry[1].forEach((e) => loopValues(e, log, prefix + entry[0] + '-'));
      } else if (typeof entry[1] === 'number') {
        log('object ' + prefix + e2s(entry));
      } else if (typeof entry[1] === 'string') {
        if (hasNumber(entry[1])) {
          const v = sanitizeStr(entry[1]);
          if (typeof v !== 'string') return;
          log('object ' + prefix + e2s([entry[0], v]));
        }
      } else {
        loopValues(entry[1], log, prefix + entry[0] + '-');
      }
    });
  }
}

async function main(params) {
  for (const file of args.files) {
    const folder = parseFolder(file);
    const parsed = await g2js.parseFile(file);
    loopValues(parsed, (v) => console.log(folder + ' ' + v));
  }
}

main()
  .then(() => console.log('done'))
  .catch((e) => console.log(e));
