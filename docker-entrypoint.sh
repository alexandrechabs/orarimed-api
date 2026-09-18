#!/bin/sh
set -eu

node build/ace.js migration:run --force
exec node build/ace.js serve
