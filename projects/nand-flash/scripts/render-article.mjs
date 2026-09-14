import { readFile, writeFile } from 'node:fs/promises';
import { renderArticle } from '../content.mjs';
const url=new URL('../index.html',import.meta.url);
const html=await readFile(url,'utf8');
const output=html.replace(/(?<=<!-- article:start -->)[\s\S]*?(?=<!-- article:end -->)/,`\n${renderArticle()}\n`);
if(process.argv.includes('--check')) {
  if(output!==html)throw new Error('Article HTML is stale. Run node projects/nand-flash/scripts/render-article.mjs');
  console.log('Article HTML matches the source.');
}else await writeFile(url,output);
