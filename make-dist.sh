#!/bin/bash
# This script creates the distribution files. Usage:
# ./make-dist.sh

# remove dist files 
rm -rf dist/*

# compresses JavaScript files
cat \
    src/jquery.htmlparser.js \
| uglifyjs \
    --compress \
    --mangle \
    --preamble "/*! jQuery.htmlParser v0.1.0 | Copyright (c) 2017 Gonzalo Chumillas | https://github.com/soloproyectos-js/jquery.htmlparser */" \
    -o dist/jquery.htmlparser.min.js
