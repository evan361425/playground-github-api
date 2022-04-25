import { createWriteStream, readFileSync } from 'fs';
import {
  columnSanitize,
  getBranches,
  getDelimiter,
  getMetadata,
  listDirectories,
  listFiles,
  METADATA_EXT,
  METADATA_INDEX,
  writeMetadata,
} from './helpers';
import { metadataInfo } from './types';

const dbFolder = 'db';
const outputFolder = 'data';

void (async () => {
  const outputRepo = createWriteStream(`${dbFolder}repo-rows.sql`);
  const outputFile = createWriteStream(`${dbFolder}file-rows.sql`);

  const repoColumns = ['`id`', 'repo_name', 'repo_description'];
  const fileColumns = [
    // '`id`', this is auto increment
    'repo_id',
    'file_name',
    'file_path',
    'file_size',
    'branch_names',
    'branch_is_default',
    'api_url',
    'html_url',
    'yml_content',
  ];

  outputRepo.write(`INSERT INTO repos (${repoColumns.join(',')})\nVALUES\n`);
  outputFile.write(`INSERT INTO files (${fileColumns.join(',')})\nVALUES\n`);

  const folders = listDirectories(outputFolder);
  const total = folders.length;
  let counter = 0;

  for (const folder of folders) {
    const files = listFiles(`${outputFolder}${folder}`).filter((fileName) =>
      fileName.endsWith(METADATA_EXT),
    );
    console.log(`(${++counter}/${total}) working on ${folder}`);

    let builtMetadata = false;
    for (const metadataName of files) {
      const metadata = getMetadata(`${outputFolder}${folder}/${metadataName}`);
      const fileName = metadataName.slice(0, -METADATA_INDEX);
      const filePath = `${outputFolder}${folder}/${fileName}`;

      if (!builtMetadata) {
        writeMetadata(outputRepo, metadata);
        builtMetadata = true;
      }

      const branches = getBranches(`${filePath}.branches.json`);
      if (branches === undefined) {
        console.log(`can't find branches on ${filePath}`);
        continue;
      }

      for (const entry of Object.entries(branches)) {
        if (entry[0] === 'origin') {
          //writeFile(metadata, entry[1], filePath, '');
        } else {
          const branchName = entry[1][0].split('/').join('-');
          writeFile(metadata, entry[1], filePath, `.${branchName}`);
        }
      }
    }
  }

  outputRepo.write(';');
  outputFile.write(';');
  outputRepo.close();
  outputFile.close();

  function writeFile(
    metadata: metadataInfo,
    branches: string[],
    filePath: string,
    branchName: string,
  ) {
    const content = readFileSync(`${filePath}${branchName}`);
    const columns = columnSanitize([
      metadata.repo_id,
      metadata.file_name,
      metadata.file_path,
      metadata.file_size,
      branches.join(','),
      branchName === '', // is default
      metadata.file_urls.api,
      metadata.file_urls.html,
      content.toString(),
    ]);

    outputFile.write(`${getDelimiter('makefile')}(${columns})`);
  }
})();
