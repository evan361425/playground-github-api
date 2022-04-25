**GitHub Search API**

搜尋 104corp 內所有檔名含有**特定檔名**且為 YAML 檔的 repo 並存進 SQLite 中

- [需要準備的東西](#需要準備的東西)
- [SQL Schema](#sql-schema)
  - [repos](#repos)
    - [example](#example)
  - [files](#files)
    - [example](#example-1)
- [可調整參數](#可調整參數)
  - [環境變數](#環境變數)
  - [程式碼中](#程式碼中)
- [SQL 好用指令](#sql-好用指令)
- [NPM 可用指令](#npm-可用指令)
- [提供的 SQL Scheme](#提供的-sql-scheme)

## 需要準備的東西

![GitHub 權限](https://user-images.githubusercontent.com/14554683/118752573-eb2a7c00-b895-11eb-9277-3fb23a90b340.png)

- GitHub Token
  - 可放進環境變數 `GITHUB_TOKEN` 或放進 root 中的檔案 `token.cert`。
- SQLite
  - 按照 [schema](#提供的-sql-scheme) 去建立指定的 table。

## SQL Schema

### repos

用來放所有 repository 的資訊

- id（由 GitHub 提供）
- name
- description

#### example

```
278014566|104-CMS-Frontend|CMS專案前端靜態
```

### files

用來放檔案的資訊和資料

- id（Auto increment）
- repo_id（由 GitHub 提供）
- file_name（檔名）
- file_path（路徑，含檔名）
- file_size
- branch_names（所有共用此檔案的 branch，用 `,` 區隔，例：`develop,staging,production`）
- branch_is_default（是否為預設的 branch）
- api_url（可以透過 API with Authorization 去獲得檔案資料）
- html_url（GitHub 網址）
- yml_content
- json_content（若 YAML 格式錯誤，就會為空字串）

#### example

```
3|93044412|.example.yml|2017/index/sample/.example.yml|722|master|1|https://api.github.com/repositories/93044412/contents/2017/index/sample/.example.yml?ref=9a199d557d29f2d3eceb0130f6882b697059026a|https://github.com/104corp/104-aws-training/blob/9a199d557d29f2d3eceb0130f6882b697059026a/2017/index/sample/.example.yml|language: php\nos:\n- linux\nscript: echo "do nothing."\nbefore_deploy:\n  - zip -r latest *\n  - test -d dpl_cd_upload || mkdir dpl_cd_upload\n  - mv latest.zip dpl_cd_upload/latest.zip\ndeploy:\n  - provider: s3\n    access_key_id: $aws_access_key\n    secret_access_key:\n      secure: $aws_secure_key\n    local_dir: dpl_cd_upload\n    skip_cleanup: true\n    region: us-west-2\n    on:\n      branch: master\n    bucket: "${user}-web-codedeploy"\n  - provider: codedeploy\n    access_key_id: $aws_access_key\n    secret_access_key:\n      secure: $aws_secure_key\n    bucket: "${user}-web-codedeploy"\n    key: latest.zip\n    application: ${user}-codedeploy-app\n    deployment_group: master\n    region: us-west-2\n    on:\n      branch: master|{"language":"php","os":["linux"],"script":"echo \\"do nothing.\\"","before_deploy":["zip -r latest *","test -d dpl_cd_upload || mkdir dpl_cd_upload","mv latest.zip dpl_cd_upload/latest.zip"],"deploy":[{"provider":"s3","access_key_id":"$aws_access_key","secret_access_key":{"secure":"$aws_secure_key"},"local_dir":"dpl_cd_upload","skip_cleanup":true,"region":"us-west-2","on":{"branch":"master"},"bucket":"${user}-web-codedeploy"},{"provider":"codedeploy","access_key_id":"$aws_access_key","secret_access_key":{"secure":"$aws_secure_key"},"bucket":"${user}-web-codedeploy","key":"latest.zip","application":"${user}-codedeploy-app","deployment_group":"master","region":"us-west-2","on":{"branch":"master"}}]}
```

## 可調整參數

### 環境變數

- [shared](src/shared.ts)
  - 可設定 `FOLDER_PREFIX`，來客製化輸出的位置
- [get-file](src/get-file.ts)
  - 必須要有：`FILENAME`。
  - `LANGUAGE`，預設為 `YAML`

### 程式碼中

- [shared](src/shared.ts)
  - 輸出的檔案預設資料夾為 [`data`](data/)。
  - 輸出的 sql 檔預設資料夾為 [`db`](db/)。
- [get-file](src/get-file.ts)
  - 搜尋參數 `defaultQuery`，預設為 `['org:104corp', 'language:YAML', 'filename:FILENAME']`。
  - 忽略含有的資料夾 `ignoringFolders`，預設為 `['node_modules', 'vendor']`
- [get-branches](src/get-branches.ts)
  - 讓所有 branch 名稱都小寫 `branchNameToLowerCase`，預設為 `true`。
  - 忽略特定 branch 名稱的開頭 `ignoreBranchPrefixes`，預設為

```JSON
[
  "feature/",
  "featrue/",
  "feat/",
  "fix/",
  "dependabot/",
  "bugfix/",
  "bugfix_",
  "bug/",
  "hotfix/",
  "hotfix_"
]
```

## SQL 好用指令

- 找特定語言的 repo

```sql
SELECT r.repo_name
FROM files f
JOIN repos r ON r.id = f.repo_id
WHERE yml_content LIKE '%language: python%'
GROUP BY f.repo_id
LIMIT 10;
```

如果要尋找 `java` 語言，因為會和 `javascript` 有所重疊，可以改搜尋 `json_content`，
或者結尾加上 `\n`。

- 找使用 `codedeploy` 的 repo

```sql
SELECT r.repo_name
FROM files f
JOIN repos r ON r.id = f.repo_id
WHERE yml_content LIKE '%provider: codedeploy%'
GROUP BY f.repo_id
LIMIT 10;
```

- 找所有 branches 的名稱

```sql
WITH RECURSIVE split(branch_name, branch_names) AS (
    SELECT
    '', -- branch_name
    branch_names
    FROM files

    UNION ALL

    SELECT
    substr(branch_names, 0, instr(branch_names, ',')),
    substr(branch_names, instr(branch_names, ',')+1)
    FROM split WHERE branch_names <> ''
)
SELECT DISTINCT(branch_name)
FROM split;
```

## NPM 可用指令

一次跑完全部

```
$ npm run build
```

- 在 `104corp` 中獲得所有檔名含有 `FILENAME` 且為檔案類型為 `YAML` 的檔案
  - **耗時約兩分鐘**

```sh
$ npm run get-file
```

- 取得各個檔案在各個 branches 的資料
  - **耗時約三十分鐘**

```sh
$ npm run get-branches
```

- 把 yaml 檔轉成 json 檔

```sh
$ npm run yaml-to-json
```

- 把所有檔案轉成 sql 檔

```sh
$ npm run yaml-to-sqlite
$ npm run makefile-to-sqlite
```

- 寫進 SQLite DB

```sh
$ sqlite3 example-yml.db ".read repo-rows.sql"
$ sqlite3 example-yml.db ".read file-rows.sql"
```

- 取出 Travis YAML 檔案的 command

```sh
$ npm run get-command
```

若執行本程式，需要先執行 `npm run get-file` 還有提供 `session.cert` 來當作 `Authorization` 的 token。

## 提供的 SQL Scheme

- [YAML](sqls/create-yaml.sql)

  - Travis content
  - CodeBuild content

- [Travis](sqls/create-travis.sql)
  - Travis configuration
