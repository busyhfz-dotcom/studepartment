import type { OpportunityResult } from '@/lib/api-contracts';
export type EntryKind = 'position' | 'grant' | 'masters-scholarship' | 'phd-scholarship' | 'md-phd-scholarship';
export function entryDeadlineLabel(item:Pick<OpportunityResult,'deadline'|'deadlinePrecision'>,locale?:string):string {
  if(!item.deadline)return item.deadlinePrecision==='rolling'?'Rolling deadline':'Deadline on the listing';
  const date=new Date(item.deadline);
  if(Number.isNaN(date.getTime()))return 'See source for deadline';
  const dateOnly=item.deadlinePrecision==='date-only'||item.deadlinePrecision==='month-only';
  return date.toLocaleDateString(locale,{month:'short',year:'numeric',...(item.deadlinePrecision==='month-only'?{}:{day:'numeric'}),...(dateOnly?{timeZone:'UTC'}:{})});
}
export const entryLabels: Record<EntryKind, string> = {
  position: 'Research positions', grant: 'Grants for research leaders',
  'masters-scholarship': 'Master’s scholarships', 'phd-scholarship': 'PhD scholarships',
  'md-phd-scholarship': 'MD-PhD scholarships & fellowships',
};
export function entryKind(value: string | null): EntryKind {
  return value && Object.hasOwn(entryLabels,value) ? value as EntryKind : 'position';
}
export function entrySearchParams(kind: EntryKind, query: string, country: string, page: number) {
  const params=new URLSearchParams({limit:'24',page:String(page)});
  const types=kind==='position'?['phd','postdoc','fellowship','research-assistantship','collaboration']:
    kind==='md-phd-scholarship'?['phd','phd-scholarship','fellowship']:[kind];
  for(const type of types)params.append('type',type);
  if(kind==='md-phd-scholarship')params.set('audience','md-phd');
  if(kind==='grant')params.set('career','faculty');
  if(query.trim())params.set('q',query.trim());
  if(country.trim())params.set('country',country.trim());
  return params;
}
export const entryCategories: Array<{kind:Exclude<EntryKind,'md-phd-scholarship'>; title:string; audience:string; description:string}> = [
  {kind:'masters-scholarship',title:'Master’s scholarships',audience:'Begin a research career',description:'Funding for taught and research master’s programmes.'},
  {kind:'phd-scholarship',title:'PhD scholarships',audience:'Develop your research',description:'Doctoral scholarships and funded studentships, with a dedicated MD-PhD route.'},
  {kind:'grant',title:'Grants for group leaders & PIs',audience:'Lead a research team',description:'Funding calls for principal investigators, group leaders and their host institutions.'},
  {kind:'position',title:'Research positions',audience:'Join a research team',description:'Research assistant, postdoctoral, fellowship and other research roles.'},
];
