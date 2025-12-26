import resolve from '@rollup/plugin-node-resolve';
import commonJs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import esbuild from 'rollup-plugin-esbuild';

const fixImportMetaUrlForNode = () => ({
  name: 'fix-import-meta-url-for-node',
  enforce: 'pre',
  transform(code, id) {
    const normalizedId = id.split('\\').join('/');
    if (!normalizedId.endsWith('/src/wasm/ffavc.js')) {
      return null;
    }
    if (!code.includes('import.meta.url')) {
      return null;
    }
    return {
      code: code.replace(/import\.meta\.url/g, "new URL('file:' + __filename).href"),
      map: null,
    };
  },
});

const umdNodeConfig = {
  input: 'src/ffavc.ts',
  output: [
    {
      name: 'ffavc',
      format: 'umd',
      exports: 'named',
      sourcemap: true,
      file: 'lib-node/ffavc.umd.js',
    },
  ],
  plugins: [fixImportMetaUrlForNode(), esbuild({ tsconfig: 'tsconfig.json', minify: false }), json(), resolve(), commonJs()],
};

export default [umdNodeConfig];
