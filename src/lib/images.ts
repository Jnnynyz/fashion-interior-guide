import { Capacitor } from "@capacitor/core";
import { Media } from "@capacitor-community/media";
import { Filesystem, Directory } from "@capacitor/filesystem";

type DisplayImageOptions = {
  rotateLandscapePortrait?: boolean;
};

function replaceExtension(name: string, nextExt: string) {
  return name.replace(/\.[^.]+$/, "") + `.${nextExt}`;
}

function readExifOrientation(buffer: ArrayBuffer): number {
  const view = new DataView(buffer);
  if (view.byteLength < 4 || view.getUint16(0, false) !== 0xffd8) return 1;

  let offset = 2;
  while (offset + 1 < view.byteLength) {
    const marker = view.getUint16(offset, false);
    offset += 2;

    if (marker === 0xffe1) {
      const segmentLength = view.getUint16(offset, false);
      const exifHeaderOffset = offset + 2;
      if (segmentLength < 8 || exifHeaderOffset + 6 >= view.byteLength) return 1;
      if (view.getUint32(exifHeaderOffset, false) !== 0x45786966) return 1;

      const tiffOffset = exifHeaderOffset + 6;
      const littleEndian = view.getUint16(tiffOffset, false) === 0x4949;
      const firstIfdOffset = view.getUint32(tiffOffset + 4, littleEndian);
      let directoryOffset = tiffOffset + firstIfdOffset;
      if (directoryOffset + 2 > view.byteLength) return 1;

      const entries = view.getUint16(directoryOffset, littleEndian);
      directoryOffset += 2;

      for (let index = 0; index < entries; index += 1) {
        const entryOffset = directoryOffset + index * 12;
        if (entryOffset + 10 > view.byteLength) break;
        if (view.getUint16(entryOffset, littleEndian) === 0x0112) {
          return view.getUint16(entryOffset + 8, littleEndian);
        }
      }

      return 1;
    }

    if ((marker & 0xff00) !== 0xff00 || offset + 2 > view.byteLength) return 1;
    offset += view.getUint16(offset, false);
  }

  return 1;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = src;
  });
}

function drawOrientedImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  orientation: number,
  forceQuarterTurn: boolean,
) {
  const width = img.naturalWidth;
  const height = img.naturalHeight;

  if (forceQuarterTurn) {
    ctx.translate(height, 0);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(img, 0, 0, width, height);
    return;
  }

  switch (orientation) {
    case 2:
      ctx.transform(-1, 0, 0, 1, width, 0);
      break;
    case 3:
      ctx.transform(-1, 0, 0, -1, width, height);
      break;
    case 4:
      ctx.transform(1, 0, 0, -1, 0, height);
      break;
    case 5:
      ctx.transform(0, 1, 1, 0, 0, 0);
      break;
    case 6:
      ctx.transform(0, 1, -1, 0, height, 0);
      break;
    case 7:
      ctx.transform(0, -1, -1, 0, height, width);
      break;
    case 8:
      ctx.transform(0, -1, 1, 0, 0, width);
      break;
    default:
      break;
  }

  ctx.drawImage(img, 0, 0, width, height);
}

async function renderImage(blob: Blob, options: DisplayImageOptions = {}) {
  if (typeof window === "undefined") return null;

  const orientation = blob.type === "image/jpeg" ? readExifOrientation(await blob.arrayBuffer()) : 1;
  const objectUrl = URL.createObjectURL(blob);

  try {
    const img = await loadImage(objectUrl);
    const forceQuarterTurn = Boolean(options.rotateLandscapePortrait && img.naturalWidth > img.naturalHeight);
    if (orientation === 1 && !forceQuarterTurn) return null;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const swapAxes = forceQuarterTurn || [5, 6, 7, 8].includes(orientation);
    canvas.width = swapAxes ? img.naturalHeight : img.naturalWidth;
    canvas.height = swapAxes ? img.naturalWidth : img.naturalHeight;

    drawOrientedImage(ctx, img, orientation, forceQuarterTurn);

    const outputType = blob.type === "image/png" ? "image/png" : "image/jpeg";
    return canvas.toDataURL(outputType, 0.92);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function normalizeImageFile(file: File) {
  try {
    const dataUrl = await renderImage(file);
    if (!dataUrl) return file;

    const blob = await fetch(dataUrl).then((response) => response.blob());
    const nextExt = blob.type === "image/png" ? "png" : "jpg";
    return new File([blob], replaceExtension(file.name, nextExt), {
      type: blob.type,
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}

export async function getDisplayImageUrl(url: string, options: DisplayImageOptions = {}) {
  try {
    const blob = await fetch(url).then((response) => {
      if (!response.ok) throw new Error("Could not fetch image");
      return response.blob();
    });
    return (await renderImage(blob, options)) ?? url;
  } catch {
    return url;
  }
}

export async function saveGeneratedImage(url: string, fileName: string) {
  if (Capacitor.isNativePlatform()) {
    try {
      // Download the image and write it to a local cache file so Media.savePhoto
      // can reliably copy it to the Photos library (camera roll), not Files.
      const res = await fetch(url);
      if (!res.ok) throw new Error("Could not fetch image");
      const blob = await res.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1] ?? "");
        };
        reader.onerror = () => reject(new Error("Could not read image"));
        reader.readAsDataURL(blob);
      });

      const localName = `whats-missing-${Date.now()}.png`;
      const written = await Filesystem.writeFile({
        path: localName,
        data: base64,
        directory: Directory.Cache,
      });

      await Media.savePhoto({
        path: written.uri,
        fileName: fileName.replace(/\.[^.]+$/, ""),
      });

      try {
        await Filesystem.deleteFile({ path: localName, directory: Directory.Cache });
      } catch {
        // Ignore cleanup errors.
      }

      return "camera-roll" as const;
    } catch {
      // Fall back to the browser download flow below.
    }
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error("Could not fetch image");
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
  return "download" as const;
}