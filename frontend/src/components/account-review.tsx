'use client';

import { useEffect, useState } from 'react';
import { Check, X, ShieldCheck, Clock3, RefreshCw, ClipboardList, ArrowRight, Search } from 'lucide-react';
import { api, post, causeName } from '@/lib/api';
import { Button } from './ui/button';
import { Field } from './forms';
import { SegmentedTabs } from './ui/segmented-tabs';

type Organization={id:number;name:string;organization_type:string;location:string;description:string;contact:string;supported_causes:number[];listing_status:string;listing_note:string;is_demo:boolean};
type Application=Organization & {applicant_name:string;applicant_email:string;created_at:string;reviews:{id:number;previous_status:string;status:string;note:string;reviewed_at:string;reviewer:string}[]};
const typeName=(type:string)=>type==='company'?'CSR fund':type==='ngo'?'NGO':type==='college'?'College / group':'Community supplier';

export function AccountReview({user,onRefresh}:{user:{organization:Organization};onRefresh:()=>Promise<void>}){
  const org=user.organization;
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
  const approved=org.listing_status==='approved';
  async function save(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setError('');setMessage('');
    const form=new FormData(event.currentTarget);
    try{
      await api('/organizations/'+org.id,{method:'PUT',body:JSON.stringify({...org,name:form.get('name'),description:form.get('description'),contact:form.get('contact'),location:form.get('location')})});
      await onRefresh();setMessage('Profile saved. Changes to NGO and CSR profiles are submitted for listing review.');
    }catch(error){setError((error as Error).message)}finally{setBusy(false)}
  }
  return <>
    <div className="page-heading"><div><div className="eyebrow">ACCOUNT & LISTING</div><h1>Your organization</h1><p>Manage your profile and track your public listing approval.</p></div><Button variant="outline" onClick={onRefresh}><RefreshCw size={16}/> Refresh status</Button></div>
    <section className={'panel account-state state-'+org.listing_status}>
      <span className="icon-tile">{approved?<ShieldCheck/>:<Clock3/>}</span><div><span className={'badge '+(approved?'green':org.listing_status==='rejected'?'red':'amber')}>{org.listing_status}</span>
      <h2>{approved?'Your organization is approved for listing':org.listing_status==='rejected'?'Your application needs attention':'Your application is under review'}</h2>
      <p>{approved?'Your active projects and offers can appear publicly and participate in matching. Resource verification is reviewed separately.':'You can prepare projects and offers in your workspace. Your profile and resources stay out of public listings and matching until a super admin approves your account.'}</p>
      {org.listing_note&&<p className="review-note"><strong>Latest review</strong><br/>{org.listing_note}</p>}</div>
    </section>
    {message&&<div className="notice" role="status">{message}</div>}{error&&<div className="error" role="alert">{error}</div>}
    <form className="panel form-stack" onSubmit={save} key={org.id}>
      <h2>Organization details</h2><p>{typeName(org.organization_type)} · {org.supported_causes.map(causeName).join(', ')}</p>
      <div className="form-grid"><Field label="Organization name"><input name="name" defaultValue={org.name} required minLength={2}/></Field><Field label="Location"><input name="location" defaultValue={org.location} required minLength={2}/></Field></div>
      <Field label="Contact / website"><input name="contact" defaultValue={org.contact} maxLength={200}/></Field>
      <Field label="What your organization does"><textarea name="description" defaultValue={org.description} rows={4} maxLength={5000} required/></Field>
      <p className="tiny">Changes to an NGO or CSR profile require another listing review. Existing commitments are retained.</p>
      <Button loading={busy}>Save profile for review <ArrowRight size={16}/></Button>
    </form>
  </>;
}

export function SuperAdminPortal(){
  const [applications,setApplications]=useState<Application[]>([]),[selected,setSelected]=useState<number|null>(null);
  const [filter,setFilter]=useState('pending'),[search,setSearch]=useState(''),[note,setNote]=useState('');
  const [busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(''),[message,setMessage]=useState('');
  async function load(){
    try{const rows=await api<Application[]>('/super-admin/applications');setApplications(rows);setError('')}
    catch(error){setError((error as Error).message)}finally{setLoading(false)}
  }
  useEffect(()=>{load()},[]);
  const application=applications.find(row=>row.id===selected);
  const visible=applications.filter(row=>(filter==='all'||row.listing_status===filter)&&`${row.name} ${row.applicant_email}`.toLowerCase().includes(search.toLowerCase()));
  async function decide(status:'approved'|'rejected'){
    if(!application)return;
    if(note.trim().length<3){setError('Add a review note of at least 3 characters.');return}
    setBusy(true);setError('');setMessage('');
    try{await post('/super-admin/organizations/'+application.id+'/listing',{status,note:note.trim()});await load();setMessage(`${application.name}: ${status==='approved'?'listing approved':'listing rejected'}. The decision is saved in the review history.`);setNote('')}
    catch(error){setError((error as Error).message)}finally{setBusy(false)}
  }
  return <>
    <div className="page-heading"><div><div className="eyebrow">SUPER ADMIN</div><h1>Account approvals</h1><p>Review NGO and CSR applications before they become publicly listed.</p></div><Button variant="outline" onClick={load} disabled={busy}><RefreshCw size={16}/> Refresh queue</Button></div>
    <div className="review-stats">{[['pending','Awaiting review'],['approved','Approved listings'],['rejected','Rejected applications']].map(([status,label])=><div key={status}><span>{label}</span><strong>{applications.filter(a=>a.listing_status===status).length}</strong></div>)}</div>
    {message&&<div className="notice" role="status">{message}</div>}{error&&<div className="error" role="alert">{error}</div>}
    <SegmentedTabs id="review-tabs" label="Application status" value={filter} onChange={setFilter} items={[{value:'pending',label:'Pending',icon:Clock3},{value:'approved',label:'Approved',icon:Check},{value:'rejected',label:'Rejected',icon:X},{value:'all',label:'All accounts',icon:ClipboardList}]}/>
    <div className="review-layout" role="tabpanel" id="review-tabs-panel" aria-labelledby={`review-tabs-${filter}`}>
      <section className="panel application-list"><label className="search-field"><Search size={18}/><input aria-label="Search applications" placeholder="Search organizations or applicant emails" value={search} onChange={event=>setSearch(event.target.value)}/></label>
      {loading?<p role="status">Loading applications…</p>:visible.length?visible.map(row=><button key={row.id} className={'application-row '+(selected===row.id?'is-selected':'')} aria-pressed={selected===row.id} onClick={()=>{setSelected(row.id);setNote('');setError('')}}><span><small>{typeName(row.organization_type)}{row.is_demo?' · DEMO':''}</small><strong>{row.name}</strong><span>{row.location}</span></span><ArrowRight size={17}/></button>):<div className="empty"><ShieldCheck/><p>No applications in this view.</p></div>}</section>
      <section className="panel application-detail">{application?<>
        <div className="section-title"><span className="eyebrow">APPLICATION #{application.id}</span><span className={'badge '+(application.listing_status==='approved'?'green':application.listing_status==='pending'?'amber':'red')}>{application.listing_status}</span></div>
        <h2>{application.name}</h2><p>{typeName(application.organization_type)} · {application.location}</p>
        <dl className="application-facts"><div><dt>Applicant</dt><dd>{application.applicant_name}</dd></div><div><dt>Email</dt><dd>{application.applicant_email}</dd></div><div><dt>Contact</dt><dd>{application.contact||'Not supplied'}</dd></div><div><dt>Causes</dt><dd>{application.supported_causes.map(causeName).join(', ')||'Not specified'}</dd></div></dl>
        <p>{application.description||'No organization description supplied.'}</p>
        <Field label="Review note" hint="Visible to the applicant and saved with your decision."><textarea value={note} onChange={event=>setNote(event.target.value)} rows={3} minLength={3} maxLength={2000} placeholder="Explain the decision or what needs to change."/></Field>
        <div className="review-actions"><Button onClick={()=>decide('approved')} disabled={busy||application.listing_status==='approved'}><Check size={16}/> Approve listing</Button><Button variant="danger" onClick={()=>decide('rejected')} disabled={busy||application.listing_status==='rejected'}><X size={16}/>{application.listing_status==='approved'?'Remove listing':'Reject application'}</Button></div>
        {busy&&<p role="status">Saving review…</p>}
        <div className="review-history"><h3>Review history</h3>{application.reviews.length?application.reviews.map(review=><div key={review.id}><strong>{review.status} · {review.reviewer}</strong><p>{review.note}</p><small>{new Date(review.reviewed_at).toLocaleString()}</small></div>):<p>No decisions recorded yet.</p>}</div>
      </>:<div className="empty"><ClipboardList size={32}/><h2>Select an application</h2><p>Review the organization’s details, then approve or reject its public listing.</p></div>}</section>
    </div>
  </>;
}
