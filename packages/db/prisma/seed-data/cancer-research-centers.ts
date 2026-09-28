// Cancer research centers linked to QS World University Rankings 2026 (Top ~200).
// Source: user-provided reference document "Cancer Research Centers — QS Top 200 (Phases 1-4)",
// compiled Sep 2026. Phase 4 (QS #101-200) is partial for Asia-Pacific per the source document.
// Each entry becomes an Organization (the university) + a Laboratory (the named cancer center),
// following the existing Organization/Laboratory model used across the app's institutions feature.

export type CancerResearchCenterEntry = {
  university: string;
  countryCode: string;
  universityWebsite: string;
  center: string;
  centerWebsite: string;
  director?: string;
  qsRank?: string;
  phase: 1 | 2 | 3 | 4;
};

export const cancerResearchCenters: CancerResearchCenterEntry[] = [
  // Phase 1 — initial spot-check across QS 1-50
  { university: "Harvard University", countryCode: "US", universityWebsite: "https://www.harvard.edu", center: "Dana-Farber/Harvard Cancer Center (DF/HCC)", centerWebsite: "https://dfhcc.harvard.edu", director: "Consortium of affiliated centers (no single director)", qsRank: "~5", phase: 1 },
  { university: "Stanford University", countryCode: "US", universityWebsite: "https://www.stanford.edu", center: "Stanford Cancer Institute", centerWebsite: "https://med.stanford.edu/cancer.html", director: "Steven Artandi, MD, PhD", qsRank: "~6", phase: 1 },
  { university: "Johns Hopkins University", countryCode: "US", universityWebsite: "https://www.jhu.edu", center: "Sidney Kimmel Comprehensive Cancer Center", centerWebsite: "https://www.hopkinsmedicine.org/kimmel-cancer-center", director: "William G. Nelson, MD, PhD", qsRank: "~25", phase: 1 },
  { university: "University of Toronto", countryCode: "CA", universityWebsite: "https://www.utoronto.ca", center: "Princess Margaret Cancer Centre (University Health Network)", centerWebsite: "https://www.uhn.ca/PrincessMargaret", director: "See UHN leadership page", qsRank: "~25-30", phase: 1 },
  { university: "University of Oxford", countryCode: "GB", universityWebsite: "https://www.ox.ac.uk", center: "Oxford Cancer / CRUK Oxford Centre", centerWebsite: "https://www.cancer.ox.ac.uk", director: "See centre leadership page", qsRank: "~3", phase: 1 },
  { university: "University College London", countryCode: "GB", universityWebsite: "https://www.ucl.ac.uk", center: "UCL Cancer Institute", centerWebsite: "https://www.ucl.ac.uk/cancer", director: "See institute leadership page", qsRank: "~8-9", phase: 1 },
  { university: "National University of Singapore", countryCode: "SG", universityWebsite: "https://www.nus.edu.sg", center: "Cancer Science Institute of Singapore (CSI Singapore)", centerWebsite: "https://csi.nus.edu.sg", director: "Prof. Ashok Venkitaraman", qsRank: "~8-15", phase: 1 },
  { university: "National University of Singapore", countryCode: "SG", universityWebsite: "https://www.nus.edu.sg", center: "National University Cancer Institute, Singapore (NCIS)", centerWebsite: "https://www.ncis.com.sg", director: "See centre contact page", qsRank: "~8-15", phase: 1 },
  { university: "University of Tokyo", countryCode: "JP", universityWebsite: "https://www.u-tokyo.ac.jp", center: "Japanese Foundation for Cancer Research (JFCR) — independent, university-linked", centerWebsite: "https://www.jfcr.or.jp/english", director: "See foundation site", qsRank: "~28-32", phase: 1 },

  // Phase 2 — QS 1-50 (North America)
  { university: "Massachusetts Institute of Technology", countryCode: "US", universityWebsite: "https://www.mit.edu", center: "Koch Institute for Integrative Cancer Research", centerWebsite: "https://ki.mit.edu", director: "Matthew Vander Heiden", qsRank: "#1", phase: 2 },
  { university: "University of Pennsylvania", countryCode: "US", universityWebsite: "https://www.upenn.edu", center: "Abramson Cancer Center", centerWebsite: "https://www.med.upenn.edu/acc-cancer-research", director: "Robert H. Vonderheide, MD, DPhil", qsRank: "#15", phase: 2 },
  { university: "Cornell University", countryCode: "US", universityWebsite: "https://www.cornell.edu", center: "Sandra and Edward Meyer Cancer Center (Weill Cornell Medicine)", centerWebsite: "https://meyercancer.weill.cornell.edu", director: "Jedd D. Wolchok, MD, PhD", qsRank: "#16", phase: 2 },
  { university: "University of Chicago", countryCode: "US", universityWebsite: "https://www.uchicago.edu", center: "UChicago Medicine Comprehensive Cancer Center", centerWebsite: "https://www.uchicagomedicine.org/cancer", director: "Adekunle Odunsi, MD", qsRank: "#13", phase: 2 },
  { university: "Yale University", countryCode: "US", universityWebsite: "https://www.yale.edu", center: "Yale Cancer Center", centerWebsite: "https://www.yalecancercenter.org", director: "Eric Winer, MD", qsRank: "#21", phase: 2 },
  { university: "Columbia University", countryCode: "US", universityWebsite: "https://www.columbia.edu", center: "Herbert Irving Comprehensive Cancer Center (HICCC)", centerWebsite: "https://www.cancer.columbia.edu", director: "Stephen G. Emerson, MD (appointed)", qsRank: "#38", phase: 2 },
  { university: "University of Michigan", countryCode: "US", universityWebsite: "https://www.umich.edu", center: "Rogel Cancer Center", centerWebsite: "https://www.rogelcancercenter.org", director: "See centre leadership page", qsRank: "#45", phase: 2 },
  { university: "University of California, Los Angeles", countryCode: "US", universityWebsite: "https://www.ucla.edu", center: "Jonsson Comprehensive Cancer Center", centerWebsite: "https://cancer.ucla.edu", director: "Michael Teitell, MD, PhD", qsRank: "#46", phase: 2 },
  { university: "McGill University", countryCode: "CA", universityWebsite: "https://www.mcgill.ca", center: "Rosalind & Morris Goodman Cancer Institute", centerWebsite: "https://www.goodmancancer.ca", director: "Prof. John Stagg", qsRank: "#27", phase: 2 },

  // Phase 2 — Europe
  { university: "University of Cambridge", countryCode: "GB", universityWebsite: "https://www.cam.ac.uk", center: "Cancer Research UK Cambridge Institute", centerWebsite: "https://www.cruk.cam.ac.uk", director: "Prof. Jason Carroll (former director)", qsRank: "#6", phase: 2 },
  { university: "Imperial College London", countryCode: "GB", universityWebsite: "https://www.imperial.ac.uk", center: "Cancer Research UK Imperial Centre", centerWebsite: "https://www.imperial.ac.uk/cancer-research-uk-imperial-centre", director: "See centre contact page", qsRank: "#2", phase: 2 },
  { university: "King's College London", countryCode: "GB", universityWebsite: "https://www.kcl.ac.uk", center: "King's Health Partners Comprehensive Cancer Centre", centerWebsite: "https://www.kingshealthpartners.org/institutes/cancer", director: "See institute leadership page", qsRank: "#31", phase: 2 },
  { university: "University of Manchester", countryCode: "GB", universityWebsite: "https://www.manchester.ac.uk", center: "Cancer Research UK Manchester Institute", centerWebsite: "https://www.cruk.manchester.ac.uk", director: "Prof. Samra Turajlić (newly appointed)", qsRank: "#35", phase: 2 },
  { university: "University of Edinburgh", countryCode: "GB", universityWebsite: "https://www.ed.ac.uk", center: "Cancer Research UK Scotland Centre", centerWebsite: "https://www.crukscotlandcentre.ac.uk", director: "See centre leadership page", qsRank: "#34", phase: 2 },

  // Phase 2 — Asia/Oceania
  { university: "University of Melbourne", countryCode: "AU", universityWebsite: "https://www.unimelb.edu.au", center: "Peter MacCallum Cancer Centre / Sir Peter MacCallum Department of Oncology", centerWebsite: "https://www.petermac.org", director: "See centre leadership page", qsRank: "#19", phase: 2 },
  { university: "Seoul National University", countryCode: "KR", universityWebsite: "https://en.snu.ac.kr", center: "SNU Cancer Research Institute (SNU CRI)", centerWebsite: "https://cri.snu.ac.kr/en", director: "Prof. Seock-Ah Im (director since 2019)", qsRank: "#38", phase: 2 },
  { university: "Peking University", countryCode: "CN", universityWebsite: "https://english.pku.edu.cn", center: "Peking University Cancer Hospital & Institute", centerWebsite: "https://english.pku.edu.cn", director: "See hospital site (independent legal entity affiliated with the university)", qsRank: "#14", phase: 2 },
  { university: "Fudan University", countryCode: "CN", universityWebsite: "https://www.fudan.edu.cn", center: "Fudan University Shanghai Cancer Center (FUSCC)", centerWebsite: "https://www.shca.org.cn/english", director: "See centre leadership page", qsRank: "#30", phase: 2 },
  { university: "University of Hong Kong", countryCode: "HK", universityWebsite: "https://www.hku.hk", center: "Centre of Cancer Medicine / Centre for Oncology & Immunology (HKUMed)", centerWebsite: "https://www.med.hku.hk", director: "See centre leadership page", qsRank: "#11", phase: 2 },

  // Phase 3 — QS 51-100 (North America)
  { university: "Duke University", countryCode: "US", universityWebsite: "https://www.duke.edu", center: "Duke Cancer Institute (DCI)", centerWebsite: "https://www.dukecancerinstitute.org", director: "Michael B. Kastan, MD, PhD (transitioning)", qsRank: "#62", phase: 3 },
  { university: "University of California, San Diego", countryCode: "US", universityWebsite: "https://www.ucsd.edu", center: "Moores Cancer Center", centerWebsite: "https://moorescancercenter.ucsd.edu", director: "Diane M. Simeone, MD (director since 2024)", qsRank: "#66", phase: 3 },
  { university: "University of Washington", countryCode: "US", universityWebsite: "https://www.washington.edu", center: "Fred Hutch / UW / Seattle Children's Cancer Consortium", centerWebsite: "https://www.fredhutch.org", director: "Thomas J. Lynch Jr., MD (President & Director, Fred Hutch)", qsRank: "#81", phase: 3 },
  { university: "University of Texas at Austin", countryCode: "US", universityWebsite: "https://www.utexas.edu", center: "LIVESTRONG Cancer Institutes (Dell Medical School)", centerWebsite: "https://dellmed.utexas.edu/units/livestrong-cancer-institutes", director: "See institute leadership page", qsRank: "#68", phase: 3 },
  { university: "Brown University", countryCode: "US", universityWebsite: "https://www.brown.edu", center: "Legorreta Cancer Center", centerWebsite: "https://legorreta.brown.edu", director: "See centre leadership page", qsRank: "#69", phase: 3 },
  { university: "University of Illinois Urbana-Champaign", countryCode: "US", universityWebsite: "https://www.illinois.edu", center: "Cancer Center at Illinois (CCIL)", centerWebsite: "https://cancer.illinois.edu", director: "Rohit Bhargava", qsRank: "#70", phase: 3 },
  { university: "Boston University", countryCode: "US", universityWebsite: "https://www.bu.edu", center: "BU-BMC Cancer Center", centerWebsite: "https://www.bumc.bu.edu/cancercenter", director: "See centre leadership page", qsRank: "#88", phase: 3 },
  { university: "Purdue University", countryCode: "US", universityWebsite: "https://www.purdue.edu", center: "Purdue Institute for Cancer Research", centerWebsite: "https://cancer.research.purdue.edu", director: "Andrea Kasinski (associate director)", qsRank: "#88", phase: 3 },
  { university: "Pennsylvania State University", countryCode: "US", universityWebsite: "https://www.psu.edu", center: "Penn State Cancer Institute", centerWebsite: "https://cancer.psu.edu", director: "See institute leadership page", qsRank: "#82", phase: 3 },
  { university: "University of Alberta", countryCode: "CA", universityWebsite: "https://www.ualberta.ca", center: "Cross Cancer Institute", centerWebsite: "https://www.albertahealthservices.ca", director: "See institute contact page", qsRank: "#94", phase: 3 },

  // Phase 3 — Europe
  { university: "University of Amsterdam", countryCode: "NL", universityWebsite: "https://www.uva.nl", center: "Cancer Center Amsterdam (Amsterdam UMC)", centerWebsite: "https://www.amsterdamumc.org/en/research/institutes/cancer-center-amsterdam", director: "See centre leadership page", qsRank: "#53", phase: 3 },
  { university: "KU Leuven", countryCode: "BE", universityWebsite: "https://www.kuleuven.be", center: "Leuven Cancer Institute (LKI)", centerWebsite: "https://www.kuleuven.be/kankerinstituut", director: "See institute leadership page", qsRank: "#60", phase: 3 },
  { university: "Université Paris-Saclay", countryCode: "FR", universityWebsite: "https://www.universite-paris-saclay.fr", center: "Gustave Roussy (Paris-Saclay Cancer Cluster)", centerWebsite: "https://www.gustaveroussy.fr", director: "Prof. Fabrice Barlesi (Director General)", qsRank: "#70", phase: 3 },
  { university: "Heidelberg University", countryCode: "DE", universityWebsite: "https://www.uni-heidelberg.de", center: "German Cancer Research Center (DKFZ)", centerWebsite: "https://www.dkfz.de/en", director: "See centre executive board page", qsRank: "#80", phase: 3 },
  { university: "University of Glasgow", countryCode: "GB", universityWebsite: "https://www.gla.ac.uk", center: "Cancer Research UK Beatson Institute / CRUK Scotland Institute", centerWebsite: "https://www.crukscotlandinstitute.ac.uk", director: "See institute leadership page", qsRank: "#79", phase: 3 },
  { university: "Lund University", countryCode: "SE", universityWebsite: "https://www.lu.se", center: "Lund University Cancer Centre (LUCC)", centerWebsite: "https://www.lucc.lu.se", director: "See centre leadership page (partnered with Institut Curie)", qsRank: "#72", phase: 3 },
  { university: "Trinity College Dublin", countryCode: "IE", universityWebsite: "https://www.tcd.ie", center: "Trinity St James's Cancer Institute (TSJCI)", centerWebsite: "https://www.tcd.ie/pharmacy/research/research-institutes/tsjci", director: "Co-Directors — see institute leadership page", qsRank: "#75", phase: 3 },
  { university: "University of Birmingham", countryCode: "GB", universityWebsite: "https://www.birmingham.ac.uk", center: "Cancer Research UK Birmingham Centre", centerWebsite: "https://www.uhb.nhs.uk/services/cancer/birmingham-cancer-research-uk-centre", director: "See centre leadership page", qsRank: "#76", phase: 3 },
  { university: "University of Zurich", countryCode: "CH", universityWebsite: "https://www.uzh.ch", center: "Comprehensive Cancer Center Zurich (CCCZ)", centerWebsite: "https://www.usz.ch/en/department/comprehensive-cancer-center-zuerich", director: "See centre leadership page", qsRank: "#100", phase: 3 },

  // Phase 3 — Asia/Oceania
  { university: "Kyoto University", countryCode: "JP", universityWebsite: "https://www.kyoto-u.ac.jp/en", center: "Kyoto University Hospital Cancer Center", centerWebsite: "https://cancer.kuhp.kyoto-u.ac.jp/en", director: "See hospital site", qsRank: "#57", phase: 3 },
  { university: "National Taiwan University", countryCode: "TW", universityWebsite: "https://www.ntu.edu.tw/english", center: "NTU Hospital Cancer Center (NTUCC)", centerWebsite: "https://ntucc.gov.tw", director: "See hospital site", qsRank: "#63", phase: 3 },
  { university: "University of Auckland", countryCode: "NZ", universityWebsite: "https://www.auckland.ac.nz", center: "Auckland Cancer Society Research Centre (ACSRC)", centerWebsite: "https://www.auckland.ac.nz/en/abi/our-research/research-groups/acsrc.html", director: "See centre contact page", qsRank: "#65", phase: 3 },

  // Phase 4 — QS 101-200 (North America)
  { university: "University of Wisconsin–Madison", countryCode: "US", universityWebsite: "https://www.wisc.edu", center: "UW Carbone Cancer Center", centerWebsite: "https://cancer.wisc.edu", director: "Howard Bailey, MD (Director)", qsRank: "#110", phase: 4 },
  { university: "University of California, Davis", countryCode: "US", universityWebsite: "https://www.ucdavis.edu", center: "UC Davis Comprehensive Cancer Center", centerWebsite: "https://health.ucdavis.edu/cancer", director: "Primo \"Lucky\" N. Lara Jr., MD (Director)", qsRank: "#114", phase: 4 },
  { university: "University of North Carolina at Chapel Hill", countryCode: "US", universityWebsite: "https://www.unc.edu", center: "UNC Lineberger Comprehensive Cancer Center", centerWebsite: "https://unclineberger.org", director: "Robert L. Ferris, MD, PhD (Executive Director, since 2024)", qsRank: "#140", phase: 4 },
  { university: "University of Southern California", countryCode: "US", universityWebsite: "https://www.usc.edu", center: "USC Norris Comprehensive Cancer Center", centerWebsite: "https://uscnorriscancer.usc.edu", director: "Caryn Lerman, PhD (Director)", qsRank: "#146", phase: 4 },
  { university: "Washington University in St. Louis", countryCode: "US", universityWebsite: "https://www.wustl.edu", center: "Alvin J. Siteman Cancer Center", centerWebsite: "https://siteman.wustl.edu", director: "Timothy J. Eberlein, MD, FACS (Director)", qsRank: "#167", phase: 4 },
  { university: "Emory University", countryCode: "US", universityWebsite: "https://www.emory.edu", center: "Winship Cancer Institute", centerWebsite: "https://winshipcancer.emory.edu", director: "Suresh S. Ramalingam, MD (Executive Director)", qsRank: "#182", phase: 4 },

  // Phase 4 — Europe
  { university: "University of Copenhagen", countryCode: "DK", universityWebsite: "https://www.ku.dk/english", center: "Danish Cancer Institute (DCI)", centerWebsite: "https://www.cancer.dk/danish-cancer-institute", director: "See institute leadership page", qsRank: "#101", phase: 4 },
  { university: "Utrecht University", countryCode: "NL", universityWebsite: "https://www.uu.nl/en", center: "Oncode Institute / UMC Utrecht Cancer Center", centerWebsite: "https://oncode.nl", director: "See institute leadership page", qsRank: "#103", phase: 4 },
  { university: "University of Groningen", countryCode: "NL", universityWebsite: "https://www.rug.nl/?lang=en", center: "UMCG Cancer Research Center Groningen", centerWebsite: "https://www.umcg.nl", director: "See centre leadership page", qsRank: "#147", phase: 4 },
  { university: "University of Vienna / MedUni Wien", countryCode: "AT", universityWebsite: "https://www.univie.ac.at/en", center: "Comprehensive Cancer Center Vienna (CCC)", centerWebsite: "https://ccc.meduniwien.ac.at", director: "Univ.-Prof. Dr. Shahrokh F. Shariat (Leiter/Director)", qsRank: "#152", phase: 4 },
  { university: "University of Basel", countryCode: "CH", universityWebsite: "https://www.unibas.ch/en.html", center: "Oncology research (via NCCR network and university hospital; no independent named cancer center)", centerWebsite: "https://www.unibas.ch/en.html", director: "See university hospital site", qsRank: "#158", phase: 4 },
  { university: "University of Barcelona", countryCode: "ES", universityWebsite: "https://www.ub.edu/web/ub/en", center: "Vall d'Hebron Institute of Oncology (VHIO)", centerWebsite: "https://vhio.net", director: "See institute leadership page (affiliated via Vall d'Hebron Hospital)", qsRank: "#160", phase: 4 },
];
