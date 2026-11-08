'use client';

import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { languageCodes, languageDirection, languageName, supportedLanguage } from '@/lib/i18n/languages';
import { reviewedTranslation } from '@/lib/i18n/reviewed';
import styles from './language.module.css';

type LanguageState = { locale:string; setLocale:(locale:string)=>void; status:'ready'|'loading'|'unavailable' };
const LanguageContext = createContext<LanguageState>({locale:'en',setLocale:()=>{},status:'ready'});
const storageKey = 'provenant-language';
let inMemoryLocale = 'en';
function localeSnapshot(){try {const value=localStorage.getItem(storageKey);return supportedLanguage(value)?value:inMemoryLocale;}catch{return inMemoryLocale;}}
function subscribeLocale(listener:()=>void){window.addEventListener('provenant-language-change',listener);window.addEventListener('storage',listener);return()=>{window.removeEventListener('provenant-language-change',listener);window.removeEventListener('storage',listener);};}
const skipped = 'script,style,code,pre,textarea,input,[contenteditable],[data-no-translate],[data-language-picker],[data-original-content]';

export function LanguageProvider({children}:{children:ReactNode}) {
  const locale=useSyncExternalStore(subscribeLocale,localeSnapshot,()=>'en');
  const [status,setStatus] = useState<LanguageState['status']>('ready');
  function setLocale(value:string){if(!supportedLanguage(value))return;inMemoryLocale=value;try{localStorage.setItem(storageKey,value);}catch{}setStatus('ready');window.dispatchEvent(new Event('provenant-language-change'));}
  useEffect(()=>{
    document.documentElement.lang=locale;
    document.documentElement.dir=languageDirection(locale);
    // setLocale persists explicit choices. Mounting with the server's English
    // snapshot must not overwrite the stored language before hydration reads it.
    if(locale==='en') return;
    let stopped=false, running=false, unavailable=false, timer:ReturnType<typeof setTimeout>|undefined;
    const controller=new AbortController();
    const originals=new Map<Text,{original:string;displayed:string}>();
    const originalAttributes=new Map<Element,Map<string,{original:string;displayed:string}>>();
    let observer:MutationObserver|undefined;
    void import('@/lib/i18n/ui-catalog.json').then(async module=>{
      const entries=Object.entries(module.default);
      const byText=new Map(entries.map(([key,text])=>[text,key]));
      const translations:Record<string,string>=Object.fromEntries(entries.flatMap(([key,text])=>{const translated=reviewedTranslation(locale,text);return translated?[[key,translated]]:[];}));
      const failed=new Set<string>();
      const normalize=(text:string)=>text.replace(/\s+/g,' ').trim();
      async function scan() {
        if(stopped || running || unavailable) return;
        running=true;
        for(const node of originals.keys())if(!node.isConnected)originals.delete(node);
        for(const element of originalAttributes.keys())if(!element.isConnected)originalAttributes.delete(element);
        const needed=new Set<string>();
        const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
        let current:Node|null;
        while((current=walker.nextNode())) {
          const node=current as Text;
          if(node.parentElement?.closest(skipped)) continue;
          const previous=originals.get(node);
          const original=previous && node.data===previous.displayed ? previous.original : node.data;
          const key=byText.get(normalize(original));
          if(!key) continue;
          const translated=translations[key];
          if(translated) {
            const displayed=original.replace(original.trim(),translated);
            originals.set(node,{original,displayed});
            if(node.data!==displayed) node.data=displayed;
          } else if(!failed.has(key)) needed.add(key);
        }
        for(const element of document.querySelectorAll('[aria-label],[title],[placeholder]')) {
          if(element.closest('[data-no-translate],[data-language-picker],[data-original-content]'))continue;
          for(const name of ['aria-label','title','placeholder']) {
            const value=element.getAttribute(name);if(!value)continue;
            const previous=originalAttributes.get(element)?.get(name);
            const original=previous&&value===previous.displayed?previous.original:value;
            const key=byText.get(normalize(original));if(!key)continue;
            if(translations[key]) {
              const attributes=originalAttributes.get(element)||new Map();
              attributes.set(name,{original,displayed:translations[key]});originalAttributes.set(element,attributes);
              if(value!==translations[key])element.setAttribute(name,translations[key]);
            } else if(!failed.has(key))needed.add(key);
          }
        }
        const keys=[...needed].slice(0,60);
        if(keys.length) {
          setStatus('loading');
          try {
            const response=await fetch('/api/v1/interface-translations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({locale,keys}),cache:'no-store',signal:controller.signal});
            const body=await response.json();
            if(!response.ok || !body.translations) throw Error('Translation unavailable');
            Object.assign(translations,body.translations);
            if(!stopped) setStatus('ready');
          } catch { unavailable=true; keys.forEach(key=>failed.add(key)); if(!stopped) setStatus('unavailable'); }
        }
        running=false;
        if(!stopped && keys.length && !unavailable) timer=setTimeout(()=>void scan(),100);
      }
      if(stopped) return;
      observer=new MutationObserver(()=>{if(!running){clearTimeout(timer);timer=setTimeout(()=>void scan(),200);}});
      observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','placeholder']});
      void scan();
    });
    return ()=>{stopped=true;controller.abort();clearTimeout(timer);observer?.disconnect();for(const [node,value] of originals)if(node.isConnected && node.data===value.displayed)node.data=value.original;for(const [element,attributes]of originalAttributes)for(const [name,value]of attributes)if(element.isConnected&&element.getAttribute(name)===value.displayed)element.setAttribute(name,value.original);};
  },[locale]);
  return <LanguageContext.Provider value={{locale,setLocale,status}}>{children}<LanguagePicker floating /></LanguageContext.Provider>;
}

export function LanguagePicker({floating=false}:{floating?:boolean}) {
  const {locale,setLocale,status}=useContext(LanguageContext);
  const [open,setOpen]=useState(false);
  const [query,setQuery]=useState('');
  const button=useRef<HTMLButtonElement>(null);
  const panel=useRef<HTMLDivElement>(null);
  const search=useRef<HTMLInputElement>(null);
  useEffect(()=>{
    if(!open)return;
    search.current?.focus();
    function close(event:PointerEvent){if(!panel.current?.contains(event.target as Node)&&!button.current?.contains(event.target as Node))setOpen(false);}
    document.addEventListener('pointerdown',close);
    return ()=>document.removeEventListener('pointerdown',close);
  },[open]);
  const choices=open?languageCodes.filter(code=>`${code} ${languageName(code)} ${languageName(code,false)}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())):[];
  return <div data-language-picker data-no-translate data-floating-language={floating?'true':undefined} className={floating?styles.floating:styles.anchor}>
    <button ref={button} type="button" className={styles.trigger} aria-label={`Change language, current language ${languageName(locale,false)}`} aria-expanded={open} aria-haspopup="dialog" onClick={()=>{setQuery('');setOpen(!open);}}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 7h14M5 17h14"/></svg><span>{locale.toUpperCase()}</span></button>
    {open && createPortal(<div data-language-picker data-no-translate ref={panel} role="dialog" aria-label="Choose interface language" className={styles.panel} dir="ltr" onKeyDown={event=>{if(event.key==='Escape'){setOpen(false);button.current?.focus();}}}>
      <strong>Choose language</strong><input ref={search} aria-label="Search languages" placeholder="Search languages…" value={query} onChange={event=>setQuery(event.target.value)}/>
      <div className={styles.options}>{choices.map(code=><button type="button" key={code} aria-pressed={locale===code} onClick={()=>{setLocale(code);setOpen(false);button.current?.focus();}}><span lang="en">{languageName(code,false)}<small lang={code} dir="auto">{languageName(code)}</small></span><b>{code.toUpperCase()}</b></button>)}</div>
      <p>{locale==='en'?'English is the original interface.':status==='loading'?'Preparing automatic translation…':status==='unavailable'?'Translation is temporarily unavailable; original English is shown for missing labels.':'Automatic translation. Original listings and documents stay unchanged.'}</p>
    </div>,document.body)}
  </div>;
}
