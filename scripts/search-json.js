const p = require('argparse');

const parser = new p.ArgumentParser();
parser.add_argument('__');
parser.add_argument('files', {
  nargs: '+',
});
parser.add_argument('-i', '--input');

const args = parser.parse_args();
const names = await quiet(
  $`awk '{print $NF}' ${args.input} | awk -F'/' '{print $NF}'`,
);
for (let name of names.stdout.split('\n')) {
  name = name.trim();
  const list = [];
  for (const file of args.files) {
    const exist = await quiet(
      $`jq -rc 'select(.repository.name == "${name}") | .name' ${file}`,
    );
    if (exist.stdout !== '') {
      list.push(exist.stdout.trim());
    }
  }

  console.log(`${name} ${list.join(' ')}`);
}
