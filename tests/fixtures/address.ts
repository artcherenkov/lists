// Решение 14 плана: после входа клиент обращается только к нашим сайтам. Правило выбора
// «свой или чужой адрес» – чистая функция, чтобы его можно было проверить без браузера.

// data: и blob: не выходят в сеть: встроенные картинки и файлы, собранные самой страницей.
const localProtocols = new Set(["data:", "blob:"]);

export function isOwnAddress(requestUrl: string, appOrigin: string): boolean {
  let url: URL;
  try {
    url = new URL(requestUrl);
  } catch {
    return false;
  }
  if (localProtocols.has(url.protocol)) return true;
  return url.origin === appOrigin;
}
