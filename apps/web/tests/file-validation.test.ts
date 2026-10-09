import assert from "node:assert/strict";
import test from "node:test";
import { zipSync, strToU8 } from "fflate";
import { cleanFileName, readUpload, validateFile } from "../src/server/files/validation";
import { parseProfileUpdateInput } from "../src/server/validation/profile";

const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAO0lEQVRIiWMIrXxPU8QwakHlaBC9H01FoaMZ7f1oURE6WppWjlY4oaNVZuVoq+L9aMOrcrTp+H5Qt64BXGn0W4hkWlMAAAAASUVORK5CYII=", "base64");
test("phone/computer images are normalized and cannot disguise SVG as a photo", async () => {
  const image = await validateFile(new File([png], "research-photo.png"));
  assert.equal(image.mediaType, "image/webp");
  assert.equal(image.name, "research-photo.webp");
  assert.equal(image.data.subarray(8, 12).toString(), "WEBP");
  await assert.rejects(validateFile(new File(["<svg><script>alert(1)</script></svg>"], "photo.png", { type: "image/png" })));
});
test("document content must match the selected supported format", async () => {
  assert.equal((await validateFile(new File(["%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF\n"], "cv.pdf"))).mediaType, "application/pdf");
  await assert.rejects(validateFile(new File(["<html>fake PDF</html>"], "cv.pdf", { type: "application/pdf" })));
  await assert.rejects(validateFile(new File(["MZ executable"], "document.exe")));
  await assert.rejects(validateFile(new File([new Uint8Array([0xff, 0xfe, 0, 1])], "text.txt")));
  assert.equal((await validateFile(new File(["title,year\nResearch,2026\n"], "data.csv"))).mediaType, "text/csv");
});
test("Office files require the correct package and reject macro documents and archive bombs", async () => {
  const doc = zipSync({ "[Content_Types].xml": strToU8("<Types/>"), "word/document.xml": strToU8("<document/>") });
  assert.match((await validateFile(new File([new Uint8Array(doc)], "cv.docx"))).mediaType, /wordprocessingml/);
  await assert.rejects(validateFile(new File([new Uint8Array(doc)], "cv.xlsx")));
  const macro = zipSync({ "[Content_Types].xml": strToU8("<Types>macroEnabled</Types>"), "word/document.xml": strToU8("<document/>"), "word/vbaProject.bin": new Uint8Array([1]) });
  await assert.rejects(validateFile(new File([new Uint8Array(macro)], "cv.docx")));
  const bomb = zipSync({ "[Content_Types].xml": new Uint8Array(26 * 1024 * 1024), "word/document.xml": strToU8("<document/>") });
  await assert.rejects(validateFile(new File([new Uint8Array(bomb)], "cv.docx")));
});
test("multipart requests are bounded and incomplete requests return useful errors", async () => {
  await assert.rejects(readUpload(new Request("https://example.test", { method: "POST", headers: { "content-type": "multipart/form-data; boundary=x", "content-length": String(21 * 1024 * 1024) }, body: "x" })));
  await assert.rejects(readUpload(new Request("https://example.test", { method: "POST", headers: { "content-type": "multipart/form-data; boundary=x" }, body: "broken" })));
  await assert.rejects(validateFile(new File([], "empty.pdf")));
});
test("profile supporting links accept exact file routes while rejecting unsafe links", () => {
  const url = "/api/v1/files/cmh12345678901234567890";
  const input = parseProfileUpdateInput({ profileDetails: { links: { cv: url }, education: [{ title: "PhD", url }] } });
  assert.equal(input.profileDetails?.links?.cv, url);
  assert.throws(() => parseProfileUpdateInput({ profileDetails: { links: { cv: "javascript:alert(1)" } } }));
  assert.throws(() => parseProfileUpdateInput({ profileDetails: { links: { cv: "//untrusted.example/file" } } }));
  assert.equal(cleanFileName("../CV\u202Egnp.pdf"), ".._CV_gnp.pdf");
});
