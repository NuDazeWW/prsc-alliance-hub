import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Save, Upload } from "lucide-react";
import { getMyHeadshotUrl, getMyProfile, getPortalSession, saveMyProfile, setMyHeadshot } from "@/lib/portal.functions";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/portal/PortalShell";
import { isPreviewHost } from "@/routes/_authenticated/route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/portal/profile")({
  head: () => ({ meta: [{ title: "Private Profile | PRSC" }, { name: "description", content: "Private member profile for individualized PRSC and DIS materials." }, { name: "robots", content: "noindex,nofollow,noarchive" }, { property: "og:title", content: "Private Profile | PRSC" }, { property: "og:description", content: "Private member profile for individualized PRSC and DIS materials." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }), component: ProfilePage,
});
const experience = ["What perspective or expertise do you bring to this work?","Which market challenges deserve the greatest attention?","Where do you see the strongest opportunity for impact?","Which stakeholders should this work serve first?","What would make this initiative credible to you?","What should success look like over the next 12–24 months?"];
const permissions = ["Use my name in company materials","Use my title and organization","Use my professional biography","Use my headshot","Reference my participation in investor materials","Invite me to selected external briefings"];
type FormState = { current_stage:number; preferred_name:string; professional_role:string; current_organization:string; preferred_email:string; preferred_phone:string; experience_answers:Record<string,string>; visibility_instructions:Record<string,"yes"|"discuss"|"no">; restriction_status:"no"|"yes"|"unsure"|null; restriction_details:string; final_notes:string; questions:string; contact_requested:boolean; submit:boolean };
const empty: FormState = { current_stage:1, preferred_name:"", professional_role:"", current_organization:"", preferred_email:"", preferred_phone:"", experience_answers:{}, visibility_instructions:{}, restriction_status:null, restriction_details:"", final_notes:"", questions:"", contact_requested:false, submit:false };
function ProfilePage(){
 const session=useQuery({queryKey:["portal-session"],queryFn:()=>isPreviewHost()?Promise.resolve(null):getPortalSession(),retry:false}); const profile=useQuery({queryKey:["portal-profile"],queryFn:()=>isPreviewHost()?Promise.resolve(null):getMyProfile(),retry:false});
 const [form,setForm]=useState(empty); const [status,setStatus]=useState("");
 useEffect(()=>{const p=profile.data;const m=session.data?.member;if(p)setForm({...empty,current_stage:p.current_stage,preferred_name:p.preferred_name??"",professional_role:p.professional_role??"",current_organization:p.current_organization??"",preferred_email:p.preferred_email??"",preferred_phone:p.preferred_phone??"",experience_answers:(p.experience_answers??{}) as Record<string,string>,visibility_instructions:(p.visibility_instructions??{}) as FormState["visibility_instructions"],restriction_status:(p.restriction_status as FormState["restriction_status"])??null,restriction_details:p.restriction_details??"",final_notes:p.final_notes??"",questions:p.questions??"",contact_requested:p.contact_requested,submit:false});else if(m)setForm(f=>({...f,preferred_name:m.professional_name||m.first_name,professional_role:m.title||"",current_organization:m.organization,preferred_email:m.email}));},[profile.data,session.data]);
 async function save(submit=false){setStatus("Saving…");try{await saveMyProfile({data:{...form,submit,current_stage:submit?5:form.current_stage}});setStatus(submit?"Profile received. Your individualized package is now being prepared.":"Progress saved.");if(submit)setForm(f=>({...f,current_stage:5}));}catch(e){setStatus(e instanceof Error?e.message:"Unable to save.");}}
 if(session.isLoading||profile.isLoading)return <PortalShell><div className="p-20 text-center text-gold">Opening your profile…</div></PortalShell>;
 const stage=form.current_stage;
 return <PortalShell><main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:py-14"><Link to="/portal" className="inline-flex items-center gap-2 text-xs uppercase text-ivory/55 hover:text-gold"><ArrowLeft className="h-4 w-4"/>Welcome center</Link><div className="mt-8 grid gap-10 lg:grid-cols-[240px_1fr]">
  <aside><p className="text-xs uppercase text-gold">Private profile</p><h1 className="mt-3 font-display text-4xl">Your perspective, in your words.</h1><p className="mt-5 text-sm leading-6 text-ivory/55">Save your progress and return at any time. These instructions help prepare company and investor materials; they are not legal consent or a replacement for your formal package.</p><ol className="mt-8 space-y-3">{["Your information","Your experience","Visibility & participation","Final details","Received"].map((x,i)=><li key={x} className={`border-l-2 py-1 pl-3 text-sm ${stage===i+1?"border-gold text-gold":"border-ivory/15 text-ivory/40"}`}>{String(i+1).padStart(2,"0")} · {x}</li>)}</ol></aside>
  <section className="min-h-[620px] border border-gold/20 bg-ivory/[.025] p-6 sm:p-10 lg:p-14">{stage===1&&<><StepTitle n="01" title="Your information" copy="Confirm how we should address and contact you."/><HeadshotField/><div className="mt-10 grid gap-5 sm:grid-cols-2"><Field label="Preferred name" value={form.preferred_name} onChange={v=>setForm({...form,preferred_name:v})}/><Field label="Professional role" value={form.professional_role} onChange={v=>setForm({...form,professional_role:v})}/><Field label="Organization" value={form.current_organization} onChange={v=>setForm({...form,current_organization:v})}/><Field label="Preferred email" type="email" value={form.preferred_email} onChange={v=>setForm({...form,preferred_email:v})}/><Field label="Preferred phone" value={form.preferred_phone} onChange={v=>setForm({...form,preferred_phone:v})}/></div></>}
  {stage===2&&<><StepTitle n="02" title="Your experience" copy="Help us understand the perspective you bring."/><div className="mt-10 space-y-7">{experience.map((q,i)=><label key={q} className="block text-sm text-ivory/75"><span className="mr-2 text-gold">{i+1}.</span>{q}<Textarea value={form.experience_answers[`q${i+1}`]||""} onChange={e=>setForm({...form,experience_answers:{...form.experience_answers,[`q${i+1}`]:e.target.value}})} className="mt-3 min-h-28 border-ivory/20 text-ivory"/></label>)}</div></>}
  {stage===3&&<><StepTitle n="03" title="Visibility & participation" copy="Tell us how you would like your participation represented."/><div className="mt-10 space-y-4">{permissions.map((p,i)=><div key={p} className="grid gap-3 border-b border-ivory/10 pb-4 sm:grid-cols-[1fr_auto]"><span className="text-sm text-ivory/75">{p}</span><div className="flex gap-2">{(["yes","discuss","no"] as const).map(v=><button key={v} onClick={()=>setForm({...form,visibility_instructions:{...form.visibility_instructions,[`p${i+1}`]:v}})} className={`border px-3 py-2 text-[10px] uppercase ${form.visibility_instructions[`p${i+1}`]===v?"border-gold bg-gold text-navy":"border-ivory/20 text-ivory/55"}`}>{v==="discuss"?"Discuss first":v}</button>)}</div></div>)}</div><label className="mt-8 block text-sm text-ivory/75">Restrictions or considerations<Textarea value={form.restriction_details} onChange={e=>setForm({...form,restriction_details:e.target.value})} className="mt-3 min-h-28 border-ivory/20 text-ivory"/></label></>}
  {stage===4&&<><StepTitle n="04" title="Final details" copy="Share anything we should consider while preparing your package."/><label className="mt-10 block text-sm text-ivory/75">Package considerations<Textarea value={form.final_notes} onChange={e=>setForm({...form,final_notes:e.target.value})} className="mt-3 min-h-32 border-ivory/20 text-ivory"/></label><label className="mt-7 block text-sm text-ivory/75">Questions for the team<Textarea value={form.questions} onChange={e=>setForm({...form,questions:e.target.value})} className="mt-3 min-h-32 border-ivory/20 text-ivory"/></label><label className="mt-7 flex items-start gap-3 text-sm text-ivory/70"><input type="checkbox" checked={form.contact_requested} onChange={e=>setForm({...form,contact_requested:e.target.checked})} className="mt-1 accent-gold"/>I would like a member of the team to contact me.</label></>}
  {stage===5&&<div className="flex min-h-[480px] flex-col items-center justify-center text-center"><div className="flex h-16 w-16 items-center justify-center rounded-full border border-gold text-gold"><Check className="h-7 w-7"/></div><p className="mt-8 text-xs uppercase text-gold">Profile received</p><h2 className="mt-4 max-w-xl font-display text-5xl">Thank you. Your individualized package is being prepared.</h2><p className="mt-6 max-w-lg text-sm leading-7 text-ivory/55">We will follow up privately with next steps. Questions can be sent to info@readinessterminal.com.</p></div>}
  {status&&<p role="status" className="mt-8 border-l-2 border-gold pl-3 text-sm text-ivory/65">{status}</p>}
  {stage<5&&<div className="mt-10 flex flex-wrap justify-between gap-3 border-t border-gold/15 pt-7"><Button variant="ghost" disabled={stage===1} onClick={()=>setForm({...form,current_stage:stage-1})} className="text-ivory"><ArrowLeft className="mr-2 h-4 w-4"/>Back</Button><div className="flex gap-3"><Button variant="outline" onClick={()=>save(false)} className="rounded-none border-ivory/25 text-ivory"><Save className="mr-2 h-4 w-4"/>Save</Button>{stage<4?<Button onClick={()=>setForm({...form,current_stage:stage+1})} className="rounded-none bg-gold text-navy">Continue<ArrowRight className="ml-2 h-4 w-4"/></Button>:<Button onClick={()=>save(true)} className="rounded-none bg-gold text-navy">Submit profile<Check className="ml-2 h-4 w-4"/></Button>}</div></div>}</section>
 </div></main></PortalShell>;
}
function StepTitle({n,title,copy}:{n:string;title:string;copy:string}){return <div><p className="text-xs uppercase text-gold">Stage {n}</p><h2 className="mt-3 font-display text-4xl sm:text-5xl">{title}</h2><p className="mt-4 text-sm text-ivory/55">{copy}</p></div>}
function HeadshotField(){
 const fileRef=useRef<HTMLInputElement>(null); const[busy,setBusy]=useState(false); const[msg,setMsg]=useState("");
 const url=useQuery({queryKey:["my-headshot"],queryFn:()=>isPreviewHost()?Promise.resolve(null):getMyHeadshotUrl(),retry:false});
 async function upload(file:File){
  if(!file.type.startsWith("image/")){setMsg("Please choose an image file.");return;}
  if(file.size>5*1024*1024){setMsg("Please choose an image under 5 MB.");return;}
  setBusy(true);setMsg("Uploading…");
  try{
   const{data:{user}}=await supabase.auth.getUser(); if(!user)throw new Error("Session expired. Please sign in again.");
   const ext=(file.name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"")||"jpg";
   const path=`${user.id}/headshot-${Date.now()}.${ext}`;
   const{error}=await supabase.storage.from("member-headshots").upload(path,file,{cacheControl:"3600",upsert:false});
   if(error)throw error;
   await setMyHeadshot({data:{path}});
   await url.refetch(); setMsg("Headshot saved.");
  }catch(e){setMsg(e instanceof Error?e.message:"Upload failed. Please try again.");}
  finally{setBusy(false);}
 }
 const src=url.data?.url;
 return <div className="mt-10 flex items-center gap-6 border border-gold/15 bg-navy/40 p-5">
  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gold/30 bg-ivory/5 text-gold">{src?<img src={src} alt="Your headshot" className="h-full w-full object-cover"/>:<Upload className="h-6 w-6"/>}</div>
  <div><p className="text-xs uppercase text-ivory/55">Headshot</p><p className="mt-1 text-sm text-ivory/50">Used only for your individualized materials. JPG or PNG, up to 5 MB.</p>
  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)void upload(f);e.target.value="";}}/>
  <Button type="button" variant="outline" disabled={busy} onClick={()=>fileRef.current?.click()} className="mt-3 rounded-none border-gold/40 text-gold hover:bg-gold hover:text-navy">{busy?"Uploading…":src?"Replace headshot":"Upload headshot"}</Button>
  {msg&&<p role="status" className="mt-2 text-xs text-ivory/55">{msg}</p>}</div>
 </div>;
}
function Field({label,value,onChange,type="text"}:{label:string;value:string;onChange:(v:string)=>void;type?:string}){return <label className="text-xs uppercase text-ivory/55">{label}<Input type={type} value={value} onChange={e=>onChange(e.target.value)} required className="mt-2 h-12 border-ivory/20 text-ivory"/></label>}
