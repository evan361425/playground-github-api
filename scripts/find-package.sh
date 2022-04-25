#!/bin/bash

# Find specific package in composer.json
# $1 - folder, ex: data/some-folder
# $2 - package pattern, ex: laravel/framework

find "$1" -name composer.json -print0 | \
  xargs -0 grep -m 1 "$2" | \
  awk -F/ '{print $4}'
  # Find updated_at
  # xargs -I{} \
  #   jq -r 'select(.repository.name == "{}") | [.repository.updated_at, .repository.name] | @tsv' \
  #     "$1/metadata.jsonl"
