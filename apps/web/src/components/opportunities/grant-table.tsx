'use client';
import type {OpportunityResult} from '@/lib/api-contracts';
import {opportunityPath} from '@/lib/opportunity-actions';
import {ListingActions} from './listing-actions';
import {DeadlineReminder} from './deadline-reminder';
import {AwardBasis, Competition, DueDate, formatAward, ListingEligibility} from './listing-facts';
import {OpportunitySignals} from './opportunity-signals';
import { Institution } from './brand-mark';
import styles from './grant-table.module.css';
export function GrantTable({items,params,onReview}:{items:OpportunityResult[];params:string;onReview?:(item:OpportunityResult)=>void}){
  return <section className={styles.section} aria-label="Grant comparison">
    <div className={styles.toolbar}><div><strong>Compare grants</strong><p>Published amounts only. Programme region and applicant eligibility are distinguished below.</p></div>
      <div className={styles.tools}><a className={styles.export} href={'/api/v1/opportunities/export?'+params}>Export CSV</a><DeadlineReminder items={items}/></div>
    </div>
    <p className={styles.note}>CSV includes up to 500 matches with your current filters. Alert lets you choose grants from this page.</p>
    <div className={styles.scroll}><table><caption className={styles.srOnly}>Current grants, published award amounts and source links</caption>
      <thead><tr>{['Close date','Status','Title','Agency','Region','Award min','Award max','Eligibility','Competition','Actions'].map(label=><th scope="col" key={label}>{label}</th>)}</tr></thead>
      <tbody>{items.map(item=><tr key={item.id}>
        <td data-label="Close date"><DueDate item={item}/></td>
        <td data-label="Status"><span className={styles.status}>{item.grant?.status||'Check source'}</span></td>
        <td data-label="Title" className={styles.title}>{onReview?<button data-original-content type="button" onClick={()=>onReview(item)}>{item.title}</button>:<a data-original-content href={opportunityPath(item)}>{item.title}</a>}<small data-original-content>{item.source.recordId}</small></td>
        <td data-label="Agency" className={styles.agency}><Institution name={item.grant?.agency || item.organization} website={item.organizationWebsite} /></td>
        <td data-label="Region">
          <span data-original-content>{item.grant?.region || "Not specified"}</span>
          {item.grant?.regionContext ? <small title={item.grant.regionContext}>
            {item.grant.regionContext === "Published applicant geography" ? "Applicant geography" : "Programme region"}
          </small> : null}
        </td>
        <td data-label="Award min" className={styles.amount}>
          <span className={styles.amountValue}>{formatAward(item.grant?.awardMin,item.grant?.currency)}</span>
          {item.grant?.awardMin && !item.grant.awardMax ? <AwardBasis grant={item.grant} /> : null}
        </td>
        <td data-label="Award max" className={styles.amount}>
          <span className={styles.amountValue}>{formatAward(item.grant?.awardMax,item.grant?.currency)}</span>
          {item.grant?.awardMax || item.grant?.awardNote ? <AwardBasis grant={item.grant} /> : null}
        </td>
        <td data-label="Eligibility"><ListingEligibility item={item}/></td>
        <td data-label="Competition"><Competition item={item}/></td>
        <td data-label="Actions"><div className={styles.rowActions}>
          <ListingActions item={item} primary={onReview
            ? <button type="button" onClick={()=>onReview(item)} aria-label={`Review ${item.title}`}>Review details</button>
            : <a href={opportunityPath(item)}>Review details</a>} />
          <OpportunitySignals item={item}/>
          <a href={item.applicationUrl || item.sourceUrl} target="_blank" rel="noopener noreferrer">Apply now</a>
        </div></td>
      </tr>)}</tbody>
    </table></div>
  </section>;
}
