'use client';
import {useState} from 'react';
import {opportunityPath,type ShareableOpportunity} from '@/lib/opportunity-actions';
import {ActionDialog} from './action-dialog';
import styles from './opportunity-actions.module.css';
export function ShareOpportunity({item,tabIndex}:{item:ShareableOpportunity;tabIndex?:number}){
  const [url,setUrl]=useState(''),[message,setMessage]=useState('');
  const text=item.title+'\n'+url;
  async function copy(){try{await navigator.clipboard.writeText(url);setMessage('Link copied.');}catch{setMessage('Select the link above and copy it.');}}
  async function nativeShare(){try{await navigator.share({title:item.title,text:item.title,url});}catch(error){if(!(error instanceof DOMException&&error.name==='AbortError'))setMessage('Choose email, a messaging app, or copy the link below.');}}
  return <span className={styles.root}>
    <button className={styles.trigger} type="button" tabIndex={tabIndex} aria-label="Share opportunity" onClick={()=>{setMessage('');setUrl(new URL(opportunityPath(item),location.origin).href);}}>
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m9 10 6-3m-6 7 6 3"/></svg>Share
    </button>
    {url?<ActionDialog title="Share this opportunity" onClose={()=>setUrl('')}>
      <p data-original-content className={styles.listingTitle}>{item.title}</p>
      <label className={styles.field}><span>Public opportunity link</span><input readOnly value={url} onFocus={event=>event.target.select()}/></label>
      <div className={styles.choices}>
        <button type="button" onClick={()=>void copy()}>Copy link</button>
        <a href={'mailto:?'+new URLSearchParams({subject:'Research opportunity: '+item.title,body:text}).toString().replaceAll('+','%20')}>Email</a>
        <a href={'https://wa.me/?text='+encodeURIComponent(text)} target="_blank" rel="noopener noreferrer">WhatsApp</a>
        <a href={'https://t.me/share/url?url='+encodeURIComponent(url)+'&text='+encodeURIComponent(item.title)} target="_blank" rel="noopener noreferrer">Telegram</a>
        {typeof navigator.share==='function'?<button type="button" onClick={()=>void nativeShare()}>More sharing options</button>:null}
      </div>
      <p className={styles.hint}>Only the public listing link is shared. Your notes and application documents stay private.</p>
      {message?<p role="status">{message}</p>:null}
    </ActionDialog>:null}
  </span>;
}
