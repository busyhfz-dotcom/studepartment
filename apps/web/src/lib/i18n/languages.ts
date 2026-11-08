// ISO 639-1 language choices. Labels are generated locally; no translation widget receives page content.
const codes = 'aa ab ae af ak am an ar as av ay az ba be bg bh bi bm bn bo br bs ca ce ch co cr cs cu cv cy da de dv dz ee el en eo es et eu fa ff fi fj fo fr fy ga gd gl gn gu gv ha he hi ho hr ht hu hy hz ia id ie ig ii ik io is it iu ja jv ka kg ki kj kk kl km kn ko kr ks ku kv kw ky la lb lg li ln lo lt lu lv mg mh mi mk ml mn mr ms mt my na nb nd ne ng nl nn no nr nv ny oc oj om or os pa pi pl ps pt qu rm rn ro ru rw sa sc sd se sg si sk sl sm sn so sq sr ss st su sv sw ta te tg th ti tk tl tn to tr ts tt tw ty ug uk ur uz ve vi vo wa wo xh yi yo za zh zu'.split(' ');
export const languageCodes: readonly string[] = codes;
const names = new Map<string,string>();
export function supportedLanguage(value: unknown): value is string { return typeof value === 'string' && codes.includes(value); }
export function languageName(code: string, native = true) {
  const key=`${code}:${native}`;
  const cached=names.get(key);if(cached)return cached;
  let name:string;try { name=new Intl.DisplayNames([native ? code : 'en'],{type:'language'}).of(code) || code; } catch { name=code.toUpperCase(); }
  names.set(key,name);return name;
}
export function languageDirection(code: string): 'rtl' | 'ltr' { return ['ar','fa','he','ur','ps','sd','ug','yi','dv','ks'].includes(code) ? 'rtl' : 'ltr'; }
