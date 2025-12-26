/* global EmscriptenModule */

import { FFAVCDecoder } from './ffavc-decoder';
import { FFAVCDecoderFactory } from './ffavc-decoder-factory';
import { FFAVC } from './types';
import createFFAVC from './wasm/ffavc';

export interface moduleOption {
  /**
   * Link to wasm file.
   */
  locateFile?: (file: string) => string;
}

export const FFAVCInit = (moduleOption: moduleOption = {}): Promise<FFAVC> =>
  createFFAVC(moduleOption).then((module: FFAVC) => {
    ensureHeap(module);
    binding(module);
    return module;
  });

const ensureHeap = (module: FFAVC) => {
  const anyModule = module as any;
  if (!anyModule.HEAPU8) {
    const memory =
      anyModule.wasmMemory ||
      anyModule.memory ||
      anyModule.asm?.memory ||
      anyModule.wasm?.memory ||
      anyModule.wasmExports?.memory ||
      anyModule.wasm?.exports?.memory;
    if (memory?.buffer) {
      anyModule.HEAPU8 = new Uint8Array(memory.buffer);
    }
  }
  if (!anyModule.HEAP8 && anyModule.HEAPU8 && anyModule.HEAPU8.buffer) {
    anyModule.HEAP8 = new Int8Array(anyModule.HEAPU8.buffer);
  }
  if (!anyModule.HEAP8 || !anyModule.HEAP8.buffer) {
    throw new Error(
      'FFAVC module missing HEAP8. Rebuild ffavc with emcc -s LEGACY_RUNTIME=1 -s EXPORTED_RUNTIME_METHODS=[\'HEAP8\',\'HEAPU8\'] or expose wasm memory on the Module.'
    );
  }
};

const binding = (module: FFAVC) => {
  module.FFAVCDecoderFactory = FFAVCDecoderFactory;
  FFAVCDecoderFactory.module = module;
  module.FFAVCDecoder = FFAVCDecoder;
  FFAVCDecoder.module = module;
};
