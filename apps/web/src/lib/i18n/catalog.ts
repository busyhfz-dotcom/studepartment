import catalog from './ui-catalog.json';
import { supportedLanguage } from './languages';
export const interfaceMessages:Record<string,string>=catalog;
export function selectInterfaceMessages(raw:unknown):{locale:string;keys:string[];strings:Record<string,string>}|null {
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;
  const body=raw as {locale?:unknown;keys?:unknown};
  if(!supportedLanguage(body.locale)||!Array.isArray(body.keys)||!body.keys.length||body.keys.length>80)return null;
  if(body.keys.some(key=>typeof key!=='string'||!Object.hasOwn(interfaceMessages,key)))return null;
  const keys=[...new Set<string>(body.keys)];
  return {locale:body.locale,keys,strings:Object.fromEntries(keys.map(key=>[key,interfaceMessages[key]]))};
}
