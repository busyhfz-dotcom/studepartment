'use client';

import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { languageCodes, languageDirection, languageName, supportedLanguage } from '@/lib/i18n/languages';
import { reviewedTranslation } from '@/lib/i18n/reviewed';
import styles from './language.module.css';

type LanguageState = { locale:string; setLocale:(locale:string)=>void; status:'ready'|'loading'|'unavailable' };
const LanguageContext = createContext<LanguageState>({locale:'en',setLocale:()=>{},status:'ready'});
const storageKey = 'provenant-language';
const catalog = () => import('@/lib/i18n/ui-catalog.json').then(module => module.default);
const changeNotice = {
  fa: { title: 'زبان رابط کاربری', search: 'جست‌وجوی زبان', noResults: 'زبانی با این نام پیدا نشد.', close: 'بستن', active: 'انتخاب فعلی' },
  es: { title: 'Idioma de la interfaz', search: 'Buscar idioma', noResults: 'No se encontraron idiomas.', close: 'Cerrar', active: 'Seleccionado' },
  fr: { title: 'Langue de l’interface', search: 'Rechercher une langue', noResults: 'Aucune langue trouvée.', close: 'Fermer', active: 'Sélectionnée' },
  de: { title: 'Sprache der Benutzeroberfläche', search: 'Sprache suchen', noResults: 'Keine Sprache gefunden.', close: 'Schließen', active: 'Ausgewählt' },
  en: { title: 'Interface language', search: 'Find a language', noResults: 'No languages found.', close: 'Close', active: 'Selected' },
};

function loadTranslations(locale: string, entries: Record<string, string>) {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem('provenant-ui-v1:' + locale) || '{}');
    if (!stored || typeof stored !== 'object') return {};
    return Object.fromEntries(Object.entries(stored).filter(([key, value]) =>
      Object.hasOwn(entries, key) && typeof value === 'string' && value.length <= 2000));
  } catch { return {}; }
}

function saveTranslations(locale: string, translations: Record<string, string>) {
  try { localStorage.setItem('provenant-ui-v1:' + locale, JSON.stringify(Object.fromEntries(Object.entries(translations).slice(-500)))); } catch {}
}
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
    let stopped=false, running=false, timer:ReturnType<typeof setTimeout>|undefined;
    const controller=new AbortController();
    const originals=new Map<Text,{original:string;displayed:string}>();
    const originalAttributes=new Map<Element,Map<string,{original:string;displayed:string}>>();
    let observer:MutationObserver|undefined;
    const normalize=(text:string)=>text.replace(/\s+/g,' ').trim();
    void catalog().then(async messages=>{
      const entries=Object.entries(messages);
      const byText=new Map(entries.map(([key,text])=>[text,key]));
      const local = loadTranslations(locale, messages);
      const translations:Record<string,string>={...local,...Object.fromEntries(entries.flatMap(([key,text])=>{const translated=reviewedTranslation(locale,text);return translated?[[key,translated]]:[];}))};
      const failed=new Set<string>();
      const checkedCache=new Set<string>();
      async function scan() {
        if(stopped || running) return;
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
          const unchecked = keys.filter(key => !checkedCache.has(key));
          const cacheOnly = unchecked.length > 0;
          const requested = cacheOnly ? unchecked : keys;
          requested.forEach(key => checkedCache.add(key));
          setStatus('loading');
          try {
            const response=await fetch('/api/v1/interface-translations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({locale,keys:requested,cacheOnly}),cache:'no-store',signal:controller.signal});
            const body=await response.json();
            if(stopped) return;
            if(!body.translations) throw Error('Translation unavailable');
            for (const key of requested) {
              const value = body.translations[key];
              if (typeof value === 'string' && value.trim() && value.length <= 2000) translations[key] = local[key] = value;
              else if (!cacheOnly) failed.add(key);
            }
            saveTranslations(locale, local);
            setStatus(response.ok ? 'ready' : 'unavailable');
          } catch { if(!cacheOnly) requested.forEach(key=>failed.add(key)); if(!stopped) setStatus('unavailable'); }
        }
        running=false;
        if(!stopped && keys.length) timer=setTimeout(()=>void scan(),0);
      }
      if(stopped) return;
      observer=new MutationObserver(()=>{if(!running){clearTimeout(timer);timer=setTimeout(()=>void scan(),200);}});
      observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','placeholder']});
      void scan();
    }).catch(()=>{ if(!stopped) setStatus('unavailable'); });
    return ()=>{stopped=true;controller.abort();clearTimeout(timer);observer?.disconnect();for(const [node,value] of originals)if(node.isConnected && node.data===value.displayed)node.data=value.original;for(const [element,attributes]of originalAttributes)for(const [name,value]of attributes)if(element.isConnected&&element.getAttribute(name)===value.displayed)element.setAttribute(name,value.original);};
  },[locale]);
  return <LanguageContext.Provider value={{locale,setLocale,status}}>{children}<LanguagePicker floating /></LanguageContext.Provider>;
}

export function LanguagePicker({floating=false}:{floating?:boolean}) {
  const {locale,setLocale,status}=useContext(LanguageContext);
  const copy=changeNotice[locale as keyof typeof changeNotice] ?? changeNotice.en;
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
  const searchText=query.trim().toLocaleLowerCase();
  const choices=open?languageCodes.filter(code=>`${code} ${languageName(code)} ${languageName(code,false)}`.toLocaleLowerCase().includes(searchText)):[];
  function close() { setOpen(false); button.current?.focus(); }
  return <div data-language-picker data-no-translate data-floating-language={floating?'true':undefined} className={floating?styles.floating:styles.anchor}>
    <button ref={button} type="button" className={styles.trigger} data-language-status={status} aria-label={`Change language, current language ${languageName(locale,false)}`} aria-expanded={open} aria-haspopup="dialog" onPointerEnter={()=>{void catalog().catch(()=>{});}} onFocus={()=>{void catalog().catch(()=>{});}} onClick={()=>{setQuery('');setOpen(!open);}}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 7h14M5 17h14"/></svg><span>{locale.toUpperCase()}</span></button>
    {open && createPortal(<div data-language-picker data-no-translate ref={panel} role="dialog" aria-label={copy.title} className={styles.panel} dir={languageDirection(locale)} onKeyDown={event=>{if(event.key==='Escape'){event.stopPropagation();close();}}}>
      <header className={styles.panelHeader}><strong>{copy.title}</strong><button type="button" onClick={close} aria-label={copy.close}>×</button></header>
      <div className={styles.search}>
        <svg aria-hidden="true" viewBox="0 0 20 20"><circle cx="8.5" cy="8.5" r="5"/><path d="m12 12 4 4"/></svg>
        <input ref={search} aria-label={copy.search} placeholder={copy.search} value={query} onChange={event=>setQuery(event.target.value)}/>
      </div>
      <div className={styles.options}>{choices.map(code=><button type="button" key={code} aria-pressed={locale===code} onClick={()=>{setLocale(code);close();}}><b aria-hidden="true">{code.toUpperCase()}</b><span lang="en">{languageName(code,false)}<small lang={code} dir="auto">{languageName(code)}</small></span>{locale===code?<span className={styles.selected} aria-label={copy.active}>✓</span>:null}</button>)}
        {!choices.length ? <p>{copy.noResults}</p> : null}
      </div>
    </div>,document.body)}
  </div>;
}
