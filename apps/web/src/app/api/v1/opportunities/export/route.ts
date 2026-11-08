import {NextResponse,type NextRequest} from 'next/server';
import {discoverOpportunities} from '@/server/opportunities/intelligence';
import {parseOpportunityQuery} from '@/server/opportunities/query';
import {opportunityCsv} from '@/lib/opportunity-actions';
import {getSiteUrl} from '@/lib/site';
import {consumeClientRateLimit,RateLimitExceededError,rateLimitErrorResponse} from '@/server/security/rate-limit';
export async function GET(request:NextRequest){
  try{
    await consumeClientRateLimit(request,'opportunities:export',{windowSeconds:60,max:3});
    const query=parseOpportunityQuery(request.nextUrl.searchParams);
    const data=await discoverOpportunities({...query,page:1,limit:500});
    return new Response(opportunityCsv(data.results,getSiteUrl()),{headers:{
      'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="provenant-opportunities.csv"',
      'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','X-Export-Limit':'500',
      'X-Export-Truncated':String(data.totalMatching>500),
    }});
  }catch(error){if(error instanceof RateLimitExceededError)return rateLimitErrorResponse(error);
    console.error('Opportunity export failed',error instanceof Error?error.name:'Unknown');
    return NextResponse.json({success:false,error:{code:'EXPORT_FAILED',message:'The export could not be prepared. Try again.'}},{status:503});
  }
}
