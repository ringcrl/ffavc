# Node 编译流程

```sh
# 添加编译环境
source "/data/github.com/emsdk/emsdk_env.sh"

# 编译 ffavc
./build_ffmpeg.sh

# 编译 emcc
cd web/script
./build.sh

# web/script/build.sh
# web：-s ENVIRONMENT="web"
# node：-s ENVIRONMENT="node"
```
