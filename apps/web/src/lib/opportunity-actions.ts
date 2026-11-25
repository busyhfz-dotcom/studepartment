import type { OpportunityResult } from './api-contracts';
export type ShareableOpportunity = {id:string;title:string;type?:string;deadline?:string|null;deadlinePrecision?:string; views?:number; likes?:number; liked?:boolean};
export function opportunityPath(item:Pick<ShareableOpportunity,'id'|'type'>) {
  const type=(item.type||'position').toLowerCase().replace(/[ _]+/g,'-');
  const kind=['grant','masters-scholarship','phd-scholarship','md-scholarship'].includes(type)?type:'position';
  return '/start?'+new URLSearchParams({step:'detail',kind,opportunity:item.id});
}
function icsEscape(value:string){return value.replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');}
const utcStamp=(date:Date)=>date.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
export function calendarLinks(item:ShareableOpportunity,origin:string) {
  const deadline = new Date(item.deadline ?? "");
  if (!Number.isFinite(deadline.getTime()) || item.deadlinePrecision === "month-only") return null;
  const allDay = item.deadlinePrecision === "date-only";
  const nextDay = new Date(deadline.getTime() + 86_400_000);
  const end = allDay ? nextDay : new Date(deadline.getTime() + 15 * 60_000);
  const day = (date: Date) => date.toISOString().slice(0, 10);
  const title = 'Application deadline: ' + item.title;
  const details = new URL(opportunityPath(item), origin).href;
  const range = allDay ? day(deadline).replaceAll('-', '') + '/' + day(end).replaceAll('-', '') : utcStamp(deadline) + '/' + utcStamp(end);
  const outlook = new URLSearchParams({
    rru:'addevent', subject:title, body:details, allday:String(allDay),
    startdt:allDay ? day(deadline) : deadline.toISOString(),
    enddt:allDay ? day(end) : end.toISOString(),
  });
  return {
    google:'https://calendar.google.com/calendar/render?' + new URLSearchParams({action:'TEMPLATE', text:title, dates:range, details}),
    outlook:'https://outlook.office.com/calendar/action/compose?' + outlook,
    outlookPersonal:'https://outlook.live.com/calendar/0/deeplink/compose?' + outlook,
  };
}
export function reminderCalendar(items:ShareableOpportunity[],days:number,origin:string,now=new Date()) {
  if(!Number.isInteger(days)||days<1||days>90)throw new Error('Choose a reminder between 1 and 90 days.');
  const events=items.filter(item=>item.deadline&&!Number.isNaN(Date.parse(item.deadline))).map(item=>{
    const date=new Date(item.deadline!);
    const dateOnly=item.deadlinePrecision==='date-only';
    const dateLine=dateOnly?'DTSTART;VALUE=DATE:'+date.toISOString().slice(0,10).replaceAll('-',''):'DTSTART:'+utcStamp(date);
    return ['BEGIN:VEVENT','UID:'+encodeURIComponent(item.id)+'@provenant','DTSTAMP:'+utcStamp(now),dateLine,
      'SUMMARY:'+icsEscape('Application deadline: '+item.title),
      'URL:'+new URL(opportunityPath(item),origin).href,
      'DESCRIPTION:'+icsEscape('Confirm the deadline and application requirements at the original source.'),
      'BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:Application deadline reminder','TRIGGER:-P'+days+'D','END:VALARM','END:VEVENT'];
  });
  if(!events.length)throw new Error('A fixed deadline is required for a calendar reminder.');
  // RFC 5545 folds content lines at 75 octets, without splitting Unicode code points.
  const encoder=new TextEncoder();
  const fold=(line:string)=>{const parts:string[]=[];let current='',size=0;for(const char of line){const bytes=encoder.encode(char).length;if(size+bytes>75){parts.push(current);current=' ';size=1;}current+=char;size+=bytes;}parts.push(current);return parts.join('\r\n');};
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Provenant//Deadline reminders//EN','CALSCALE:GREGORIAN',...events.flat(),'END:VCALENDAR'].map(fold).join('\r\n')+'\r\n';
}
export function csvCell(value:unknown) {
  let text=String(value??'');
  if(/^[\s\u0000-\u001f]*[=+@-]/.test(text))text="'"+text;
  return '"'+text.replaceAll('"','""')+'"';
}
export function opportunityCsv(rows:OpportunityResult[],origin:string){
  const headings=['Close date','Status','Title','Agency','Region','Award min','Award max','Currency','Eligibility','Competition rate','Competition basis','Region context','Source URL','Provenant URL'];
  return '\uFEFF'+[headings,...rows.map(item=>[item.deadline?.slice(0,10)||'',item.grant?.status||'Open',item.title,item.grant?.agency||item.organization,item.grant?.region||'Not specified',item.grant?.awardMin??'',item.grant?.awardMax??'',item.grant?.currency||'',item.publishedEligibility||'',item.competition?.rate??'',item.competition?.basis||'',item.grant?.regionContext||'See source eligibility',item.sourceUrl,new URL(opportunityPath(item),origin).href])].map(row=>row.map(csvCell).join(',')).join('\r\n')+'\r\n';
}
