#!/bin/bash

# jq -r "select(.language == \"$1\") | [.name, .id] | @tsv" data/repos.jsonl | sort | uniq | sort > _language.jsonl
# jq -r '[.repository.name, .repository.id] | @tsv' "data/$2.jsonl" | sort | uniq | sort > _package.jsonl

# diff _language.jsonl _package.jsonl | grep '^< ' | cut -c 3- > _diff.txt

rm _missed.txt

while read -r info ; do
  repo_name=$(echo "$info" | awk '{print $1 " "}')
  if [[ "$repo_name" == *"-ap-"* ]] \
    || [[ "$repo_name" == *"-ap "* ]] \
    || [[ "$repo_name" == *"ehrap_"* ]] \
    || [[ "$repo_name" == *"-AP-"* ]]; then
    continue;
  fi
  repo_id=$(echo "$info" | awk '{print $2}')
  gh api -i --silent "/repositories/$repo_id/contents/$2" | \
    head -n 1 | \
    grep -q '404 Not Found' || \
    echo "$info" >> _missed.txt

  echo "finish $repo_id"
done < _diff.txt

template="{name: \"$2\", path: \"$2\", url: (\"https://api.github.com/repositories/\" + (.id|tostring) + \"/contents/$2\"), repository: .}"

awk '{print $1}' _missed.txt \
  | xargs -I'_' jq -c "select(.name == \"_\") | $template" data/repos.jsonl \
  > _missed.jsonl

cat "data/$2.jsonl" _missed.jsonl > "data/$2-merged.jsonl"
