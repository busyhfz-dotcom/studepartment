import type { Prisma } from '@studepartment/db';
/** An explicit dual-degree title, an NIH F30 notice or a listed dual-degree programme, never generic PhD keywords. */
export function mdPhdAudienceWhere(): Prisma.OpportunityWhereInput {
  return { type:{in:['PHD','PHD_SCHOLARSHIP','FELLOWSHIP']}, OR:[
    ...['MD-PhD','MD/PhD','MD–PhD','MD - PhD','M.D./Ph.D.','M.D.-Ph.D.'].map(text=>({title:{contains:text,mode:'insensitive' as const}})),
    // Dual-degree and physician-scientist programmes from the official programme registry.
    {sourceName:'Official programme pages',sourceRecordId:{startsWith:'mdphd-'}},
    {sourceName:'Grants.gov',organization:{name:{contains:'National Institutes of Health',mode:'insensitive'}},OR:[
      {title:{contains:'(F30',mode:'insensitive'}},{title:{contains:' F30)',mode:'insensitive'}},
    ]},
  ]};
}
