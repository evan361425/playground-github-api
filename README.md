**GitHub API**

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
$ npx ts-node src/search.ts -h
$ npx ts-node src/search-repos.ts -h
$ npx ts-node src/diff-branch.ts -h
```

### 好用腳本

- `checked-missed.sh` 透過 search-repo 和 search 之間的結果交叉比對，找到 search 還遺漏了哪些 repo
- `scripts/merge-repos.sh` 整合多個 repo 進單一資料
- `compact-keys.sh` 本多個檔案的資料整合進單一資料中，例如 composer.json 的 require
