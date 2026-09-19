import type { ScientificIdentity } from "@/features/scientific-identity/types";

export function ScientificProfileCard({ identity }: { identity: ScientificIdentity }) {
  const verifiedCount = identity.verification.filter((item) => item.verified).length;

  return (
    <article className="profileCard">
      <div className="profileTopline">
        <div>
          <span className="eyebrow">Scientific identity</span>
          <h1 className="profileName">{identity.fullName}</h1>
          <p className="profileHeadline">{identity.headline}</p>
          <p className="profileMeta">
            {identity.institution}{identity.location ? ` · ${identity.location}` : ""}
          </p>
        </div>
        <div className="trustPanel" aria-label="Verification status">
          <strong>{verifiedCount}/{identity.verification.length}</strong>
          <span>verified signals</span>
        </div>
      </div>

      <div className="profileSection">
        <span className="sectionLabel">Research summary</span>
        <p className="summaryText">{identity.summary}</p>
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
