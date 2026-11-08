'use client';
import {useEffect,useId,useRef,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import styles from './opportunity-actions.module.css';
export function ActionDialog({title,onClose,children}:{title:string;onClose:()=>void;children:ReactNode}){
  const ref=useRef<HTMLDivElement>(null),id=useId(),closeRef=useRef(onClose);
  useEffect(()=>{closeRef.current=onClose;},[onClose]);
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null,overflow=document.body.style.overflow;
    document.body.style.overflow='hidden';ref.current?.querySelector<HTMLButtonElement>('button')?.focus();
    function key(event:KeyboardEvent){
      if(event.key==='Escape'){event.preventDefault();closeRef.current();return;}
      if(event.key!=='Tab')return;
      const nodes=[...(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input,select,textarea,[tabindex="0"]')||[])].filter(e=>e.getClientRects().length);
      const first=nodes[0],last=nodes.at(-1);if(!first)return;
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
    document.addEventListener('keydown',key);
    return()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',key);previous?.focus();};
  },[]);
  return createPortal(<div className={styles.overlay} onClick={event=>{if(event.target===event.currentTarget)onClose();}}>
    <div ref={ref} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby={id}>
      <header><h2 id={id}>{title}</h2><button type="button" aria-label="Close dialog" onClick={onClose}>×</button></header>{children}
    </div>
  </div>,document.body);
}
