import type { OpportunityIngestionRecord } from '../ingestion';
import { requestText } from './http';
import { parseFeed } from './rss';
import { htmlToText, cleanDescription } from './text';
import { deadlineFromText } from './positions';
import { topicSlugsFor, methodSlugsFor } from './classify';
import type { OpportunitySourceConnector } from './types';

const daadDatabase = 'https://www2.daad.de/deutschland/stipendium/datenbank/en/21148-scholarship-database/';
type DaadAward = {id:number;sapProgid:number;nameEn:string;introduction?:{en?:string}};
type DaadDeadline = {id:number;general?:{en?:string};countries?:Array<unknown>};

/** Parses DAAD's published JSON dataset without executing its JavaScript wrapper. */
export function parseDaadDataset<T>(text:string):T[] {
  const start=text.indexOf('['), end=text.lastIndexOf(']');
  if(start<0 || end<start || !/^\s*var \w+\s*=\s*TAFFY\(/.test(text)) throw Error('DAAD dataset format changed');
  const parsed:unknown=JSON.parse(text.slice(start,end+1));
  if(!Array.isArray(parsed))throw Error('DAAD dataset is not an array');
  return parsed as T[];
}

/** Degree names must describe the award, not an applicant's required previous qualification. */
export function scholarshipDegrees(title:string):Array<'MASTERS_SCHOLARSHIP'|'PHD_SCHOLARSHIP'> {
  if(/\b(post[- ]?doc\w*|alumni|summer course|short.term|conference|internship)\b/i.test(title)) return [];
  const result:Array<'MASTERS_SCHOLARSHIP'|'PHD_SCHOLARSHIP'>=[];
  if(/\b(master(?:['’]s|s)?|msc|m\.sc\.|ma degree)\b/i.test(title))result.push('MASTERS_SCHOLARSHIP');
  if(/\b(ph\.?\s?d|doctoral|doctorate)\b/i.test(title))result.push('PHD_SCHOLARSHIP');
  return result;
}

export function daadScholarshipRecords(awards:DaadAward[],deadlines:DaadDeadline[],now:Date):OpportunityIngestionRecord[] {
  const records:OpportunityIngestionRecord[]=[];
  for(const award of awards) {
    if(!Number.isSafeInteger(award.sapProgid) || !award.nameEn)continue;
    const degrees=scholarshipDegrees(award.nameEn);
    const general=htmlToText(deadlines.find(row=>row.id===award.sapProgid)?.general?.en || '');
    // Country-specific deadlines must not be presented as one universal deadline.
    const dates=[...new Set(general.match(/\b\d{1,2}[./]\d{1,2}[./]\d{4}\b|\b\d{4}-\d{2}-\d{2}\b/g)||[])];
    const deadline=dates.length===1?deadlineFromText('Deadline: '+dates[0],now):null;
    const description=cleanDescription(award.introduction?.en,700)||'';
    for(const type of degrees) records.push({
      sourceRecordId:`${award.sapProgid}:${type}`,sourceUrl:`${daadDatabase}?detail=${award.sapProgid}`,type,title:award.nameEn,
      description:`${description}\nApplication windows and eligibility can depend on your country. Confirm the current round on the DAAD record.${general?' Published deadline guidance: '+general.slice(0,350):''}`,
      organization:{name:'German Academic Exchange Service (DAAD)',type:'FOUNDATION',countryCode:'DE',website:'https://www.daad.de/'},countryCode:'DE',deadline,
      eligibleCareerStages:[type==='MASTERS_SCHOLARSHIP'?'student':'phd'],topicSlugs:topicSlugsFor(award.nameEn+' '+description),methodSlugs:methodSlugsFor(description),
      metadata:{degreeFunding:true,applicationWindow:deadline?'published':'country-specific-or-unconfirmed',publisherRecordId:award.sapProgid},
    });
  }
  return records;
}

export const daadScholarshipsSource:OpportunitySourceConnector={
  id:'daad-scholarships',source:{type:'FUNDER',name:'DAAD scholarship database',verified:true},kind:'scholarships',homepage:daadDatabase,
  description:'Master’s and doctoral funding programmes from DAAD’s published scholarship database. Application windows may depend on nationality.',completeSnapshot:true,intervalMinutes:180,isEnabled:()=>true,
  async collect(context) {
    const page=await requestText(context.fetch,daadDatabase);
    const resources=Array.from(page.matchAll(/src="([^\"]+\/([a-z]+)\.js[^\"]*)"/g));
    const resource=(name:string)=>{const entry=resources.find(match=>match[2]===name);if(!entry)throw Error('DAAD published dataset not found');const url=new URL(entry[1].replaceAll('&amp;','&'),daadDatabase);if(url.origin!=='https://www2.daad.de')throw Error('Invalid DAAD dataset host');return url.href;};
    const [awards,deadlines]=await Promise.all([requestText(context.fetch,resource('scholarships')),requestText(context.fetch,resource('deadlines'))]);
    return daadScholarshipRecords(parseDaadDataset<DaadAward>(awards),parseDaadDataset<DaadDeadline>(deadlines),context.now);
  },
};

export function daadDoctoralRecords(xml:string,now:Date):OpportunityIngestionRecord[] {
  const blocks=Array.from(xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi),m=>m[1]);
  return parseFeed(xml).flatMap((item,index)=>{
    const text=htmlToText(item.description);
    // A salaried doctoral job is a position. Only explicitly funded awards are scholarships.
    const awardWords=/\b(scholarship|stipend|studentship|fellowship|stipendium)\b/i;
    const scholarship=awardWords.test(item.title)||(awardWords.test(text)&&!/(TV-L|Entgeltgruppe|employment contract|salaried|salary)/i.test(text));
    const rawDeadline=blocks[index]?.match(/<applicationDeadline>([^<]+)<\/applicationDeadline>/i)?.[1];
    const parsed=rawDeadline?new Date(rawDeadline.replace(/(\d)\.\s*/,'$1 ')+' UTC'):null;
    const deadline=parsed&&!Number.isNaN(parsed.getTime())?parsed.toISOString().slice(0,10):deadlineFromText(text,now);
    let url:URL;try{url=new URL(item.link);}catch{return [];}
    if(url.protocol!=='https:'||!/(^|\.)daad\.de$/.test(url.hostname))return [];
    return [{sourceRecordId:item.guid,sourceUrl:item.link,applicationUrl:item.link,type:scholarship?'PHD_SCHOLARSHIP':'PHD',title:item.title,
      description:cleanDescription(item.description,1000),organization:{name:'German Academic Exchange Service (DAAD)',type:'FOUNDATION',countryCode:'DE',website:'https://www.daad.de/'},
      countryCode:'DE',deadline,eligibleCareerStages:['phd'],topicSlugs:topicSlugsFor(item.title+' '+text),methodSlugs:methodSlugsFor(text),metadata:{publisher:'DAAD PhDGermany',degreeFunding:scholarship}} as OpportunityIngestionRecord];
  });
}

export const daadDoctoralSource:OpportunitySourceConnector={id:'daad-phdgermany',source:{type:'RESEARCH_NETWORK',name:'DAAD PhDGermany',verified:true},kind:'scholarships',homepage:'https://www.daad.de/en/studying-in-germany/phd-studies-research/phd-germany/',description:'The official PhDGermany feed. Explicit scholarships are separated from salaried PhD positions.',completeSnapshot:false,intervalMinutes:60,isEnabled:()=>true,
  async collect(context){return daadDoctoralRecords(await requestText(context.fetch,'https://api.daad.de/api/feeds/rss/en/phd.xml'),context.now);}};
