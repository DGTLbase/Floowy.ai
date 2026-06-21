import fs from 'fs';
const KEY = process.env.LOVABLE_API_KEY;
const IMGBB = process.env.IMGBB_API_KEY;
const groups = JSON.parse(fs.readFileSync('/tmp/suit.json','utf8'));
const slug = (s)=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
fs.mkdirSync('src/assets/flatlay-refs/v7',{recursive:true});

async function gen(prompt){
  const r = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:'google/gemini-2.5-flash-image',messages:[{role:'user',content:prompt}],modalities:['image','text']})});
  const j=await r.json();
  const u=j.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if(!u) throw new Error('no image '+JSON.stringify(j).slice(0,200));
  return Buffer.from(u.split(',')[1],'base64');
}
async function imgbb(buf, name){
  const fd = new FormData();
  fd.append('key',IMGBB);
  fd.append('image',buf.toString('base64'));
  fd.append('name',name);
  const r=await fetch('https://api.imgbb.com/1/upload',{method:'POST',body:fd});
  const j=await r.json();
  if(!j?.data?.url) throw new Error('imgbb '+JSON.stringify(j).slice(0,200));
  return j.data.url;
}

const tasks=[];
for(const [subId,sub,names] of groups)
  for(const name of names)
    tasks.push({subId,sub,name,fname:`suit-${slug(sub)}-${slug(name)}.jpg`});

const out=[];
for(const t of tasks){
  const local=`src/assets/flatlay-refs/v7/${t.fname}`;
  let buf;
  if(fs.existsSync(local)) buf=fs.readFileSync(local);
  else {
    const prompt=`Professional e-commerce flat lay photography of a single ${t.name} (Suit category). The garment is laid flat on a pure white seamless background, perfectly centered, top-down camera angle, soft even studio lighting, no shadows, no model, no props, no hangers. Crisp clean product photography, neutral natural color, photorealistic, square composition.`;
    try { buf=await gen(prompt); fs.writeFileSync(local,buf); console.log('gen',t.fname);} catch(e){console.error('FAIL',t.fname,e.message);continue;}
  }
  try {
    const url=await imgbb(buf,t.fname.replace(/\.jpg$/,''));
    out.push({subcategory_id:t.subId,name:t.name,image_url:url});
    console.log('up',t.fname);
  } catch(e){console.error('upFAIL',t.fname,e.message);}
}
fs.writeFileSync('/tmp/suit_rows.json',JSON.stringify(out,null,2));
console.log('total',out.length);
