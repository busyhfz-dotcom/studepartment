import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {getDb, type Prisma} from '@studepartment/db';

async function main() {
// Fixtures are permitted only in the disposable local CI database.
const base=new URL(process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3000');
const database=new URL(process.env.DATABASE_URL || 'postgresql://invalid');
assert.equal(process.env.DEPLOYMENT_ENV,'ci');
for(const host of [base.hostname,database.hostname])assert.ok(['localhost','127.0.0.1'].includes(host));
const db=getDb();
const marker='ci-entry-'+randomUUID();
let organizationId:string|undefined;
try {
  const org=await db.organization.create({data:{name:'National Institutes of Health — CI synthetic fixture',normalizedName:marker,type:'RESEARCH_INSTITUTE'}});
  organizationId=org.id;
  const fixtures:Array<{key:string;title:string;type:Prisma.OpportunityCreateManyInput['type'];sourceName?:string;status?:Prisma.OpportunityCreateManyInput['status'];deadline?:Date}>= [
    {key:'f30',title:'Individual dual-degree training (Parent F30)',type:'FELLOWSHIP',sourceName:'Grants.gov'},
    {key:'explicit',title:'MD-PhD funded studentship',type:'PHD_SCHOLARSHIP'},
    {key:'generic',title:'PhD scholarship in cancer biology',type:'PHD_SCHOLARSHIP'},
    {key:'t32',title:'Institutional dual-degree training (T32)',type:'GRANT',sourceName:'Grants.gov'},
    {key:'f31',title:'Individual research fellowship (F31)',type:'FELLOWSHIP',sourceName:'Grants.gov'},
    {key:'wrong-source',title:'Individual dual-degree training (Parent F30)',type:'FELLOWSHIP'},
    {key:'closed',title:'MD/PhD closed scholarship',type:'PHD_SCHOLARSHIP',status:'CLOSED'},
    {key:'expired',title:'MD-PhD expired studentship',type:'PHD_SCHOLARSHIP',deadline:new Date('2020-01-01')},
  ];
  await db.opportunity.createMany({data:fixtures.map(f=>({
    id:marker+'-'+f.key,organizationId:org.id,title:f.title,type:f.type,
    sourceName:f.sourceName||'CI synthetic source',sourceKey:marker+'-'+f.key,sourceRecordId:f.key,
    sourceUrl:'https://example.test/'+f.key,status:f.status||'ACTIVE',
    deadline:f.deadline||new Date(Date.now()+86400000*30),countryCode:'US',lastVerifiedAt:new Date(),
  }))});
  const awardId=marker+'-award';
  await db.opportunity.create({data:{
    id:awardId,organizationId:org.id,title:'CI synthetic grant award',type:'GRANT',sourceName:'Grants.gov',sourceKey:awardId,sourceRecordId:'synthetic-award',
    sourceUrl:'https://example.test/synthetic-award',countryCode:'US',deadline:new Date(Date.now()+86400000*30),lastVerifiedAt:new Date(),
    provenance:{create:{sourceType:'FUNDER',sourceName:'Grants.gov',sourceRecordId:'synthetic-award',sourceUrl:'https://example.test/synthetic-award',contentFingerprint:marker,status:'VERIFIED',
      metadata:{oppStatus:'posted',awardMin:'0',awardMax:'250000',awardCurrency:'USD',agencyName:'CI Synthetic Agency',fundingRegion:'United States'}}},
  }});
  const response=await fetch(new URL('/api/v1/opportunities?audience=md-phd&page=1&limit=24&funder='+encodeURIComponent(org.name),base));
  assert.equal(response.status,200);
  const body=await response.json();
  assert.equal(body.success,true);
  assert.deepEqual(body.data.results.map((r:{id:string})=>r.id).sort(),[marker+'-explicit',marker+'-f30'].sort(),'only current explicit MD-PhD and NIH F30 records belong in the route');
  assert.equal(body.data.totalMatching,2);
  const narrowed=await fetch(new URL('/api/v1/opportunities?audience=md-phd&q=studentship&country=US&page=1&limit=1&funder='+encodeURIComponent(org.name),base));
  const narrowedBody=await narrowed.json();
  assert.equal(narrowed.status,200);
  assert.deepEqual(narrowedBody.data.results.map((r:{id:string})=>r.id),[marker+'-explicit']);
  const csv=await fetch(new URL('/api/v1/opportunities/export?audience=md-phd&funder='+encodeURIComponent(org.name),base));
  assert.equal(csv.status,200);assert.match(csv.headers.get('content-type')||'',/text\/csv/);
  const text=await csv.text();
  assert.ok(text.includes('Individual dual-degree training (Parent F30)'));
  assert.ok(text.includes('MD-PhD funded studentship'));
  assert.ok(!text.includes('Institutional dual-degree training (T32)'));
  assert.ok(!text.includes('MD-PhD expired studentship'));
  assert.match(text,/"Agency","Region","Award min","Award max"/);
  const grantResponse=await fetch(new URL('/api/v1/opportunities?id='+awardId,base));
  const grant=(await grantResponse.json()).data.results[0].grant;
  assert.equal(grant.status,'Open');assert.equal(grant.awardMin,'0');assert.equal(grant.awardMax,'250000');
  assert.equal(grant.agency,'CI Synthetic Agency');assert.match(grant.regionContext,/confirm applicant eligibility/);
  // This account exists only in local disposable CI PostgreSQL, never on a live site.
  const signup=await fetch(new URL('/api/auth/sign-up/email',base),{method:'POST',headers:{Origin:base.origin,'Content-Type':'application/json'},
    body:JSON.stringify({name:'CI Reminder Researcher',email:marker+'@example.test',password:'CI-only-Strong-'+randomUUID()})});
  assert.ok(signup.ok);const cookie=signup.headers.get('set-cookie')?.split(';')[0];assert.ok(cookie);
  for(const days of [20,15]){
    const save:Response=await fetch(new URL('/api/v1/opportunities/saved',base),{method:'POST',headers:{Origin:base.origin,Cookie:cookie,'Content-Type':'application/json'},
      body:JSON.stringify({opportunityId:awardId,deadlineAlert:true,alertLeadDays:days,notes:'CI_PRIVATE_NOTE_NOT_FOR_EXPORT'})});
    assert.equal(save.status,201);assert.equal((await save.json()).data.alertLeadDays,days);
  }
  const saved=await fetch(new URL('/api/v1/opportunities/saved',base),{headers:{Cookie:cookie}});
  const savedBody=await saved.json();
  assert.equal(savedBody.data.saved.find((item:{opportunityId:string})=>item.opportunityId===awardId).alertLeadDays,15);
  const awardExport=await fetch(new URL('/api/v1/opportunities/export?type=grant&id='+awardId,base),{headers:{Cookie:cookie}});
  assert.equal(awardExport.status,200);const awardCsv=await awardExport.text();
  assert.match(awardCsv,/"0","250000","USD"/);assert.ok(!awardCsv.includes('CI_PRIVATE_NOTE_NOT_FOR_EXPORT'));
  console.log('MD-PhD audience integration: 8 synthetic cases, filtering and pagination passed.');
} finally {
  if(organizationId)await db.organization.delete({where:{id:organizationId}});
  await db.$disconnect();
}
}
void main().catch((error:unknown)=>{console.error(error);process.exitCode=1;});
