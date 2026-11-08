import type { Prisma } from '@studepartment/db';
/** An explicit dual-degree title or NIH F30 notice, never generic PhD keywords. */
export function mdPhdAudienceWhere(): Prisma.OpportunityWhereInput {
  return { type:{in:['PHD','PHD_SCHOLARSHIP','FELLOWSHIP']}, OR:[
    ...['MD-PhD','MD/PhD','MD–PhD','MD - PhD','M.D./Ph.D.','M.D.-Ph.D.'].map(text=>({title:{contains:text,mode:'insensitive' as const}})),
    {sourceName:'Grants.gov',organization:{name:{contains:'National Institutes of Health',mode:'insensitive'}},OR:[
      {title:{contains:'(F30',mode:'insensitive'}},{title:{contains:' F30)',mode:'insensitive'}},
    ]},
  ]};
}
