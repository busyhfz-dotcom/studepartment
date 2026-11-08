import assert from 'node:assert/strict';
import test from 'node:test';
import { scholarshipDegrees,parseDaadDataset,daadScholarshipRecords,daadDoctoralRecords } from '../src/server/opportunities/sources/scholarships';
import { parseOpportunityQuery } from '../src/server/opportunities/query';
import { selectInterfaceMessages,interfaceMessages } from '../src/lib/i18n/catalog';
import { languageCodes,supportedLanguage,languageDirection } from '../src/lib/i18n/languages';

test('degree scholarships have separate search types from grants and salaried doctoral positions',()=>{
  assert.deepEqual(parseOpportunityQuery(new URLSearchParams('type=masters-scholarship&type=phd-scholarship')).types,['masters-scholarship','phd-scholarship']);
  assert.deepEqual(scholarshipDegrees('Master’s Students and PhD Candidates Scholarships'),['MASTERS_SCHOLARSHIP','PHD_SCHOLARSHIP']);
  assert.deepEqual(scholarshipDegrees('Postdoctoral Research Fellowships'),[]);
  assert.deepEqual(scholarshipDegrees('Short-term scholarships for master students'),[]);
});
test('published JSON is parsed as data and embedded JavaScript is never executed',()=>{
  assert.deepEqual(parseDaadDataset('var scholarships = TAFFY([{"id":1}]);'),[{id:1}]);
  assert.throws(()=>parseDaadDataset('var scholarships = TAFFY([process.exit()]);'));
  assert.throws(()=>parseDaadDataset('[]'));
});
test('nationality-dependent deadlines are not turned into one universal date',()=>{
  const now=new Date('2026-11-08T10:00:00Z');
  const award={id:1,sapProgid:1,nameEn:'Synthetic Master scholarship',introduction:{en:'Synthetic degree funding programme.'}};
  const [record]=daadScholarshipRecords([award],[{id:1,general:{en:''},countries:[{deadline:'2026-11-15'},{deadline:'2026-12-01'}]}],now);
  assert.equal(record.deadline,null);
  assert.equal(record.metadata?.applicationWindow,'country-specific-or-unconfirmed');
  assert.deepEqual(record.eligibleCountryCodes,undefined);
  assert.equal(record.eligibleCareerStages,undefined,'degree level must not invent the applicant’s current career-stage eligibility');
});
test('a past published deadline is preserved for the ingestion expiry rule',()=>{
  const [record]=daadScholarshipRecords([{id:1,sapProgid:1,nameEn:'Synthetic Doctoral Scholarship'}],[{id:1,general:{en:'Application deadline: 2026-01-01'}}],new Date('2026-11-08T10:00:00Z'));
  assert.equal(record.deadline,'2026-01-01');
});
test('a doctoral job requiring a master degree stays a position and does not invent a host university',()=>{
  const xml='<rss><channel/><item><guid>synthetic1</guid><title>Synthetic PhD Position</title><description>Master degree required. Salary TV-L. Other scholarships may exist.</description><link>https://www.daad.de/en/example</link><applicationDeadline>04. Dec 2026</applicationDeadline></item></rss>';
  const [record]=daadDoctoralRecords(xml,new Date('2026-11-08'));
  assert.equal(record.type,'PHD');
  assert.equal(record.deadline,'2026-12-04');
  assert.equal(record.organization.name,'German Academic Exchange Service (DAAD)');
});
test('explicit doctoral scholarship and source links are retained',()=>{
  const xml='<rss><item><guid>synthetic2</guid><title>Synthetic PhD scholarship</title><description>Monthly scholarship.</description><link>https://www.daad.de/en/example</link><applicationDeadline>01. Dec 2026</applicationDeadline></item></rss>';
  assert.equal(daadDoctoralRecords(xml,new Date('2026-11-08'))[0].type,'PHD_SCHOLARSHIP');
  assert.deepEqual(daadDoctoralRecords(xml.replace('https://www.daad.de','https://example.invalid'),new Date('2026-11-08')),[]);
});
test('translation requests accept only predefined public labels, never arbitrary private text',()=>{
  const key=Object.keys(interfaceMessages)[0];
  const selected=selectInterfaceMessages({locale:'fa',keys:[key],question:'PRIVATE TEXT MUST NOT BE FORWARDED'});
  assert.ok(selected);
  assert.deepEqual(Object.keys(selected.strings),[key]);
  assert.ok(!JSON.stringify(selected).includes('PRIVATE TEXT'));
  for(const keys of [['private note'],['__proto__'],[{}],[],Array(81).fill(key)])assert.equal(selectInterfaceMessages({locale:'fa',keys}),null);
  assert.equal(selectInterfaceMessages({locale:'../../en',keys:[key]}),null);
});
test('language defaults, ISO language choices and right-to-left scripts are explicit',()=>{
  assert.equal(new Set(languageCodes).size,languageCodes.length);
  assert.ok(languageCodes.length>=180);
  assert.equal(supportedLanguage('en'),true);
  assert.equal(languageDirection('fa'),'rtl');assert.equal(languageDirection('ar'),'rtl');assert.equal(languageDirection('fr'),'ltr');
});
