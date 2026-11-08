import type {OpportunityResult} from '@/lib/api-contracts';
type Input={sourceName:string;organization:string;description?:string|null;eligibleCountryCodes:string[];metadata:unknown};
export function publishedAmount(value:unknown):string|undefined{
  if(typeof value!=='number'&&typeof value!=='string')return undefined;
  const text=String(value).trim();if(!/^\d+(\.\d{1,2})?$/.test(text)||Number(text)>1e15)return undefined;
  return text;
}
export function grantDetails(input:Input):NonNullable<OpportunityResult['grant']>{
  const data=input.metadata&&typeof input.metadata==='object'&&!Array.isArray(input.metadata)?input.metadata as Record<string,unknown>:{};
  const status=String(data.status||data.oppStatus||'').toLowerCase();
  const euro=input.sourceName==='EU Funding & Tenders Portal';
  const us=input.sourceName==='Grants.gov';
  const publishedRegion=typeof data.eligibilityRegion==='string'?data.eligibilityRegion.trim().slice(0,200):'';
  const programme=typeof data.fundingRegion==='string'?data.fundingRegion.slice(0,120):euro?'Europe':us?'United States':'Not specified';
  const countries=input.eligibleCountryCodes.join(', ');
  // Legacy descriptions may contain a published ceiling; never infer a floor or
  // substitute programme-wide budgets for an individual award.
  const legacy=us?input.description?.match(/Award ceiling: US\$([\d,]+)(?:\.\s|\.$)/)?.[1].replaceAll(',',''):undefined;
  const ceiling=publishedAmount(data.awardMax)||publishedAmount(legacy);
  return {
    status:status==='forthcoming'||status==='forecasted'?'Upcoming':['open','posted'].includes(status)?'Open':'Check source',
    agency:typeof data.agencyName==='string'?data.agencyName.slice(0,300):input.organization,
    region:publishedRegion||countries||programme,
    regionContext:publishedRegion||countries?'Published applicant geography':'Funding programme region; confirm applicant eligibility at source',
    awardMin:publishedAmount(data.awardMin),
    awardMax:ceiling&&Number(ceiling)>0?ceiling:undefined,
    currency:typeof data.awardCurrency==='string'&&/^[A-Z]{3}$/.test(data.awardCurrency)?data.awardCurrency:us?'USD':undefined,
  };
}
