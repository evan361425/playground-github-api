import { readFileSync, WriteStream } from 'fs';
import { branchFile, metadataInfo } from '../types';
import { METADATA_INDEX } from './misc';

const isFirstMap: { [key: string]: boolean } = {};

export function writeMetadata(
  stream: WriteStream,
  metadata: metadataInfo,
): void {
  const columns = columnSanitize([
    metadata.repo_id,
    metadata.repo_name,
    metadata.repo_description ?? '',
  ]);

  stream.write(`${getDelimiter('_metadata')}(${columns})`);
}

export function getDelimiter(key: string): string {
  if (isFirstMap[key] === undefined) {
    isFirstMap[key] = false;
    return '';
  }
  return ',\n';
}

export function getMetadata(path: string): metadataInfo {
  return JSON.parse(readFileSync(path).toString());
}

export function getBranches(path: string): branchFile | undefined {
  try {
    return JSON.parse(readFileSync(path).toString());
  } catch (error) {
    return undefined;
  }
}

export function getExtension(fileName: string): string {
  fileName = fileName.slice(0, -METADATA_INDEX);
  return fileName.slice(fileName.lastIndexOf('.') + 1); // plus one to remove "."
}

export function columnSanitize(columns: unknown[]): string {
  return columns
    .map((column) => {
      if (column === null) {
        return 'NULL';
      } else if (typeof column !== 'string') {
        return column;
      } else {
        return '"' + _escapeString(column) + '"';
      }
    })
    .join(',');

  function _escapeString(val: string) {
    return val.replace(/[\0\n\r\b\t\\'"\x1a]/g, function (s) {
      switch (s) {
        case '\0':
          return '\\0';
        case '\n':
          return '\\n';
        case '\r':
          return '\\r';
        case '\b':
          return '\\b';
        case '\t':
          return '\\t';
        case '\x1a':
          return '\\Z';
        case "'":
          return "''";
        case '"':
          return '""';
        default:
          return '\\' + s;
      }
    });
  }
}
