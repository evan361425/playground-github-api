#!/bin/bash

if [[ -n $2 ]]; then
  select="select($2) | "
fi

test -d temp/ || mkdir temp

pkg_mgr=$1
file=appspec.yml
f1=temp/language.txt
f2=temp/package.txt
f3=temp/diff.txt
f4=temp/missed.txt
f5=temp/missed.jsonl
base=data/repos2.jsonl

jq -r "${select}select(.archived == false) | select(.fork == false) | [.name, .id] | @tsv" $base | sort | uniq | sort > $f1
jq -r '[.repository.name, .repository.id] | @tsv' "data/$pkg_mgr.jsonl" | sort | uniq | sort > $f2

diff $f1 $f2 | grep '^< ' | cut -c 3- > $f3

test -f $f4 && rm $f4

i=0
total=$(wc -l $f3 | awk '{print $1}')

echo "Start try $total lines"

while read -r info ; do
  ((i=i+1))
  test -z "$info" && break;

  repo_name=$(echo "$info" | awk '{print $1 " "}')
  status=Ignore
  if [[ "$repo_name" == *"-ap-"* ]] \
    || [[ "$repo_name" == *"-ap "* ]] \
    || [[ "$repo_name" == *"ehrap_"* ]] \
    || [[ "$repo_name" == *"-AP-"* ]]; then
    continue;
  else
    repo_id=$(echo "$info" | awk '{print $2}')
    result=$(gh api -X HEAD -i --silent "/repositories/$repo_id/contents/$file" 2> /dev/null | head -n 1)
    if [[ "$result" == *'404 Not Found'* ]]; then
      status=Empty
    else
      status=Found
      echo "$info" >> $f4
    fi
  fi

  printf "\r%s (%s/%s) %s" $status $i "$total" "$repo_name"
done < $f3

echo ''

if [ ! -f $f4 ]; then
  echo 'No result'
  exit 0
fi

echo "Get $(wc -l $f4 | awk '{print $1}') data"

template="{name: \"$file\", path: \"$file\", url: (\"https://api.github.com/repositories/\" + (.id|tostring) + \"/contents/$file\"), repository: .}"

awk '{print $1}' $f4 \
  | xargs -I'_' jq -c "select(.name == \"_\") | $template" $base \
  > $f5

cat "data/$pkg_mgr.jsonl" $f5 > "data/$pkg_mgr-merged.jsonl"
