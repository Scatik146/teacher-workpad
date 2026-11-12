#!/usr/bin/env node
/* Выполнить задание помощником DeepSeek.
   node tools/deepseek-zadanie.mjs docs/komanda/zadaniya/001-....md [модель]
   Читает задание, берёт файлы из разделов «Прочитать» и «Можно менять» (пути в `обратных кавычках`),
   отправляет DeepSeek (ключ — переменная DEEPSEEK_API_KEY), записывает ответ ТОЛЬКО в файлы из «Можно менять»,
   печатает отчёт. Проверки и Pull Request делает workflow .github/workflows/deepseek-zadanie.yml. */
import fs from 'fs';
import path from 'path';

const [, , zadanieFile, model = 'deepseek-flash'] = process.argv;
if (!zadanieFile) { console.error('укажите файл задания'); process.exit(2); }
const key = process.env.DEEPSEEK_API_KEY;
if (!key) { console.error('нет DEEPSEEK_API_KEY'); process.exit(2); }

const zadanie = fs.readFileSync(zadanieFile, 'utf8');
const razdel = (name) => { const m = zadanie.match(new RegExp('^##\\s*' + name + '[^\\n]*\\n([\\s\\S]*?)(?=^##\\s|$(?![\\s\\S]))', 'm')); return m ? m[1] : ''; };
const puti = (text) => [...text.matchAll(/`([^`\s]+\.[A-Za-z0-9]+)`/g)].map(m => m[1]).filter(p => !p.includes('*'));
const chitat = [...new Set(['CLAUDE.md', ...puti(razdel('Прочитать'))])];
const menyat = [...new Set(puti(razdel('Можно менять')))];
if (!menyat.length) { console.error('в задании нет раздела «Можно менять» с путями'); process.exit(2); }

const fayl = (p) => fs.existsSync(p) ? `=== ФАЙЛ ${p} ===\n${fs.readFileSync(p, 'utf8')}\n=== КОНЕЦ ${p} ===` : `=== ФАЙЛ ${p} — нет, создать ===`;
const kontekst = [...new Set([...chitat, ...menyat])].map(fayl).join('\n\n');

const system = `Ты — программист в команде сайта уроков учителя. Пишешь аккуратно и по-русски (комментарии, тексты, сообщения).
Правила проекта — в файле CLAUDE.md, они обязательны. Делай ровно то, что сказано в задании, не больше.
Менять можно только эти файлы: ${menyat.join(', ')}.
Ответ — строго JSON: {"files":[{"path":"...","content":"ПОЛНОЕ новое содержимое файла"}],"otchet":"что сделано, что проверить, что не получилось"}.
Включай в files только изменённые файлы, каждый — целиком. Если задание непонятно или противоречиво — files пустой, вопрос в otchet.`;

const res = await fetch('https://api.deepseek.com/chat/completions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
  body: JSON.stringify({ model, temperature: 0.2, response_format: { type: 'json_object' },
    messages: [{ role: 'system', content: system }, { role: 'user', content: 'ЗАДАНИЕ:\n' + zadanie + '\n\nФАЙЛЫ:\n' + kontekst }] })
});
if (!res.ok) { console.error('DeepSeek ответил ' + res.status + ': ' + await res.text()); process.exit(1); }
const data = await res.json();
let otvet;
try { otvet = JSON.parse(data.choices[0].message.content); } catch (e) { console.error('ответ не JSON:\n' + data.choices?.[0]?.message?.content); process.exit(1); }

const zapisano = [];
for (const f of otvet.files || []) {
  const p = path.normalize(f.path);
  if (!menyat.includes(p)) { console.error('пропущен файл вне «Можно менять»: ' + p); continue; }
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, f.content);
  zapisano.push(p);
}
const u = data.usage || {};
const otchet = `Модель: ${model}. Токены: вход ${u.prompt_tokens ?? '?'}, выход ${u.completion_tokens ?? '?'}.\nИзменены: ${zapisano.join(', ') || 'ничего'}.\n\n${otvet.otchet || ''}`;
fs.writeFileSync('deepseek-otchet.md', otchet);
console.log(otchet);
