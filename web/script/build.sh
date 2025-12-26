#!/bin/bash -e

SOURCE_DIR=$(cd ../.. && pwd)
BUILD_DIR="$SOURCE_DIR/build"
BUILD_TS="npm run build"
TARGET_ENV="web"
IS_DEBUG=0

if [[ $@ == *ENVIRONMENT=\"node\"* || $@ == *ENVIRONMENT=node* || $@ == *--env\ node* || $@ == *--env=node* || $@ == *--node* ]]; then
  TARGET_ENV="node"
fi

echo "-----begin-----"

if [ ! -d "../src/wasm" ]; then
  mkdir ../src/wasm
fi

RELEASE_CONF="-Oz -s"
CMAKE_BUILD_TYPE=Relese
if [[ $@ == *debug* ]]; then
  CMAKE_BUILD_TYPE=Debug
  RELEASE_CONF="-O0 -gsource-map -sSAFE_HEAP=1 -Wno-limited-postlink-optimizations"
  BUILD_TS=""
  IS_DEBUG=1
fi

LIB_DIR="../lib"
WASM_FEATURES=""
if [[ "$TARGET_ENV" == "node" ]]; then
  BUILD_DIR="$SOURCE_DIR/build-node"
  LIB_DIR="../lib-node"
  WASM_FEATURES="-s WASM_BIGINT=0"
  if [[ $IS_DEBUG -eq 0 ]]; then
    BUILD_TS="npm run build:node"
  fi
fi

emcmake cmake -S $SOURCE_DIR -B $BUILD_DIR -G Ninja -DCMAKE_BUILD_TYPE="$CMAKE_BUILD_TYPE"

cmake --build $BUILD_DIR --target ffavc

emcc $RELEASE_CONF -std=c++17 \
  -I$SOURCE_DIR/src/ \
  -I$SOURCE_DIR/vendor/ffmpeg/include/ \
  -I$SOURCE_DIR/vendor/libpag/include/ \
  $SOURCE_DIR/vendor/ffmpeg/web/wasm/*.a \
  $BUILD_DIR/libffavc.a \
  ../src/ffavc_wasm_bindings.cpp \
  --no-entry \
  -lembind \
  -s WASM=1 \
  $WASM_FEATURES \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s MEMORY_GROWTH_GEOMETRIC_STEP=0.25 \
  -s EXPORT_NAME="FFAVCInit" \
  -s ERROR_ON_UNDEFINED_SYMBOLS=0 \
  -s MODULARIZE=1 \
  -s NO_EXIT_RUNTIME=1 \
  -s LEGACY_RUNTIME=1 \
  -s EXPORTED_RUNTIME_METHODS=['HEAP8','HEAPU8'] \
  -s ENVIRONMENT="$TARGET_ENV" \
  -s EXPORT_ES6=1 \
  -s EXPORTED_FUNCTIONS=['_malloc','_free'] \
  -o ../src/wasm/ffavc.js

if [ ! -d "$LIB_DIR" ]; then
  mkdir "$LIB_DIR"
fi

cp -f ../src/wasm/ffavc.wasm "$LIB_DIR"

$BUILD_TS

echo "-----end-----"
