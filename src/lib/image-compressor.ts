/**
 * Utilitário de Alta Compressão de Imagens no Cliente / Navegador
 * Objetivo: Reduzir fotos de câmeras móveis (que costumam ter 4MB a 12MB)
 * para arquivos ultraleves (~30KB a 80KB) usando WebP com compressão agressiva,
 * mantendo nitidez suficiente para leitura do estojo colorimétrico e auditoria visual.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 a 1.0 (0.45 a 0.55 é o sweet spot para WebP com máxima compressão)
}

export async function compressImageToUltraLightWebP(
  source: string | HTMLVideoElement | HTMLCanvasElement,
  options: CompressionOptions = {}
): Promise<{ dataUrl: string; sizeBytes: number; compressionRatio: string }> {
  const {
    maxWidth = 1024,   // Resolução ideal para auditoria sem peso excessivo
    maxHeight = 768,
    quality = 0.50,    // 50% de qualidade WebP produz redução de ~90-95% em relação ao JPEG nativo
  } = options;

  return new Promise((resolve, reject) => {
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D | null;

    if (source instanceof HTMLVideoElement) {
      // Captura direta do frame da câmera
      let width = source.videoWidth || 640;
      let height = source.videoHeight || 480;

      // Redimensionamento proporcional
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

      // Desenha com interpolação suave
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'medium';
      ctx.drawImage(source, 0, 0, width, height);

      // Converte para WebP (fallback para JPEG caso o browser muito antigo não suporte)
      let compressedDataUrl = canvas.toDataURL('image/webp', quality);
      if (!compressedDataUrl.startsWith('data:image/webp')) {
        compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      }

      // Estima tamanho em bytes pelo base64
      const head = 'data:image/webp;base64,';
      const base64Length = compressedDataUrl.length - (compressedDataUrl.indexOf(',') + 1);
      const sizeBytes = Math.round((base64Length * 3) / 4);

      resolve({
        dataUrl: compressedDataUrl,
        sizeBytes,
        compressionRatio: `${Math.round(sizeBytes / 1024)} KB`,
      });
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
        ctx.imageSmoothingQuality = 'medium';
        ctx.drawImage(img, 0, 0, width, height);

        let compressedDataUrl = canvas.toDataURL('image/webp', quality);
        if (!compressedDataUrl.startsWith('data:image/webp')) {
          compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        const base64Length = compressedDataUrl.length - (compressedDataUrl.indexOf(',') + 1);
        const sizeBytes = Math.round((base64Length * 3) / 4);

        resolve({
          dataUrl: compressedDataUrl,
          sizeBytes,
          compressionRatio: `${Math.round(sizeBytes / 1024)} KB`,
        });
      };
      img.onerror = reject;
      img.src = source;
    }
  });
}
