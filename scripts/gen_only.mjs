import fs from 'fs';
const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
const variants = JSON.parse(fs.readFileSync('/tmp/variants.json','utf8'));
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
fs.mkdirSync('src/assets/flatlay-refs/v2', { recursive: true });

async function genImage(prompt) {
  const r = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method:'POST',
    headers:{'Authorization':`Bearer ${LOVABLE_API_KEY}`,'Content-Type':'application/json'},
    body: JSON.stringify({
      model:'google/gemini-2.5-flash-image',
      messages:[{role:'user',content:prompt}],
      modalities:['image','text']
    })
  });
  const j = await r.json();
  const url = j.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!url) throw new Error('no image: '+JSON.stringify(j).slice(0,200));
  return Buffer.from(url.split(',')[1],'base64');
}

const tasks = [];
for (const [subId, cat, sub, names] of variants) {
  for (const name of names) {
    const fname = `${slug(cat)}-${slug(sub)}-${slug(name)}.jpg`;
    const localPath = `src/assets/flatlay-refs/v2/${fname}`;
    const prompt = `Professional e-commerce flat lay photography of a single ${name} (${sub}, ${cat} category). The garment is laid flat on a pure white seamless background, perfectly centered, top-down camera angle, soft even studio lighting, no shadows, no model, no props, no hangers. Crisp clean product photography, neutral natural color, photorealistic, square composition.`;
    tasks.push({ subId, cat, sub, name, fname, localPath, prompt });
  }
}

const manifest = [];
const CONC = 5;
let idx = 0;
async function worker() {
  while (idx < tasks.length) {
    const t = tasks[idx++];
    if (!fs.existsSync(t.localPath)) {
      try {
        const buf = await genImage(t.prompt);
        fs.writeFileSync(t.localPath, buf);
        console.log('ok', t.fname);
      } catch(e){ console.error('FAIL',t.fname,e.message); continue; }
    } else { console.log('skip', t.fname); }
    manifest.push({ subcategory_id: t.subId, name: t.name, fname: t.fname });
  }
}
await Promise.all(Array.from({length:CONC},()=>worker()));
fs.writeFileSync('/tmp/manifest.json', JSON.stringify(manifest,null,2));
console.log('done', manifest.length);
