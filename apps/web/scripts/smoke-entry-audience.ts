import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {getDb, type Prisma} from '@studepartment/db';

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
  console.log('MD-PhD audience integration: 8 synthetic cases, filtering and pagination passed.');
} finally {
  if(organizationId)await db.organization.delete({where:{id:organizationId}});
  await db.$disconnect();
}
