/**
 * Utilitário de Alta Compressão de Imagens no Cliente / Navegador
 * Otimizado para Cloudflare R2 com WebP (máx 1280x720, qualidade 0.75 / 0.8)
 * e conversão direta para Blob/File para upload com custo zero de tráfego (egress free).
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 a 1.0 (0.75 a 0.80 é a especificação oficial de campo)
}

export interface CompressedImageResult {
  dataUrl: string;
  blob: Blob;
  sizeBytes: number;
  compressionRatio: string;
}

export async function compressImageToUltraLightWebP(
  source: string | HTMLVideoElement | HTMLCanvasElement,
  options: CompressionOptions = {}
): Promise<CompressedImageResult> {
  const {
    maxWidth = 1280,
    maxHeight = 720,
    quality = 0.75,
  } = options;

  return new Promise((resolve, reject) => {
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D | null;

    const processCanvas = (c: HTMLCanvasElement) => {
      let compressedDataUrl = c.toDataURL('image/webp', quality);
      let mimeType = 'image/webp';
      if (!compressedDataUrl.startsWith('data:image/webp')) {
        compressedDataUrl = c.toDataURL('image/jpeg', quality);
        mimeType = 'image/jpeg';
      }

      c.toBlob(
        (blob) => {
          if (!blob) {
            // Fallback caso toBlob falhe
            const byteString = atob(compressedDataUrl.split(',')[1]);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }
            const fallbackBlob = new Blob([ab], { type: mimeType });
            resolve({
              dataUrl: compressedDataUrl,
              blob: fallbackBlob,
              sizeBytes: fallbackBlob.size,
              compressionRatio: `${Math.round(fallbackBlob.size / 1024)} KB`,
            });
            return;
          }

          resolve({
            dataUrl: compressedDataUrl,
            blob,
            sizeBytes: blob.size,
            compressionRatio: `${Math.round(blob.size / 1024)} KB`,
          });
        },
        mimeType,
        quality
      );
    };

    if (source instanceof HTMLCanvasElement) {
      processCanvas(source);
      return;
    }

    if (source instanceof HTMLVideoElement) {
      let width = source.videoWidth || 640;
      let height = source.videoHeight || 480;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }

      canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context unavailable'));

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(source, 0, 0, width, height);

      processCanvas(canvas);
      return;
    }

    if (typeof source === 'string') {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context unavailable'));

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        processCanvas(canvas);
      };
      img.onerror = reject;
      img.src = source;
    }
  });
}
