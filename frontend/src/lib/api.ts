export async function api<T=any>(path:string, options:RequestInit={}):Promise<T> {
  const response=await fetch('/api'+path,{...options,headers:{'Content-Type':'application/json',...options.headers},credentials:'same-origin',cache:'no-store'});
  const data=await response.json().catch(()=>({detail:'The server returned an unreadable response.'}));
  if(!response.ok) throw new Error(typeof data.detail==='string'?data.detail: Array.isArray(data.detail)?data.detail.map((e:any)=>e.msg).join(' '):'Request failed. Please try again.');
  return data;
}
export const post=(path:string,data?:unknown)=>api(path,{method:'POST',body:data===undefined?undefined:JSON.stringify(data)});
export const number=(value:number)=>new Intl.NumberFormat('en-IN',{maximumFractionDigits:1}).format(value);
export const money=(value:number)=>'₹'+number(value);
export const categories=['Funding','Volunteers','Equipment','Food and supplies','Transportation','Venue or facilities','Training or expertise','Medical resources','Other'];
export const causes:Record<number,string>={1: 'Basic Needs', 2: 'Food Security', 3: 'Healthcare', 4: 'Education', 5: 'Gender Equality', 6: 'Clean Water', 7: 'Clean Energy', 8: 'Jobs & Livelihoods', 9: 'Innovation & Infrastructure', 10: 'Equal Opportunity', 11: 'Community Resilience', 12: 'Responsible Consumption', 13: 'Environment', 14: 'Ocean Conservation', 15: 'Nature & Wildlife', 16: 'Peace & Justice', 17: 'Community Partnerships'};
export function datePlus(days:number){const d=new Date();d.setDate(d.getDate()+days);return d.toISOString().slice(0,10);}

export const causeName=(id:number)=>causes[id]||'Community Impact';
