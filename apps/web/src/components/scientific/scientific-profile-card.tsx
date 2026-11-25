import type { ScientificIdentity } from "@/features/scientific-identity/types";
import { IdentityAvatar } from "@/components/identity/identity-avatar";

export function ScientificProfileCard({ identity, nameHeading: NameHeading = "h1" }: { identity: ScientificIdentity; nameHeading?: "h1" | "h2" }) {
  const verifiedCount = identity.verification.filter((item) => item.verified).length;

  return (
    <article className="profileCard">
      <div className="profileTopline">
        <div className="profileIdentity">
          <IdentityAvatar name={identity.fullName} src={identity.imageUrl} />
          <div>
            <span className="eyebrow">Scientific identity</span>
            <NameHeading className="profileName" data-original-content>{identity.fullName}</NameHeading>
            <p className="profileHeadline" data-original-content>{identity.headline}</p>
            <p className="profileMeta" data-original-content>
              {identity.institution}{identity.location ? ` · ${identity.location}` : ""}
            </p>
          </div>
        </div>
        <div className="trustPanel" aria-label="Verification status">
          <strong>{verifiedCount}/{identity.verification.length}</strong>
          <span>verified signals</span>
        </div>
      </div>

      <div className="profileSection">
        <span className="sectionLabel">Research summary</span>
        <p className="summaryText" data-original-content>{identity.summary}</p>
      </div>

      <div className="profileSplit">
        <div>
          <span className="sectionLabel">Research focus</span>
          <div className="chipRow">
            {identity.researchInterests.map((interest) => (
              <span className="chip" key={interest.name}>{interest.name}</span>
            ))}
          </div>
        </div>
        <div>
          <span className="sectionLabel">Open to</span>
          <ul className="cleanList">
            {identity.openTo.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </div>

      <div className="verificationGrid">
        {identity.verification.map((item) => (
          <div className="verificationItem" key={item.label}>
            <span aria-hidden="true">{item.verified ? "✓" : "·"}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </article>
  );
}
