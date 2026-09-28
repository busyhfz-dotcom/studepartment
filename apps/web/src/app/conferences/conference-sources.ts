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
 * Studepartment links to these independent databases rather than claiming
 * to reproduce their data.
 */
export const conferenceCategories: ConferenceCategory[] = [
  {
    id: "ranking-discovery",
    label: "Conference ranking & discovery",
    intro: "Where to check whether a conference is credible before submitting or attending.",
    sources: [
      {
        name: "CORE Rankings Portal",
        href: "https://portal.core.edu.au/conf-ranks/",
        scope: "Computing & informatics",
        description: "The Computing Research and Education Association of Australasia's widely cited A*/A/B/C conference ranking, the de facto standard in computer science.",
      },
      {
        name: "WikiCFP",
        href: "http://www.wikicfp.com/cfp/",
        scope: "Cross-disciplinary",
        description: "A long-running, community-maintained call-for-papers aggregator spanning computer science, engineering, and adjacent fields.",
      },
      {
        name: "Resurchify Conference Ranking",
        href: "https://www.resurchify.com/conference-ranking",
        scope: "Cross-disciplinary",
        description: "A searchable conference-ranking and impact tool covering a broader set of disciplines than CORE, including engineering and life sciences.",
      },
      {
        name: "DBLP",
        href: "https://dblp.org/",
        scope: "Computer science",
        description: "The canonical bibliographic database for computer science venues — useful for checking a conference's publication history and proceedings record.",
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
