import fs from 'fs';
const KEY = process.env.IMGBB_API_KEY;
const manifest = JSON.parse(fs.readFileSync('/tmp/manifest.json','utf8'));
const out = [];
let i = 0;
async function worker() {
  while (i < manifest.length) {
    const m = manifest[i++];
    const buf = fs.readFileSync(`src/assets/flatlay-refs/v2/${m.fname}`);
    const b64 = buf.toString('base64');
    const fd = new FormData();
    fd.append('key', KEY);
    fd.append('image', b64);
    fd.append('name', m.fname.replace(/\.jpg$/,''));
    try {
      const r = await fetch('https://api.imgbb.com/1/upload', { method:'POST', body: fd });
      const j = await r.json();
      if (!j?.data?.url) { console.error('FAIL', m.fname, JSON.stringify(j).slice(0,200)); continue; }
      out.push({ subcategory_id: m.subcategory_id, name: m.name, image_url: j.data.url });
      console.log('ok', m.fname);
    } catch(e){ console.error('err',m.fname,e.message); }
  }
}
await Promise.all(Array.from({length:3},()=>worker()));
fs.writeFileSync('/tmp/rows.json', JSON.stringify(out));
console.log('total', out.length);
