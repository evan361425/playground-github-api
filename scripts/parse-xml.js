const { XMLParser } = require('fast-xml-parser');
const p = require('argparse');
const { readFileSync } = require('fs');

function parseArgs() {
  const argParser = new p.ArgumentParser({
    description: 'Parse XML to JS object',
  });
  argParser.add_argument('files', {
    help: 'file to parse',
    nargs: '+',
  });
  return argParser.parse_args();
}

function parseFolder(f) {
  const index = f.lastIndexOf('/');
  f = f.substring(0, index);
  const index2 = f.lastIndexOf('/');
  return f.substring(index2 === -1 ? 0 : index2 + 1);
}

function parseDep(obj, versions) {
  if (typeof obj.version === 'string' && obj.version.startsWith('$')) {
    obj.version =
      versions[obj.version.substring(2, obj.version.length - 1)] ?? obj.version;
  }
  if (!obj.groupId) {
    obj.groupId = 'root';
  }
  return [obj.groupId, obj.artifactId, obj.version].join(' ');
}

function* loopDep(data, path, versions = {}) {
  let child = data;
  try {
    path.split('.').forEach((e) => (child = child[e]));
  } catch (error) {
    return;
  }

  if (!Array.isArray(child)) {
    yield parseDep(child, versions);
  } else {
    for (const e of child) {
      yield parseDep(e, versions);
    }
  }
}

async function main() {
  const args = parseArgs();
  const parser = new XMLParser();

  for (const file of args.files) {
    const folder = parseFolder(file);
    const data = parser.parse(readFileSync(file)).project;

    const filters = {
      'dependencies.dependency': 'dep',
      'dependencyManagement.dependencies.dependency': 'dep',
      'build.pluginManagement.plugins.plugin': 'plugin',
      'build.plugins.plugin': 'plugin',
    };

    let counter = 0;
    Object.entries(filters).forEach((entry) => {
      for (const dep of loopDep(data, entry[0], data.properties)) {
        counter++;
        console.log(folder + ' ' + entry[1] + ' ' + dep);
      }
    });
    if (counter === 0) {
      console.log(folder + ' empty');
    }
  }
}

main()
  .then(() => console.log('done'))
  .catch((e) => console.log(e));
