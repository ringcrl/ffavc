/* global EmscriptenModule */

import { FFAVCDecoder } from './ffavc-decoder';
import { FFAVC } from './types';

export class FFAVCDecoderFactory {
  public static module: FFAVC;

  public createSoftwareDecoder(pag: EmscriptenModule): FFAVCDecoder | null {
    if (!pag) return null;
    const module = FFAVCDecoderFactory.module;
    if (!module) {
      throw new Error('FFAVC module not initialized. Call FFAVCInit() and wait for it to resolve.');
    }
    if (!FFAVCDecoder.module) {
      FFAVCDecoder.module = module;
    }
    const wasmIns = new module._FFAVCDecoder();
    return new FFAVCDecoder(wasmIns, pag, module);
  }
}
