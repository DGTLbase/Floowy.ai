import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const manifest = JSON.parse(fs.readFileSync('/tmp/manifest.json','utf8'));
const rows = [];
for (const m of manifest) {
  const buf = fs.readFileSync(`src/assets/flatlay-refs/v2/${m.fname}`);
  const path = `flatlay-styles/v2/${m.fname}`;
  const { error } = await supabase.storage.from('generated').upload(path, buf, { contentType:'image/jpeg', upsert:true });
  if (error) { console.error('up',m.fname,error.message); continue; }
  const { data: pub } = supabase.storage.from('generated').getPublicUrl(path);
  rows.push({ subcategory_id: m.subcategory_id, name: m.name, image_url: pub.publicUrl });
  console.log('up', m.fname);
}
fs.writeFileSync('/tmp/rows.json', JSON.stringify(rows));
console.log('rows', rows.length);
