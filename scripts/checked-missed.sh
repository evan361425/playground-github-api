#!/bin/bash

select=

if [[ -n $2 ]]; then
  select="select($2) | "
fi

test -d temp/ || mkdir temp

pkg_mgr=$1
f1=temp/language.txt
f2=temp/package.txt
f3=temp/diff.txt
f4=temp/missed.txt
f5=temp/missed.jsonl

jq -r "${select}select(.archived == false) | select(.fork == false) | [.name, .id] | @tsv" data/repos.jsonl | sort | uniq | sort > $f1
jq -r '[.repository.name, .repository.id] | @tsv' "data/$pkg_mgr.jsonl" | sort | uniq | sort > $f2

diff $f1 $f2 | grep '^< ' | cut -c 3- > $f3

test -f $f4 && rm $f4

while read -r info ; do
  test -z "$info" && break;

  repo_name=$(echo "$info" | awk '{print $1 " "}')
  if [[ "$repo_name" == *"-ap-"* ]] \
    || [[ "$repo_name" == *"-ap "* ]] \
    || [[ "$repo_name" == *"ehrap_"* ]] \
    || [[ "$repo_name" == *"-AP-"* ]]; then
    echo "Ignore $repo_name"
    continue;
  fi

  repo_id=$(echo "$info" | awk '{print $2}')
  gh api -i --silent "/repositories/$repo_id/contents/$1" | \
    head -n 1 | \
    grep -q '404 Not Found' || \
    echo "$info" >> $f4

  echo "Finish $repo_name"
done < $f3

template="{name: \"$pkg_mgr\", path: \"$pkg_mgr\", url: (\"https://api.github.com/repositories/\" + (.id|tostring) + \"/contents/$pkg_mgr\"), repository: .}"

awk '{print $1}' $f4 \
  | xargs -I'_' jq -c "select(.name == \"_\") | $template" data/repos.jsonl \
  > $f5

cat "data/$pkg_mgr.jsonl" $f5 > "data/$pkg_mgr-merged.jsonl"
