import type {OpportunityResult} from '@/lib/api-contracts';
import snapshot from './sources/eu-award-snapshot.json';
import type { EuAward } from './sources/eu-awards';
import { verifiedGrantAmounts } from './verified-grant-amounts';

type Input={sourceName:string;organization:string;description?:string|null;eligibleCountryCodes:string[];metadata:unknown;sourceRecordId?:string;sourceUrl?:string};
const euSnapshot = snapshot as Record<string, EuAward>;
export function publishedAmount(value:unknown):string|undefined{
  if(typeof value!=='number'&&typeof value!=='string')return undefined;
  const text=String(value).trim();
  if(!/^(?:\d+|\d{1,3}(?:,\d{3})+)(\.\d{1,2})?$/.test(text))return undefined;
  const numeric = text.replaceAll(",", "");
  if(Number(numeric)<=0||Number(numeric)>1e15)return undefined;
  return numeric;
}
export function grantDetails(input:Input):NonNullable<OpportunityResult['grant']>{
  const data=input.metadata&&typeof input.metadata==='object'&&!Array.isArray(input.metadata)?input.metadata as Record<string,unknown>:{};
  const status=String(data.status||data.oppStatus||'').toLowerCase();
  const euro=input.sourceName==='EU Funding & Tenders Portal';
  const us=input.sourceName==='Grants.gov';
  const published = euro && input.sourceRecordId ? euSnapshot[input.sourceRecordId.toUpperCase()] : undefined;
  const verified = verifiedGrantAmounts(input.sourceUrl);
  const publishedRegion=typeof data.eligibilityRegion==='string'?data.eligibilityRegion.trim().slice(0,200):'';
  const programme=typeof data.fundingRegion==='string'?data.fundingRegion.slice(0,120):euro?'Europe':us?'United States':'Not specified';
  const countries=input.eligibleCountryCodes.join(', ');
  // Legacy descriptions may contain a published ceiling; never infer a floor or
  // substitute programme-wide budgets for an individual award.
  const legacy=us?input.description?.match(/Award ceiling: US\$([\d,]+)(?:\.\s|\.$)/)?.[1].replaceAll(',',''):undefined;
  const floor=publishedAmount(data.awardMin) || publishedAmount(published?.awardMin) || publishedAmount(verified?.awardMin);
  const ceiling=publishedAmount(data.awardMax) || publishedAmount(legacy) || publishedAmount(published?.awardMax) || publishedAmount(verified?.awardMax);
  const officialSource = data.awardSource || published?.awardSource || input.sourceUrl;
  const note = data.awardNote || published?.awardNote || verified?.awardNote;
  return {
    status:status==='forthcoming'||status==='forecasted'?'Upcoming':['open','posted'].includes(status)?'Open':'Check source',
    agency:typeof data.agencyName==='string'?data.agencyName.slice(0,300):input.organization,
    region:publishedRegion||countries||programme,
    regionContext:publishedRegion||countries?'Published applicant geography':'Funding programme region; confirm applicant eligibility at source',
    awardMin:floor && ceiling && Number(floor)>Number(ceiling) ? undefined : floor,
    awardMax:ceiling,
    currency:typeof data.awardCurrency==='string'&&/^[A-Z]{3}$/.test(data.awardCurrency)?data.awardCurrency:published?.awardCurrency??verified?.awardCurrency??(us?'USD':undefined),
    awardBasis:data.awardBasis === 'indicative' ? 'indicative' : published?.awardBasis,
    awardSource:typeof officialSource === 'string' && officialSource.startsWith('https://') ? officialSource : undefined,
    awardNote:typeof note === 'string' ? note : undefined,
  };
}
