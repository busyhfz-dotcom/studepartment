export type ConferenceSource = {
  name: string;
  href: string;
  scope: string;
  description: string;
};

export type ConferenceCategory = {
  id: string;
  label: string;
  intro: string;
  sources: ConferenceSource[];
};

/**
 * Curated directory of real conference-ranking, call-for-papers, and
 * continuing-education-credit registries. As with the Scanner directory,
 * Provenant links to these independent databases rather than claiming
 * to reproduce their data.
 */
export const conferenceCategories: ConferenceCategory[] = [
  {
    id: "ranking-discovery",
    label: "Check credibility before you submit",
    intro: "Checks for venues and journals, so a conference abstract or proceedings paper does not end up with a predatory publisher.",
    sources: [
      {
        name: "Think. Check. Submit.",
        href: "https://thinkchecksubmit.org/journals/",
        scope: "Cross-disciplinary",
        description: "A widely used checklist for deciding whether a journal or publisher, including conference proceedings, can be trusted with your work.",
      },
      {
        name: "DOAJ",
        href: "https://doaj.org/",
        scope: "Open-access journals",
        description: "The Directory of Open Access Journals, which lists only journals that meet its quality and transparency criteria.",
      },
      {
        name: "Resurchify Conference Ranking",
        href: "https://www.resurchify.com/conference-ranking",
        scope: "Cross-disciplinary",
        description: "A searchable conference-ranking and impact tool covering many disciplines beyond computer science, including the life sciences.",
      },
    ],
  },
  {
    id: "medical-credit",
    label: "Medical conferences & CME credit",
    intro: "Accreditation bodies and calendars for continuing medical education credit, relevant to clinical researchers.",
    sources: [
      {
        name: "ACCME",
        href: "https://accme.org/",
        scope: "United States",
        description: "The Accreditation Council for Continuing Medical Education — the US body that accredits organizations to award AMA PRA Category 1 Credit.",
      },
      {
        name: "AMA PRA Credit System",
        href: "https://edhub.ama-assn.org/pages/ama-pra-credit-system",
        scope: "United States",
        description: "The American Medical Association's credit system reference — the standard unit US physicians use to document CME participation.",
      },
      {
        name: "EACCME",
        href: "https://eaccme.uems.eu/",
        scope: "Europe",
        description: "The European Accreditation Council for Continuing Medical Education, which accredits European CME activities and enables mutual recognition with AMA PRA Category 1 Credit.",
      },
      {
        name: "MDLinx Conferences",
        href: "https://www.mdlinx.com/conferences",
        scope: "Global, US-heavy",
        description: "A calendar aggregator of medical conferences and meetings, filterable by specialty, useful for planning a year of clinical conference attendance.",
      },
    ],
  },
];
