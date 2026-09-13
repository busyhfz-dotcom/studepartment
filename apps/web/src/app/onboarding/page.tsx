import Link from "next/link";

const steps = [
  {
    number: "01",
    title: "Scientific role",
    description: "Tell us where you are in your research journey so discovery can respect your career context.",
    options: ["Medical student", "PhD student", "Researcher", "Professor / PI"],
  },
  {
    number: "02",
    title: "Research focus",
    description: "Add the fields, diseases, and methods that best represent your actual work.",
    options: ["Cancer immunotherapy", "Clinical trials", "Bioinformatics", "Medical imaging"],
  },
  {
    number: "03",
    title: "What are you open to?",
    description: "This controls who should be encouraged to approach you and helps reduce irrelevant requests.",
    options: ["Research collaboration", "Mentorship", "Grant partnership", "Position opportunities"],
  },
  {
    number: "04",
    title: "Availability",
    description: "Choose how visible you want to be to new scientific introductions.",
    options: ["Open", "Selective", "Quiet mode", "Not accepting requests"],
  },
];

export default function OnboardingPage() {
  return (
    <main className="shell onboardingShell">
      <header className="onboardingHeader">
        <Link className="backLink" href="/">← Studepartment</Link>
        <span className="eyebrow">Scientific Identity · v0.2</span>
        <h1>Build a useful profile without building another social profile.</h1>
        <p className="lede">
          We only ask for information that improves discovery, matching, trust, or communication quality.
        </p>
      </header>

      <section className="onboardingStack">
        {steps.map((step) => (
          <article className="onboardingStep" key={step.number}>
            <div className="stepNumber">{step.number}</div>
            <div className="stepBody">
              <h2>{step.title}</h2>
              <p>{step.description}</p>
              <div className="optionGrid">
                {step.options.map((option) => (
                  <button className="optionButton" key={option} type="button">
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="orcidPanel">
        <div>
          <span className="eyebrow">Optional import</span>
          <h2>Connect ORCID instead of retyping your scientific history.</h2>
          <p>
            ORCID import will be used to prefill identity and publication signals while preserving source provenance.
          </p>
        </div>
        <button className="primaryButton" type="button">Connect ORCID</button>
      </section>

      <div className="onboardingFooter">
        <p>Your availability and collaboration preferences remain editable at any time.</p>
        <Link className="primaryButton" href="/profile">Preview scientific profile</Link>
      </div>
    </main>
  );
}
