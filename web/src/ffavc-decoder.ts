import { FFAVC } from './types';

export interface YUVBuffer {
  data: number[];
  lineSize: number[];
}

export const enum DecoderResult {
  /**
   * The calling is successful.
   */
  Success = 0,
  /**
   * Output is not available in this state, need more input buffers.
   */
  TryAgainLater = -1,
  /**
   * The calling fails.
   */
  Error = -2,
}

const YUV_BUFFER_LENGTH = 3;

export class FFAVCDecoder {
  public static module: FFAVC;

  private wasmIns: any;
  private pag: any;
  private module?: FFAVC;
  private height = 0;
  private buffer: YUVBuffer = { data: [], lineSize: [] };

  private requireModule(): FFAVC {
    const module = this.module || FFAVCDecoder.module;
    if (!module || !module.HEAP8 || !module.HEAP8.buffer) {
      throw new Error('FFAVC module not initialized. Call FFAVCInit() and wait for it to resolve.');
    }
    return module;
  }

  public constructor(wasmIns: any, pag: any, module?: FFAVC) {
    this.wasmIns = wasmIns;
    this.pag = pag;
    if (module) {
      this.module = module;
      if (!FFAVCDecoder.module) {
        FFAVCDecoder.module = module;
      }
    }
  }

  public onConfigure(headers: Uint8Array[], mimeType: string, width: number, height: number): boolean {
    this.height = height;
    const module = this.requireModule();
    const dataOnHeaps = headers.map((header) => {
      if (!header) {
        throw new Error('FFAVCDecoder.onConfigure requires non-empty headers.');
      }
      const length = header.byteLength * header.BYTES_PER_ELEMENT;
      const dataPtr = module._malloc(length);
      const dataOnFFAVC = new Uint8Array(module.HEAP8.buffer, dataPtr, length);
      dataOnFFAVC.set(header);
      return dataOnFFAVC;
    });
    const res = this.wasmIns._onConfigure(dataOnHeaps, mimeType, width, height) as boolean;
    dataOnHeaps.forEach((data) => {
      module._free(data.byteOffset);
    });
    return res;
  }

  public onSendBytes(bytes: Uint8Array, timestamp: number): DecoderResult {
    const module = this.requireModule();
    const length = bytes.byteLength * bytes.BYTES_PER_ELEMENT;
    const dataPtr = module._malloc(length);
    const dataOnFFAVC = new Uint8Array(module.HEAP8.buffer, dataPtr, length);
    dataOnFFAVC.set(bytes);
    const res = this.wasmIns._onSendBytes(dataOnFFAVC, timestamp).value;
    module._free(dataPtr);
    return res;
  }

  public onDecodeFrame(): DecoderResult {
    return this.wasmIns._onDecodeFrame().value;
  }

  public onEndOfStream(): DecoderResult {
    return this.wasmIns._onEndOfStream().value;
  }

  public onFlush() {
    this.wasmIns._onFlush();
  }

  public onRenderFrame(): YUVBuffer | null {
    this.requireModule();
    if (!this.pag || !this.pag.HEAP8 || !this.pag.HEAP8.buffer) {
      throw new Error('PAG module not initialized before calling FFAVCDecoder.onRenderFrame().');
    }
    // Free last frame.
    if (this.buffer.data.length > 0) {
      this.buffer.data.forEach((data) => {
        this.pag._free(data);
      });
      this.buffer = { data: [], lineSize: [] };
    }
    const buffer = this.wasmIns._onRenderFrame() as YUVBuffer;
    // Copy data from FFAVCModule to PAGModule
    for (let index = 0; index < YUV_BUFFER_LENGTH; index++) {
      let length = buffer.lineSize[index] * this.height;
      if (FFAVCDecoder.module.HEAP8.buffer.byteLength - buffer.data[index] < length) {
        console.error('RangeError: invalid array length! YUV buffer out of memory!');
        return null;
      }
      const dataOnFFAVC = new Uint8Array(FFAVCDecoder.module.HEAP8.buffer, buffer.data[index], length);
      const dataPtr = this.pag._malloc(length);
      const dataOnPAG = new Uint8Array(this.pag.HEAP8.buffer, dataPtr, length);
      dataOnPAG.set(dataOnFFAVC);
      this.buffer.data[index] = dataPtr;
      this.buffer.lineSize[index] = buffer.lineSize[index];
    }
    return this.buffer;
  }

  public onRelease() {
    if (this.buffer.data.length > 0) {
      this.buffer.data.forEach((data) => {
        this.pag._free(data);
      });
    }
    this.wasmIns.delete();
  }
}
