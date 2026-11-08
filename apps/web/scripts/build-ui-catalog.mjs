import ts from 'typescript';
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
const root = resolve(import.meta.dirname, '../src');
const texts = new Set();
function add(value) {
  const entities = {apos:"'",quot:'"',amp:'&',lt:'<',gt:'>',nbsp:' '};
  const text = value.replace(/&(apos|quot|amp|lt|gt|nbsp);/g,(_,name)=>entities[name]).replace(/&#39;/g,"'").replace(/\s+/g,' ').trim();
  if (text.length >= 2 && text.length <= 500 && /[A-Za-z]{2}/.test(text) && !/https?:|^[/.#]|[{}]|@|\\[nr]/.test(text)) texts.add(text);
}
async function walk(dir) {
  for (const entry of await readdir(dir,{withFileTypes:true})) {
    const file = join(dir,entry.name);
    if (entry.isDirectory()) { if (!['api','fonts','i18n'].includes(entry.name)) await walk(file); continue; }
    if (!file.endsWith('.tsx')) continue;
    const ast = ts.createSourceFile(file,await readFile(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
    function visit(node) {
      if (ts.isJsxText(node)) add(node.text);
      if (ts.isStringLiteral(node) && (/^[A-Z][a-z]/.test(node.text) || /\s/.test(node.text))) add(node.text);
      if (ts.isStringLiteral(node) && (ts.isJsxAttribute(node.parent) || ts.isJsxExpression(node.parent))) add(node.text);
      if (ts.isPropertyAssignment(node) && /^(label|description|title|intro|copy|action|preview|heading)$/.test(node.name.getText(ast)) && ts.isStringLiteral(node.initializer)) add(node.initializer.text);
      ts.forEachChild(node,visit);
    }
    visit(ast);
  }
}
await walk(join(root,'app')); await walk(join(root,'components'));
['Find a Master’s scholarship','Find a PhD scholarship','Master’s scholarships','PhD scholarships','Browse scholarships'].forEach(add);
const ordered = [...texts].sort();
const catalog = Object.fromEntries(ordered.map(text=>[createHash('sha256').update(text).digest('hex').slice(0,16),text]));
await mkdir(join(root,'lib/i18n'),{recursive:true});
await writeFile(join(root,'lib/i18n/ui-catalog.json'),JSON.stringify(catalog,null,2)+'\n');
console.log(`Public UI catalog: ${ordered.length} predefined messages`);
