const DEFAULT_MAX_WIDTH = 1600;
const DEFAULT_MAX_HEIGHT = 1600;
const DEFAULT_QUALITY = 0.82;

const getBaseFileName = (fileName = "photo") => {
  const safeName = String(fileName || "photo").trim() || "photo";
  return safeName.replace(/\.[^.]+$/, "");
};

const getOutputFileName = (fileName, mimeType) => {
  const baseName = getBaseFileName(fileName);
  if (mimeType === "image/webp") return `${baseName}.webp`;
  return `${baseName}.jpg`;
};

const loadImage = (objectUrl) => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = reject;
  image.src = objectUrl;
});

const blobToFile = (blob, fileName) => new File([blob], fileName, {
  type: blob.type,
  lastModified: Date.now(),
});

/**
 * Compress a browser image file before upload.
 */
export const compressImageFile = async (file, options = {}) => {
  if (!file || !file.type?.startsWith("image/")) return file;
  if (file.type === "image/gif") return file;
  if (typeof document === "undefined") return file;

  const maxWidth = options.maxWidth || DEFAULT_MAX_WIDTH;
  const maxHeight = options.maxHeight || DEFAULT_MAX_HEIGHT;
  const quality = options.quality ?? DEFAULT_QUALITY;
  const mimeType = options.mimeType || "image/jpeg";
  const backgroundColor = options.backgroundColor || "#ffffff";

  let objectUrl = null;

  try {
    objectUrl = URL.createObjectURL(file);
    const image = await loadImage(objectUrl);

    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    if (!width || !height) return file;

    const scale = Math.min(maxWidth / width, maxHeight / height, 1);
    const targetWidth = Math.max(1, Math.round(width * scale));
    const targetHeight = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext("2d");
    if (!context) return file;

    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, targetWidth, targetHeight);
    context.drawImage(image, 0, 0, targetWidth, targetHeight);

    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, mimeType, quality);
    });

    if (!blob) return file;

    return blobToFile(blob, getOutputFileName(file.name, blob.type || mimeType));
  } catch {
    return file;
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
};