export type ScannerSource = {
  name: string;
  href: string;
  region: string;
  coverage: string;
  description: string;
};

export type ScannerCategory = {
  id: string;
  label: string;
  intro: string;
  sources: ScannerSource[];
};

/**
 * Curated launch points into real, independently-operated position and
 * funding databases. Studepartment does not claim to mirror or scrape these
 * sources' live listings — this is a hand-reviewed directory of where to
 * search directly, organized by region and career stage, complementing
 * Studepartment's own structured Opportunity Intelligence once an
 * organization ingests its postings here.
 */
export const scannerCategories: ScannerCategory[] = [
  {
    id: "europe",
    label: "Europe",
    intro: "EU-wide portals and national boards covering PhD, postdoc, and faculty positions.",
    sources: [
      {
        name: "EURAXESS",
        href: "https://euraxess.ec.europa.eu/jobs",
        region: "European Union",
        coverage: "PhD · Postdoc · Faculty",
        description: "The European Commission's official portal for research careers and mobility across EU member states and associated countries.",
      },
      {
        name: "Academic Positions",
        href: "https://academicpositions.com/",
        region: "Europe (global listings)",
        coverage: "PhD · Postdoc · Faculty",
        description: "One of the largest dedicated academic job boards for European universities and research institutes, with strong Nordic and DACH coverage.",
      },
      {
        name: "jobs.ac.uk",
        href: "https://www.jobs.ac.uk/",
        region: "United Kingdom (+ international)",
        coverage: "PhD · Postdoc · Faculty · Research staff",
        description: "The UK's principal academic and research job board, also listing a meaningful number of international positions.",
      },
      {
        name: "FindAPhD",
        href: "https://www.findaphd.com/",
        region: "UK & international",
        coverage: "PhD",
        description: "The largest dedicated PhD listing service, widely used by UK and European universities to advertise funded and self-funded projects.",
      },
      {
        name: "University Positions",
        href: "https://universitypositions.eu/",
        region: "Europe",
        coverage: "PhD · Postdoc · Faculty",
        description: "A pan-European academic job board with filtering by discipline and country, complementary to EURAXESS.",
      },
    ],
  },
  {
    id: "north-america",
    label: "United States & Canada",
    intro: "The primary boards US and Canadian institutions use to advertise research positions.",
    sources: [
      {
        name: "AcademicJobsOnline",
        href: "https://academicjobsonline.org/",
        region: "United States (+ international)",
        coverage: "Postdoc · Faculty",
        description: "A widely used, free-to-post academic job board, especially strong in physical sciences, mathematics, and engineering.",
      },
      {
        name: "PostdocJobs.com",
        href: "https://main.postdocjobs.com/",
        region: "Global, US-heavy",
        coverage: "Postdoc",
        description: "A dedicated postdoctoral job board run by the National Postdoctoral Association's affiliated network.",
      },
      {
        name: "HigherEdJobs",
        href: "https://www.higheredjobs.com/",
        region: "United States",
        coverage: "Faculty · Research staff · Administration",
        description: "A broad US higher-education employment board covering faculty and research-adjacent roles at colleges and universities.",
      },
      {
        name: "Nature Careers",
        href: "https://www.nature.com/naturecareers",
        region: "Global",
        coverage: "PhD · Postdoc · Faculty · Industry",
        description: "Springer Nature's global science careers board, combining academic and industry research roles with career guidance content.",
      },
      {
        name: "Science Careers (AAAS)",
        href: "https://jobs.sciencecareers.org/",
        region: "Global, US-heavy",
        coverage: "Postdoc · Faculty · Industry",
        description: "The AAAS science jobs board, with email job alerts and career advice from the publisher of Science.",
      },
    ],
  },
  {
    id: "asia",
    label: "Asia-Pacific",
    intro: "National and regional research-career portals, more fragmented than the EU or US.",
    sources: [
      {
        name: "JREC-IN Portal",
        href: "https://jrecin.jst.go.jp/",
        region: "Japan",
        coverage: "Postdoc · Faculty · Research staff",
        description: "Japan's official Research Career Information Network, run by the Japan Science and Technology Agency — the standard portal for research positions in Japan.",
      },
      {
        name: "ResearchGate Jobs",
        href: "https://www.researchgate.net/jobs",
        region: "Global, meaningful Asia-Pacific coverage",
        coverage: "PhD · Postdoc · Faculty · Industry",
        description: "A jobs board layered on top of the ResearchGate network, useful where dedicated national boards are limited or English-language listings are sparse.",
      },
      {
        name: "IndiaBioscience",
        href: "https://indiabioscience.org/grants",
        region: "India",
        coverage: "PhD · Postdoc · Faculty · Grants",
        description: "The community portal for life scientists in India, with a directory of grants for India-based researchers and current job listings.",
      },
      {
        name: "NHMRC Find Funding",
        href: "https://www.nhmrc.gov.au/funding/find-funding",
        region: "Australia",
        coverage: "Fellowships · Project grants",
        description: "Australia's main medical research funder, with Ideas Grants, Investigator Grants and other schemes on a published funding calendar.",
      },
    ],
  },
  {
    id: "grants",
    label: "Grants & funding",
    intro: "Where to search for fellowship and project funding once you already have a research plan.",
    sources: [
      {
        name: "NIH Grants & Funding",
        href: "https://grants.nih.gov/",
        region: "United States",
        coverage: "Fellowships · Project grants",
        description: "The US National Institutes of Health's official funding portal — the primary source for biomedical research funding opportunity announcements.",
      },
      {
        name: "EU Funding & Tenders Portal",
        href: "https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/home",
        region: "European Union",
        coverage: "Horizon Europe grants · ERC · Fellowships",
        description: "The single entry point for Horizon Europe and other EU-funded research grants, including Marie Skłodowska-Curie and ERC calls.",
      },
      {
        name: "UK Research and Innovation (UKRI)",
        href: "https://www.ukri.org/opportunity/",
        region: "United Kingdom",
        coverage: "Fellowships · Project grants",
        description: "The UK's principal public research funder, listing open calls across its research councils including the Medical Research Council.",
      },
      {
        name: "Wellcome Trust Funding",
        href: "https://wellcome.org/grant-funding",
        region: "Global (UK-based funder)",
        coverage: "Fellowships · Project grants",
        description: "One of the largest biomedical research charities globally, funding early-career fellowships and major project grants.",
      },
      {
        name: "MSCA Postdoctoral Fellowships",
        href: "https://marie-sklodowska-curie-actions.ec.europa.eu/",
        region: "Europe (open to all nationalities)",
        coverage: "Postdoctoral fellowships · Doctoral networks",
        description: "The EU's flagship researcher-mobility programme. Postdoctoral Fellowships fund researchers of any nationality who move to a host in Europe.",
      },
      {
        name: "European Research Council (ERC)",
        href: "https://erc.europa.eu/apply-grant",
        region: "Europe",
        coverage: "Starting · Consolidator · Advanced grants",
        description: "Grants for investigator-led frontier research, from Starting Grants for early-career researchers to Advanced Grants for established leaders.",
      },
      {
        name: "EMBO Postdoctoral Fellowships",
        href: "https://www.embo.org/funding/fellowships-grants-and-career-support/postdoctoral-fellowships/",
        region: "Europe & international",
        coverage: "Postdoctoral fellowships",
        description: "Life-science fellowships for postdocs moving to a lab in another country, with EMBO's network and career support.",
      },
      {
        name: "DAAD Scholarship Database",
        href: "https://www.daad.de/en/studying-in-germany/scholarships/",
        region: "Germany",
        coverage: "Doctoral · Research stays · Postdoctoral",
        description: "Germany's academic exchange service, with a searchable database of funding for international doctoral candidates and researchers.",
      },
      {
        name: "HHMI Hanna H. Gray Fellows",
        href: "https://www.hhmi.org/programs/hanna-h-gray-fellows",
        region: "United States",
        coverage: "Postdoc-to-faculty transition",
        description: "Howard Hughes Medical Institute funding that supports early-career scientists through the postdoc-to-faculty transition.",
      },
      {
        name: "CIHR Funding Opportunities",
        href: "https://cihr-irsc.gc.ca/e/52000.html",
        region: "Canada",
        coverage: "Fellowships · Project grants",
        description: "Canada's federal health research funder, with current and upcoming funding opportunities across its institutes.",
      },
      {
        name: "JSPS Fellowships",
        href: "https://www.jsps.go.jp/english/e-fellow/",
        region: "Japan",
        coverage: "Postdoctoral fellowships",
        description: "The Japan Society for the Promotion of Science's fellowship programs, the standard route for international postdocs seeking funded positions in Japan.",
      },
      {
        name: "Grants.gov",
        href: "https://www.grants.gov/",
        region: "United States",
        coverage: "Project grants (all federal agencies)",
        description: "The unified US federal government grants portal, covering NIH, NSF, DoD, and other agency funding opportunities in one search interface.",
      },
    ],
  },
  {
    id: "global-health",
    label: "Global health & emerging research regions",
    intro: "Funding and fellowships aimed at researchers in, or working with, low- and middle-income countries.",
    sources: [
      {
        name: "TWAS fellowships guide",
        href: "https://twas.org/article/guide-fellowships-developing-world-scientists",
        region: "Developing countries",
        coverage: "PhD · Postdoc · Research visits",
        description: "The World Academy of Sciences' guide to fellowships for scientists from developing countries, including its own research and advanced-training fellowships.",
      },
      {
        name: "Fogarty International Center",
        href: "https://www.fic.nih.gov/Funding/Pages/Fogarty-Funding-Opps.aspx",
        region: "Global (NIH)",
        coverage: "Research training · Project grants",
        description: "The NIH centre for global health, funding research and training that links US and low- and middle-income country institutions.",
      },
      {
        name: "Global Health EDCTP3",
        href: "https://www.global-health-edctp3.europa.eu/funding/calls-proposals_en",
        region: "Sub-Saharan Africa & Europe",
        coverage: "Clinical research grants · Fellowships",
        description: "An EU-Africa partnership funding clinical research on infectious diseases in sub-Saharan Africa.",
      },
    ],
  },
  {
    id: "collaborators",
    label: "Find collaborators, experts & funded projects",
    intro: "Public evidence on who is funded, publishing or running trials in your area. Use it alongside Studepartment Discovery.",
    sources: [
      {
        name: "NIH RePORTER Matchmaker",
        href: "https://reporter.nih.gov/matchmaker",
        region: "United States (NIH-funded)",
        coverage: "Similar projects · Program officials",
        description: "Paste an abstract to find similar NIH-funded projects and the program officials who manage them.",
      },
      {
        name: "Expertscape",
        href: "https://www.expertscape.com/",
        region: "Global",
        coverage: "Experts · Institutions",
        description: "Ranks researchers and institutions by their PubMed publication record across tens of thousands of biomedical topics.",
      },
      {
        name: "ClinicalTrials.gov",
        href: "https://clinicaltrials.gov/find-studies",
        region: "Global",
        coverage: "Trial sites · Investigators",
        description: "The largest registry of clinical studies. Search by condition and location to find active trial sites and investigators.",
      },
    ],
  },
];
