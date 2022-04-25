import { createWriteStream, readFileSync } from 'fs';
import {
  columnSanitize,
  getBranches,
  getDelimiter,
  getExtension,
  getMetadata,
  listDirectories,
  listFiles,
  METADATA_EXT,
  METADATA_INDEX,
  writeMetadata,
} from './helpers';
import { metadataInfo } from './types';

const outputFolder = 'data';
const dbFolder = 'db';

const withDot = METADATA_INDEX + 1;

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
    'json_content',
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
      const extension = getExtension(metadataName);
      const fileName = metadataName.slice(0, -extension.length - withDot);
      const filePath = `${outputFolder}${folder}/${fileName}`;

      if (!builtMetadata) {
        writeMetadata(outputRepo, metadata);
        builtMetadata = true;
      }

      const branches = getBranches(`${filePath}.${extension}.branches.json`);
      if (branches === undefined) {
        console.log(`can't find branches on ${filePath}`);
        continue;
      }

      for (const entry of Object.entries(branches)) {
        if (entry[0] === 'origin') {
          //writeFile(metadata, entry[1], filePath, '', extension);
        } else {
          const branchName = entry[1][0].split('/').join('-');
          writeFile(
            metadata,
            entry[1],
            filePath,
            `.${extension}.${branchName}`,
            extension,
          );
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
    extension: string,
  ) {
    const ymlContent = readFileSync(`${filePath}${branchName}.${extension}`);
    const jsonContent = getJson(`${filePath}${branchName}.json`);
    const columns = columnSanitize([
      metadata.repo_id,
      metadata.file_name,
      metadata.file_path,
      metadata.file_size,
      branches.join(','),
      branchName === '', // is default
      metadata.file_urls.api,
      metadata.file_urls.html,
      ymlContent.toString(),
      jsonContent,
    ]);

    outputFile.write(`${getDelimiter('yaml')}(${columns})`);
  }

  function getJson(path: string): string {
    try {
      return readFileSync(path).toString();
    } catch (error) {
      return '';
    }
  }
})();
