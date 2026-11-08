'use client';
import Link from 'next/link';
import {useState} from 'react';
import {reminderCalendar,type ShareableOpportunity} from '@/lib/opportunity-actions';
import {ActionDialog} from './action-dialog';
import styles from './opportunity-actions.module.css';
const available=(items:ShareableOpportunity[],now:number)=>items.filter(item=>item.deadline&&Date.parse(item.deadline)>now&&item.deadlinePrecision!=='month-only');
export function DeadlineReminder({items}:{items:ShareableOpportunity[]}){
  const [open,setOpen]=useState(false),[days,setDays]=useState('15'),[selected,setSelected]=useState<string[]>([]),[status,setStatus]=useState(''),[busy,setBusy]=useState(false),[signIn,setSignIn]=useState(false);
  const [openedAt,setOpenedAt]=useState(0);
  const dated=available(items,openedAt);
  const chosen=dated.filter(item=>selected.includes(item.id));
  async function save(){
    setBusy(true);setStatus('');setSignIn(false);let saved=0;
    try{for(const item of chosen){
      const response=await fetch('/api/v1/opportunities/saved',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({opportunityId:item.id,deadlineAlert:true,alertLeadDays:Number(days)})});
      if(response.status===401){setSignIn(true);throw Error('Sign in to save reminders, or use the calendar download without an account.');}
      const body=await response.json();if(!response.ok||!body.success)throw Error(body.error?.message||'The reminder could not be saved.');
      saved++;
    }setStatus('Saved in your workspace. Email delivery is not enabled; add the calendar reminder for a device notification.');
    }catch(error){setStatus((saved?'Some reminders were saved. ':'')+(error instanceof Error?error.message:'Unable to save reminders.'));}
    finally{setBusy(false);}
  }
  function calendar(){
    try{
      const blob=new Blob([reminderCalendar(chosen,Number(days),location.origin)],{type:'text/calendar;charset=utf-8'});
      const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='provenant-deadlines.ics';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
      setStatus('Calendar file prepared. Import it into your calendar and confirm that alerts are enabled.');
    }catch(error){setStatus(error instanceof Error?error.message:'Unable to prepare the calendar.');}
  }
  return <span className={styles.root}>
    <button className={styles.trigger} type="button" onClick={()=>{const now=Date.now(),choices=available(items,now);setOpenedAt(now);setSelected(choices.length===1?[choices[0].id]:[]);setStatus('');setSignIn(false);setOpen(true);}}>Notify me</button>
    {open?<ActionDialog title="Deadline reminders" onClose={()=>setOpen(false)}>
      <p className={styles.notice}>Email delivery is not enabled yet. Save a workspace reminder or download a calendar alert.</p>
      <label className={styles.field}><span>Remind me before the deadline</span><select value={days} onChange={event=>setDays(event.target.value)}><option value="15">15 days</option><option value="20">20 days</option></select></label>
      {dated.length>1?<div className={styles.checklist} role="group" aria-label="Choose opportunities">{dated.map(item=><label key={item.id}><input type="checkbox" checked={selected.includes(item.id)} onChange={event=>setSelected(value=>event.target.checked?[...value,item.id]:value.filter(id=>id!==item.id))}/><span data-original-content>{item.title}</span></label>)}</div>:dated[0]?<p data-original-content>{dated[0].title}</p>:<p>A future, day-specific deadline is required. Check the original source for this opportunity.</p>}
      <div className={styles.choices}><button type="button" disabled={!chosen.length||busy} onClick={()=>void save()}>{busy?'Saving…':'Save workspace reminder'}</button><button type="button" disabled={!chosen.length||busy} onClick={calendar}>Download calendar (.ics)</button></div>
      <p className={styles.hint}>Device alerts depend on your calendar settings. A reminder does not submit an application.</p>
      {status?<p role="status">{status}</p>:null}{signIn?<Link href={'/auth/sign-in?callbackUrl='+encodeURIComponent('/opportunities/saved')}>Sign in</Link>:null}
    </ActionDialog>:null}
  </span>;
}
