# GitHub API Playground

把 GitHub API 包裝一下，並提供一些有用的功能。

## 需要準備的東西

![GitHub 權限](https://user-images.githubusercontent.com/14554683/118752573-eb2a7c00-b895-11eb-9277-3fb23a90b340.png)

- GitHub Token，
  - 放進 root 中的檔案 `token.txt`，最後採用
  - 放進環境變數 `GH_PAT`，次採用
  - 使用參數 `-t`、`--token` 注入，優先採用

## 有哪些功能

- search: 透過 [Search API](https://docs.github.com/en/rest/search) 搜尋並額外搜尋該 Repo 的資訊。
- search-repos: 搜尋 Repo 列表
- diff-branch: 輸入 search 的結果後，找出所有其他分支的相異資料

所有可執行的檔案，相關參數詳見 `-h`，例如：

```shell
npx ts-node src/search.ts -h
npx ts-node src/search-repos.ts -h
npx ts-node src/diff-branch.ts -h
```

### 好用腳本

- `checked-missed.sh` 透過 search-repo 和 search 之間的結果交叉比對，找到 search 還遺漏了哪些 repo
- `scripts/merge-repos.sh` 整合多個 repo 進單一資料
- `compact-keys.sh` 本多個檔案的資料整合進單一資料中，例如 composer.json 的 require

### 好用函式

尋找各個相依套件是直接使用 GPL 的：

#### NPM

```shell
$ awk '{print $2}' data/package.json.deps.txt \
  | sort -u \
  | xargs -P 8 -I{} sh -c 'curl "https://registry.npmjs.org/{}/latest" -s \
  | jq -r '"'"'select(.name != null) | [.name, .license|tostring] | @tsv'"'"' \
  | tee -a data/package.json.deps.license.txt'
$ awk '{print $1 "\t" $2}' data/package.json.deps.license.txt | grep '.*GPL.*'
easejs GPL-3.0+
express-sitemap GPL-3.0
hipchatter GPL-2.0
intro.js AGPL-3.0
mariadb LGPL-2.1-or-later
pm2 AGPL-3.0
sonarqube-scanner LGPL-3.0
```

#### Composer

```shell
$ awk '{print $2}' data/composer.json.deps.txt \
  # 避免特定 vendor 的套件
  | grep -v '^104' \
  # 避免非套件的相依，例如 php
  | grep '\/' \
  | sort -u \
  | xargs -P 8 -I{} sh -c 'curl ''https://repo.packagist.org/p2/{}.json\'' -s \
  | jq -r '"'"'.packages[] | to_entries | .[].value | select(has("name")) | [.name, .license|tostring] | @tsv''"'"' \
  | tee -a data/composer.json.deps.license.txt'
$ awk '{print $1 "\t" $2}' data/composer.json.deps.license.txt | grep '.*GPL.*'
matomo/device-detector ["LGPL-3.0-or-later"]
php-amqplib/php-amqplib ["LGPL-2.1-or-later"]
phpoffice/phpexcel ["LGPL-2.1"]
phpmailer/phpmailer ["LGPL-2.1-only"]
silvertipsoftware/wkhtmltopdf-amd64 ["LGPL-3.0-only"]
```
