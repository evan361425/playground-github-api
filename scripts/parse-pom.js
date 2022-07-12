const { XMLParser } = require('fast-xml-parser');
const p = require('argparse');
const { readFileSync } = require('fs');

function parseArgs() {
  const argParser = new p.ArgumentParser({
    description: 'Parse POM to JSON',
  });
  argParser.add_argument('-f', '--file', {
    help: 'file to parse',
  });
  return argParser.parse_args();
}

function main(a) {
  const args = parseArgs();
  const parser = new XMLParser();

  // from stdin
  const data = parser.parse(readFileSync(args.file ?? 0, 'utf-8'));
  if (!data.project) {
    return process.stdout.write(JSON.stringify(data) + '\n');
  }
  const project = data.project;

  // name
  let groupId;
  let artifactId;

  if (project.parent) {
    groupId = project.parent.groupId;
    artifactId = project.parent.artifactId;
  }
  groupId = groupId ?? project.groupId;
  artifactId = artifactId ?? project.artifactId;

  // license
  const licenses = project.licenses
    ? Array.isArray(project.licenses.license)
      ? project.licenses.license
      : [project.licenses.license]
    : undefined;
  const license = licenses
    ? licenses
        .map((license) => license.name.replace(/,/g, '').replace(/ /g, '-'))
        .join(' ')
    : 'unknown';

  process.stdout.write(`${groupId} ${artifactId} ${license}\n`);
}

main();
