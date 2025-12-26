# Node 编译流程

```sh
# 添加编译环境
source "/home/ubuntu/emsdk/emsdk_env.sh"

# 编译 ffavc
./build_ffmpeg.sh

# 编译 emcc
cd web/script
./build.sh --env node

# web/script/build.sh
# web：-s ENVIRONMENT="web"
# node：--env node
```

编译完成后产物会在：
- `web/lib-node/ffavc.umd.js`
- `web/lib-node/ffavc.wasm`
