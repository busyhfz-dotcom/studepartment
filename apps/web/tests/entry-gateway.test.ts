import assert from 'node:assert/strict';
import test from 'node:test';
import {entryKind, entrySearchParams, entryCategories, entryDeadlineLabel} from '../src/app/start/entry-paths';
import {parseOpportunityQuery} from '../src/server/opportunities/query';
import {reviewedTranslation} from '../src/lib/i18n/reviewed';

test('audience-specific entry routes preserve filters and pagination on direct entry',()=>{
  const query=parseOpportunityQuery(entrySearchParams('md-phd-scholarship','  oncology  ','US',3));
  assert.equal(query.audience,'md-phd');
  assert.equal(query.text,'oncology');
  assert.deepEqual(query.countryCodes,['US']);
  assert.deepEqual(query.types,['phd','phd-scholarship','fellowship']);
  assert.equal(query.page,3);
  assert.equal(query.limit,24);
  assert.equal(parseOpportunityQuery(new URLSearchParams('audience=unknown')).audience,undefined);
});
test('research leaders use the published faculty filter while degree funding remains separate',()=>{
  assert.equal(parseOpportunityQuery(entrySearchParams('grant','','',1)).careerStage,'faculty');
  assert.deepEqual(parseOpportunityQuery(entrySearchParams('masters-scholarship','','',1)).types,['masters-scholarship']);
  assert.equal(entryKind('__proto__'),'position');
  assert.equal(entryKind('md-phd-scholarship'),'md-phd-scholarship');
  assert.equal(entryCategories.length,4);
});
test('the new entrance invitations have reviewed Persian and Spanish copy',()=>{
  for(const locale of ['fa','es'])for(const text of ['Find grant & position','Post a position','Your next chapter in research.']){
    assert.ok(reviewedTranslation(locale,text));
    assert.notEqual(reviewedTranslation(locale,text),text);
  }
});
test('date-only and month-only closing dates do not shift into the following day in Tehran',()=>{
  const previous=process.env.TZ;
  process.env.TZ='Asia/Tehran';
  try{
    assert.equal(entryDeadlineLabel({deadline:'2028-05-07T23:59:59.999Z',deadlinePrecision:'date-only'},'en-US'),'May 7, 2028');
    assert.equal(entryDeadlineLabel({deadline:'2028-05-31T23:59:59.999Z',deadlinePrecision:'month-only'},'en-US'),'May 2028');
    assert.equal(entryDeadlineLabel({deadline:'invalid',deadlinePrecision:'unknown'}),'See source for deadline');
  }finally{if(previous===undefined)delete process.env.TZ;else process.env.TZ=previous;}
});
