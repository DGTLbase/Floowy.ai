import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://fjzifykgvdsownlscgct.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!LOVABLE_API_KEY || !SUPABASE_SERVICE_ROLE_KEY) { console.error('missing env'); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const variants = JSON.parse(fs.readFileSync('/tmp/variants.json','utf8'));

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

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
  if (!url) throw new Error('no image: '+JSON.stringify(j).slice(0,300));
  return Buffer.from(url.split(',')[1],'base64');
}

const inserts = [];
for (const [subId, cat, sub, names] of variants) {
  for (const name of names) {
    const prompt = `Professional e-commerce flat lay photography of a single ${name} (${sub}, ${cat} category). The garment is laid flat on a pure white seamless background, perfectly centered, top-down camera angle, soft even studio lighting, no shadows, no model, no props, no hangers. Crisp clean product photography, neutral natural color, photorealistic, square composition.`;
    const fname = `${slug(cat)}-${slug(sub)}-${slug(name)}.jpg`;
    const localPath = `src/assets/flatlay-refs/v2/${fname}`;
    if (!fs.existsSync(localPath)) {
      console.log('gen', fname);
      try {
        const buf = await genImage(prompt);
        fs.writeFileSync(localPath, buf);
      } catch(e){ console.error('FAIL',fname,e.message); continue; }
    }
    const buf = fs.readFileSync(localPath);
    const storagePath = `flatlay-styles/v2/${fname}`;
    const { error: upErr } = await supabase.storage.from('generated').upload(storagePath, buf, { contentType:'image/jpeg', upsert:true });
    if (upErr) { console.error('upload',fname,upErr.message); continue; }
    const { data: pub } = supabase.storage.from('generated').getPublicUrl(storagePath);
    inserts.push({ subcategory_id: subId, name, image_url: pub.publicUrl, cat });
    console.log('ok', fname);
  }
}
fs.writeFileSync('/tmp/inserts.json', JSON.stringify(inserts,null,2));
console.log('total', inserts.length);
