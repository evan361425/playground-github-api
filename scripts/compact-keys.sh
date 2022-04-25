#!/bin/bash

find "$1" -name composer.json -print0 | \
  xargs -0 jq -r "select($2 != null) | $2 | keys | .[]" >> "$3"
