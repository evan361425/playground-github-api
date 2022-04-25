#!/bin/bash

# Merge repos and find intersection
# $1 - result1, ex: data/result1.jsonl
# $2 - result2, ex: data/result2.jsonl
# $3 - output file, ex: data/uniq.jsonl

echo "$1 has $(jq .repository.name "$1" | sort | uniq | wc -l | awk '{print $1}') repos"
echo "$2 has $(jq .repository.name "$2" | sort | uniq | wc -l | awk '{print $1}') repos"

cat "$1" "$2" | jq -Sc . > temp.jsonl

echo "Total $(jq .repository.name temp.jsonl | sort | uniq | wc -l | awk '{print $1}') unique repos"

jq .repository.name temp.jsonl | sort | uniq | xargs -I{} grep -m 1 {} temp.jsonl > "$3"

rm temp.jsonl
