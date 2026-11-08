import assert from 'node:assert/strict';
import test from 'node:test';
import {opportunityPath,opportunityCsv,csvCell,reminderCalendar} from '../src/lib/opportunity-actions';
import {grantDetails,publishedAmount} from '../src/server/opportunities/grant-details';
import {toGrantsGovRecord} from '../src/server/opportunities/sources/grants-gov';
import type {OpportunityResult} from '../src/lib/api-contracts';
test('a shared saved-listing link contains only a public record identity and route',()=>{
  const path=opportunityPath({id:'test & grant',type:'GRANT'});
  const url=new URL(path,'https://example.test');
  assert.equal(url.searchParams.get('opportunity'),'test & grant');
  assert.equal(url.searchParams.get('kind'),'grant');
  assert.deepEqual([...url.searchParams.keys()],['step','kind','opportunity']);
});
test('published grant amounts retain zero and reject non-numeric values and programme-wide budgets',()=>{
  assert.equal(publishedAmount('0'),'0');assert.equal(publishedAmount('500000.50'),'500000.50');
  for(const amount of ['Not available','-1','Infinity','1e12','10000000000000000'])assert.equal(publishedAmount(amount),undefined);
  const grant=grantDetails({sourceName:'EU Funding & Tenders Portal',organization:'Horizon Europe',eligibleCountryCodes:[],metadata:{status:'forthcoming',budget:100000000}});
  assert.equal(grant.status,'Upcoming');assert.equal(grant.awardMax,undefined);
  assert.equal(grant.region,'Europe');assert.match(grant.regionContext,/confirm applicant eligibility/);
});
test('published applicant geography takes precedence over the funding programme region',()=>{
  const grant=grantDetails({sourceName:'Grants.gov',organization:'NIH',eligibleCountryCodes:['CN','DE'],metadata:{oppStatus:'posted',awardMin:'0',awardMax:'250000'}});
  assert.equal(grant.region,'CN, DE');assert.equal(grant.regionContext,'Published applicant geography');
  assert.equal(grant.awardMin,'0');assert.equal(grant.currency,'USD');
  const legacy=grantDetails({sourceName:'Grants.gov',organization:'NIH',eligibleCountryCodes:[],metadata:{},description:'Award ceiling: US$250,000. Funding opportunity number test.'});
  assert.equal(legacy.awardMax,'250000');assert.equal(legacy.awardMin,undefined);
});
test('official Grants.gov records preserve the floor, ceiling, agency and currency as source metadata',()=>{
  const record=toGrantsGovRecord({id:'test',number:'SYNTHETIC',title:'Synthetic health grant',agencyCode:'HHS-NIH11',agency:'National Cancer Institute',oppStatus:'posted'},
    {awardFloor:'1000',awardCeiling:'200000'});
  assert.equal(record.metadata?.awardMin,'1000');assert.equal(record.metadata?.awardMax,'200000');
  assert.equal(record.metadata?.agencyName,'National Cancer Institute');
});
test('CSV protects spreadsheet formulas, preserves multilingual text and never exports private notes',()=>{
  for(const value of ['=HYPERLINK("bad")',' +SUM(1)','\t@command','-command'])assert.ok(csvCell(value).startsWith('"\''));
  const item=Object.assign({id:'synthetic',type:'grant',title:'فرصت, "پژوهش"',organization:'Agency',sourceUrl:'https://example.test/notice',deadline:'2028-05-07T23:59:59.999Z',grant:{status:'Open',agency:'Agency',region:'Europe',awardMin:'0',awardMax:'100',currency:'EUR',regionContext:'Published applicant geography'}} as OpportunityResult,{notes:'PRIVATE_APPLICATION_NOTE'});
  const csv=opportunityCsv([item],'https://example.test');
  assert.ok(csv.startsWith('\uFEFF"Close date","Status","Title","Agency","Region","Award min","Award max"'));
  assert.match(csv,/فرصت, ""پژوهش""/);assert.match(csv,/"2028-05-07"/);
  assert.ok(!csv.includes('PRIVATE_APPLICATION_NOTE'));assert.ok(csv.includes('step%3D')===false);
  assert.match(csv,/opportunity=synthetic/);
});
test('calendar alerts preserve day-only dates, use 15 or 20 day alarms and escape source text',()=>{
  const item={id:'synthetic',type:'grant',title:'فرصت پژوهشی '.repeat(30)+'\nBEGIN:VEVENT',deadline:'2028-05-07T23:59:59.999Z',deadlinePrecision:'date-only'};
  for(const days of [15,20]){
    const calendar=reminderCalendar([item],days,'https://example.test',new Date('2026-11-08'));
    assert.match(calendar,/DTSTART;VALUE=DATE:20280507/);assert.ok(calendar.includes('TRIGGER:-P'+days+'D'));
    assert.equal(calendar.match(/\r\nBEGIN:VEVENT\r\n/g)?.length,1);
    for(const line of calendar.trimEnd().split('\r\n'))assert.ok(Buffer.byteLength(line,'utf8')<=75);
  }
  assert.throws(()=>reminderCalendar([],15,'https://example.test'));
  assert.throws(()=>reminderCalendar([item],0,'https://example.test'));
});
