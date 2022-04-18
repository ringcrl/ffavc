#!/bin/bash -e

SOURCE_DIR=..
BUILD_DIR=../build

if [ ! -d "./wasm" ]; then
  mkdir ./wasm
fi

RELEASE_CONF="-Oz -s"
CMAKE_BUILD_TYPE=Relese
if [[ $@ == *debug* ]]; then
  CMAKE_BUILD_TYPE=Debug
  RELEASE_CONF="-O0 -g3 -s SAFE_HEAP=1"
  BUILD_TS=""
fi

emcmake cmake -S $SOURCE_DIR -B $BUILD_DIR -G Ninja -DCMAKE_BUILD_TYPE="$CMAKE_BUILD_TYPE"

cmake --build $BUILD_DIR --target ffavc

emcc $RELEASE_CONF -std=c++17 \
  -I$SOURCE_DIR/src/ \
  -I$SOURCE_DIR/vendor/ffmpeg/include/ \
  -I$SOURCE_DIR/vendor/libpag/include/ \
  $SOURCE_DIR/vendor/ffmpeg/web/wasm/*.a \
  $BUILD_DIR/libffavc.a \
  src/ffavc_wasm_bindings.cpp \
  --no-entry \
  --bind \
  -s WASM=1 \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s EXPORT_NAME="FFAVCInit" \
  -s ERROR_ON_UNDEFINED_SYMBOLS=0 \
  -s MODULARIZE=1 \
  -s NO_EXIT_RUNTIME=1 \
  -s ENVIRONMENT="web" \
  -s EXPORT_ES6=1 \
  -s USE_ES6_IMPORT_META=0 \
  -o ./wasm/ffavc.js
