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
      {
        name: "eMedEvents",
        href: "https://www.emedevents.com/",
        scope: "Global",
        description: "The largest marketplace of CME/CE conferences and courses, filterable by specialty, country and credit type.",
      },
      {
        name: "CMEList",
        href: "https://www.cmelist.com/",
        scope: "Global, US-heavy",
        description: "A calendar of in-person CME conferences, organized by destination and specialty.",
      },
      {
        name: "Medical Education Resources (MER)",
        href: "https://www.mer.org/",
        scope: "Global",
        description: "Accredited CME conferences held at travel destinations.",
      },
      {
        name: "Singapore Medical Council",
        href: "https://www.healthprofessionals.gov.sg/smc",
        scope: "Singapore",
        description: "Singapore's medical regulator, which runs the national CME point system for doctors.",
      },
    ],
  },
  {
    id: "major-congresses",
    label: "Major medical congresses",
    intro: "The societies behind the largest specialty meetings. Each meeting page lists dates, abstract deadlines and the credit it carries.",
    sources: [
      {
        name: "ASCO",
        href: "https://www.asco.org/",
        scope: "Oncology · United States",
        description: "The American Society of Clinical Oncology. Its Annual Meeting is the largest clinical oncology congress, with CME credit.",
      },
      {
        name: "AACR",
        href: "https://www.aacr.org/",
        scope: "Cancer research · United States",
        description: "The American Association for Cancer Research, host of the AACR Annual Meeting on basic and translational cancer science.",
      },
      {
        name: "ESMO",
        href: "https://www.esmo.org/",
        scope: "Oncology · Europe",
        description: "The European Society for Medical Oncology. The ESMO Congress carries EACCME credit.",
      },
      {
        name: "ASH",
        href: "https://www.hematology.org/",
        scope: "Hematology · United States",
        description: "The American Society of Hematology and its Annual Meeting, the main hematology congress worldwide.",
      },
      {
        name: "EHA",
        href: "https://ehaweb.org/",
        scope: "Hematology · Europe",
        description: "The European Hematology Association and its annual congress.",
      },
      {
        name: "ESC",
        href: "https://www.escardio.org/",
        scope: "Cardiology · Europe",
        description: "The European Society of Cardiology. ESC Congress is the largest cardiology meeting in the world.",
      },
      {
        name: "American Heart Association",
        href: "https://professional.heart.org/",
        scope: "Cardiology · United States",
        description: "AHA Scientific Sessions and other cardiovascular meetings with CME credit.",
      },
      {
        name: "American Diabetes Association",
        href: "https://professional.diabetes.org/",
        scope: "Diabetes · United States",
        description: "The ADA Scientific Sessions, the main US diabetes research and clinical meeting.",
      },
      {
        name: "EASD",
        href: "https://www.easd.org/",
        scope: "Diabetes · Europe",
        description: "The European Association for the Study of Diabetes and its annual meeting.",
      },
      {
        name: "American Academy of Neurology",
        href: "https://www.aan.com/",
        scope: "Neurology · United States",
        description: "The AAN Annual Meeting, with AMA PRA Category 1 credit.",
      },
      {
        name: "EAN",
        href: "https://www.ean.org/",
        scope: "Neurology · Europe",
        description: "The European Academy of Neurology and its annual congress.",
      },
      {
        name: "IDWeek",
        href: "https://idweek.org/",
        scope: "Infectious diseases · United States",
        description: "The joint annual meeting of the major US infectious-disease societies.",
      },
      {
        name: "ESCMID",
        href: "https://www.escmid.org/",
        scope: "Infectious diseases · Europe",
        description: "The European Society of Clinical Microbiology and Infectious Diseases and its ESCMID Global congress.",
      },
      {
        name: "EULAR",
        href: "https://www.eular.org/",
        scope: "Rheumatology · Europe",
        description: "The European Alliance of Associations for Rheumatology and its annual congress.",
      },
      {
        name: "American Psychiatric Association",
        href: "https://www.psychiatry.org/",
        scope: "Psychiatry · United States",
        description: "The APA Annual Meeting, the largest psychiatry meeting, with CME credit.",
      },
    ],
  },
];
