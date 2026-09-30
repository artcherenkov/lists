import { expect, test } from "vitest";

import { isOwnAddress } from "../address.ts";

const appOrigin = "http://127.0.0.1:4173";

test("страницы и файлы самого приложения – свой адрес", () => {
  expect(isOwnAddress("http://127.0.0.1:4173/", appOrigin)).toBe(true);
  expect(isOwnAddress("http://127.0.0.1:4173/assets/index-abc.js?v=1", appOrigin)).toBe(true);
});

test("внешний сайт – чужой адрес, в том числе сайт с похожим именем", () => {
  expect(isOwnAddress("https://fonts.googleapis.com/css2?family=Inter", appOrigin)).toBe(false);
  expect(isOwnAddress("http://127.0.0.1:4173.example.com/", appOrigin)).toBe(false);
  expect(isOwnAddress("http://127.0.0.1:4173@example.com/", appOrigin)).toBe(false);
});

test("тот же хост на другом порту, схеме или под другим именем – чужой адрес", () => {
  expect(isOwnAddress("http://127.0.0.1:3000/api", appOrigin)).toBe(false);
  expect(isOwnAddress("https://127.0.0.1:4173/", appOrigin)).toBe(false);
  expect(isOwnAddress("http://localhost:4173/", appOrigin)).toBe(false);
});

test("data: и blob: не выходят в сеть и разрешены", () => {
  expect(isOwnAddress("data:image/png;base64,iVBORw0KGgo=", appOrigin)).toBe(true);
  expect(isOwnAddress("blob:http://127.0.0.1:4173/5f1c2d3e", appOrigin)).toBe(true);
});

test("адрес, который не разобрать, считается чужим", () => {
  expect(isOwnAddress("не адрес", appOrigin)).toBe(false);
  expect(isOwnAddress("", appOrigin)).toBe(false);
});
