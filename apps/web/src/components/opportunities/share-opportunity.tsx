'use client';
import {useState} from 'react';
import {calendarLinks,type ShareableOpportunity} from '@/lib/opportunity-actions';
import {ActionDialog} from './action-dialog';
import { AppMark } from "./brand-mark";
import styles from './opportunity-actions.module.css';
export function ShareOpportunity({item,tabIndex}:{item:ShareableOpportunity;tabIndex?:number}){
  const [url,setUrl]=useState(''),[message,setMessage]=useState('');
  const subject='Research opportunity: '+item.title;
  const text=item.title+'\n\n'+url;
  const emailQuery=new URLSearchParams({subject,body:text}).toString().replaceAll('+','%20');
  const gmailQuery=new URLSearchParams({view:'cm',fs:'1',su:subject,body:text}).toString();
  const calendars=url?calendarLinks(item,location.origin):null;
  async function copy(){try{await navigator.clipboard.writeText(url);setMessage('Link copied.');}catch{setMessage('Select the link above and copy it.');}}
  async function slack(){
    try{await navigator.clipboard.writeText(text);setMessage('Copied for Slack. Open your workspace and paste into a channel or direct message.');}
    catch{setMessage('Copy the public link above to share it in a Slack channel or direct message.');}
  }
  return <span className={styles.root}>
    <button className={styles.trigger} type="button" tabIndex={tabIndex} aria-label="Share opportunity" onClick={()=>{setMessage('');setUrl(new URL("/opportunities/" + encodeURIComponent(item.id),location.origin).href);}}>
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m9 10 6-3m-6 7 6 3"/></svg>Share
    </button>
    {url?<ActionDialog title="Share this opportunity" onClose={()=>setUrl('')}>
      <p data-original-content className={styles.listingTitle}>{item.title}</p>
      <label className={styles.field}><span>Public opportunity link</span><input readOnly value={url} onFocus={event=>event.target.select()}/></label>
      <div className={styles.choices}>
        <button type="button" onClick={()=>void copy()}>Copy link</button>
        <a href={'mailto:?'+emailQuery}>Email</a>
        <a href={'https://mail.google.com/mail/?'+gmailQuery} target="_blank" rel="noopener noreferrer"><AppMark app="Gmail" />Gmail</a>
        <a href={'https://outlook.live.com/mail/0/deeplink/compose?'+emailQuery} target="_blank" rel="noopener noreferrer"><AppMark app="Outlook" />Outlook</a>
        <a href={'https://www.linkedin.com/sharing/share-offsite/?'+new URLSearchParams({url})} target="_blank" rel="noopener noreferrer"><AppMark app="LinkedIn" />LinkedIn</a>
        <a href={'https://twitter.com/intent/tweet?'+new URLSearchParams({url,text:item.title})} target="_blank" rel="noopener noreferrer"><AppMark app="X" />X</a>
        <button type="button" onClick={()=>void slack()}><AppMark app="Slack" />Copy for Slack</button>
        <a href="https://app.slack.com/" target="_blank" rel="noopener noreferrer"><AppMark app="Slack" />Open Slack</a>
      </div>
      {calendars?<div className={styles.choices}>
        <a href={calendars.google} target="_blank" rel="noopener noreferrer"><AppMark app="GoogleCalendar" />Google Calendar</a>
        <a href={calendars.outlook} target="_blank" rel="noopener noreferrer"><AppMark app="Outlook" />Outlook Calendar</a>
      </div>:null}
      <p className={styles.hint}>Only the public listing link is shared. Your notes and application documents stay private.</p>
      {message?<p role="status">{message}</p>:null}
    </ActionDialog>:null}
  </span>;
}
