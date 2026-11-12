/**
 * Long-running funded degree programmes that their providers publish as a
 * page rather than a feed: government scholarships, university scholarships
 * at leading universities in Asia and Europe, funded biomedical PhD
 * programmes and dual-degree (MD-PhD) training.
 *
 * Every entry points at the provider's own page. An entry is only listed
 * while that page is reachable, permits automated access and still names the
 * programme (see programme-registry.ts), so a moved or closed programme drops
 * out on its own. Summaries are deliberately general: amounts, eligibility
 * and dates are left to the provider's page.
 *
 * `id` is part of each record's permanent key. Never change one; ids of
 * dual-degree programmes start with "mdphd-" so the MD-PhD view can find them.
 */
export type ProgrammeLevel = "MASTERS_SCHOLARSHIP" | "PHD_SCHOLARSHIP" | "FELLOWSHIP";
export type ProviderType = "UNIVERSITY" | "HOSPITAL" | "LABORATORY" | "RESEARCH_INSTITUTE" | "COMPANY" | "FOUNDATION";

export type Programme = {
  id: string;
  title: string;
  provider: string;
  providerType: ProviderType;
  /** Where the degree is taken (ISO 3166-1 alpha-2); null when it spans several countries. */
  country: string | null;
  url: string;
  /** Words that must still appear on the page for the entry to be listed. */
  match: string;
  levels: ProgrammeLevel[];
  summary: string;
};

const M: ProgrammeLevel[] = ["MASTERS_SCHOLARSHIP"];
const P: ProgrammeLevel[] = ["PHD_SCHOLARSHIP"];
const MP: ProgrammeLevel[] = ["MASTERS_SCHOLARSHIP", "PHD_SCHOLARSHIP"];
const F: ProgrammeLevel[] = ["FELLOWSHIP"];

const entry = (
  id: string, title: string, provider: string, providerType: ProviderType, country: string | null,
  url: string, match: string, levels: ProgrammeLevel[], summary: string,
): Programme => ({ id, title, provider, providerType, country, url, match, levels, summary });

export const PROGRAMMES: Programme[] = [
  // ── Government and foundation scholarships ────────────────────────────────
  entry("chevening", "Chevening Scholarships", "UK Foreign, Commonwealth & Development Office", "FOUNDATION", "GB", "https://www.chevening.org/scholarships/", "Chevening", M,
    "Fully funded one-year master's degrees at UK universities in any subject, including public health and biomedical courses, for applicants from eligible countries. Applications usually open in August."),
  entry("commonwealth-masters", "Commonwealth Master's Scholarships", "Commonwealth Scholarship Commission in the UK", "FOUNDATION", "GB", "https://cscuk.fcdo.gov.uk/scholarships/commonwealth-masters-scholarships/", "Commonwealth", M,
    "One-year taught master's degrees at UK universities for citizens of eligible low- and middle-income Commonwealth countries. Rounds usually close in October."),
  entry("commonwealth-shared", "Commonwealth Shared Scholarships", "Commonwealth Scholarship Commission in the UK", "FOUNDATION", "GB", "https://cscuk.fcdo.gov.uk/scholarships/commonwealth-shared-scholarships/", "Commonwealth", M,
    "Master's study at selected UK universities for candidates from eligible Commonwealth countries, funded jointly with the host university. Rounds usually close in December."),
  entry("erasmus-mundus", "Erasmus Mundus Joint Masters scholarships", "European Commission (EACEA)", "FOUNDATION", null, "https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en", "Erasmus Mundus", M,
    "More than 200 joint master's programmes taught across several European universities, many in health and the life sciences, with full scholarships open to students worldwide. Most programmes take applications between October and January."),
  entry("fulbright-foreign-student", "Fulbright Foreign Student Program", "U.S. Department of State", "FOUNDATION", "US", "https://foreign.fulbrightonline.org/", "Fulbright", MP,
    "Graduate study and research in the United States for students and early-career professionals from other countries. You apply through the Fulbright Commission or US Embassy in your home country, which sets its own deadline."),
  entry("si-global-professionals", "Swedish Institute Scholarships for Global Professionals", "Swedish Institute", "FOUNDATION", "SE", "https://si.se/en/apply/scholarships/swedish-institute-scholarships-for-global-professionals/", "Global Professionals", M,
    "Full scholarships for master's programmes at Swedish universities for professionals from eligible countries."),
  entry("manaaki-new-zealand", "Manaaki New Zealand Scholarships", "New Zealand Ministry of Foreign Affairs and Trade", "FOUNDATION", "NZ", "https://www.nzscholarships.govt.nz/", "Manaaki", MP,
    "Government scholarships for postgraduate study at New Zealand universities for applicants from eligible countries."),
  entry("mext-research-students", "Japanese Government (MEXT) Scholarship for research students", "Ministry of Education, Culture, Sports, Science and Technology (Japan)", "FOUNDATION", "JP", "https://www.studyinjapan.go.jp/en/planning/scholarships/mext-scholarships/", "MEXT", MP,
    "Graduate research at Japanese universities at master's and doctoral level. Applications are made through a Japanese embassy or by university recommendation."),
  entry("turkiye-scholarships", "Türkiye Scholarships", "Presidency for Turks Abroad and Related Communities (YTB)", "FOUNDATION", "TR", "https://www.turkiyeburslari.gov.tr/", "Scholarships", MP,
    "Government scholarships for master's and doctoral study at Turkish universities, open to international applicants."),
  entry("stipendium-hungaricum", "Stipendium Hungaricum", "Tempus Public Foundation (Hungary)", "FOUNDATION", "HU", "https://stipendiumhungaricum.hu/", "Stipendium Hungaricum", MP,
    "Hungarian government scholarships covering tuition for master's and doctoral programmes, including medical and health sciences, for students from partner countries."),
  entry("eiffel-excellence", "France Excellence Eiffel Scholarship Programme", "French Ministry for Europe and Foreign Affairs (Campus France)", "FOUNDATION", "FR", "https://www.campusfrance.org/en/eiffel-scholarship-program-of-excellence", "Eiffel", MP,
    "Scholarships for international students on master's and doctoral programmes in France. French institutions submit the application on the candidate's behalf, usually by early January."),
  entry("swiss-government-excellence", "Swiss Government Excellence Scholarships", "State Secretariat for Education, Research and Innovation (Switzerland)", "FOUNDATION", "CH", "https://www.sbfi.admin.ch/scholarships_eng", "Excellence Scholarships", P,
    "Research and doctoral scholarships at Swiss universities for foreign researchers who hold a master's degree. Calls usually open in August."),
  entry("vliruos-master", "VLIR-UOS Master Scholarships", "VLIR-UOS (Flemish Interuniversity Council)", "FOUNDATION", "BE", "https://www.vliruos.be/en/scholarships", "VLIR-UOS", M,
    "Scholarships for selected master's programmes at Flemish universities, several in health and life sciences, for nationals of eligible countries in Africa, Asia and Latin America."),
  entry("nl-scholarship", "NL Scholarship", "Dutch Ministry of Education and Dutch universities", "FOUNDATION", "NL", "https://www.studyinnl.org/finances/nl-scholarship", "NL Scholarship", M,
    "A scholarship for students from outside the EEA starting a master's degree at a participating Dutch university. Each university sets its own deadline."),
  entry("vanier-canada", "Vanier Canada Graduate Scholarships", "Government of Canada", "FOUNDATION", "CA", "https://vanier.gc.ca/en/home-accueil.html", "Vanier", P,
    "Doctoral scholarships at Canadian universities, including health research, for Canadian and international students nominated by their university."),
  entry("goi-ies", "Government of Ireland International Education Scholarships", "Higher Education Authority (Ireland)", "FOUNDATION", "IE", "https://hea.ie/policy/internationalisation/goi-ies/", "Government of Ireland", MP,
    "One-year scholarships for students from outside the EU/EEA taking a master's or doctoral programme at an Irish higher-education institution."),
  entry("chinese-government-scholarship", "Chinese Government Scholarship", "China Scholarship Council", "FOUNDATION", "CN", "https://www.campuschina.org/", "Scholarship", MP,
    "Government scholarships for international students on master's and doctoral programmes at Chinese universities, including Tsinghua, Peking, Fudan, Shanghai Jiao Tong and Zhejiang."),
  entry("global-korea-scholarship", "Global Korea Scholarship for graduate degrees", "National Institute for International Education (Korea)", "FOUNDATION", "KR", "https://www.studyinkorea.go.kr/", "Scholarship", MP,
    "Korean government scholarships for international students on master's and doctoral programmes at Korean universities."),
  entry("joint-japan-world-bank", "Joint Japan/World Bank Graduate Scholarship Program", "World Bank", "FOUNDATION", null, "https://www.worldbank.org/en/programs/scholarships", "Scholarship", M,
    "Scholarships for development-related master's degrees, including public health, for professionals from World Bank member developing countries."),
  entry("gates-cambridge", "Gates Cambridge Scholarship", "Gates Cambridge Trust", "FOUNDATION", "GB", "https://www.gatescambridge.org/", "Gates Cambridge", MP,
    "Full-cost scholarships for postgraduate degrees at the University of Cambridge in any subject, for applicants from outside the United Kingdom."),
  entry("rhodes", "Rhodes Scholarship", "Rhodes Trust", "FOUNDATION", "GB", "https://www.rhodeshouse.ox.ac.uk/scholarships/the-rhodes-scholarship/", "Rhodes", MP,
    "Fully funded postgraduate study at the University of Oxford, awarded by country and regional constituencies."),
  entry("paul-daisy-soros", "Paul & Daisy Soros Fellowships for New Americans", "Paul & Daisy Soros Fellowships", "FOUNDATION", "US", "https://www.pdsoros.org/", "Soros", P,
    "Support for graduate study in the United States, including PhD and combined MD/PhD degrees, for immigrants and children of immigrants."),

  // ── Funded biomedical PhD programmes ──────────────────────────────────────
  entry("embl-phd", "EMBL International PhD Programme", "European Molecular Biology Laboratory", "RESEARCH_INSTITUTE", "DE", "https://www.embl.org/about/info/embl-international-phd-programme/", "PhD Programme", P,
    "Funded doctoral training in molecular biology across EMBL's sites in Europe, open to applicants of any nationality."),
  entry("bif-phd-fellowships", "Boehringer Ingelheim Fonds PhD Fellowships", "Boehringer Ingelheim Fonds", "FOUNDATION", null, "https://www.bifonds.de/fellowships-grants/phd-fellowships.html", "PhD", P,
    "Fellowships for outstanding junior scientists starting an ambitious PhD project in basic biomedical research at a leading laboratory."),
  entry("imprs", "International Max Planck Research Schools (IMPRS)", "Max Planck Society", "RESEARCH_INSTITUTE", "DE", "https://www.mpg.de/en/imprs", "IMPRS", P,
    "Structured, funded doctoral programmes run by Max Planck Institutes with partner universities, many in biology and medicine. Each school has its own call."),
  entry("crick-phd", "Francis Crick Institute PhD Programme", "The Francis Crick Institute", "RESEARCH_INSTITUTE", "GB", "https://www.crick.ac.uk/careers-study/students/phd-students", "PhD", P,
    "Four-year funded PhD positions in biomedical research at the Crick in London, open to international applicants."),
  entry("sanger-phd", "Wellcome Sanger Institute PhD Programme", "Wellcome Sanger Institute", "RESEARCH_INSTITUTE", "GB", "https://www.sanger.ac.uk/about/study/phd-programmes/", "PhD", P,
    "Funded four-year PhD training in genomics and biodata, with degrees awarded by the University of Cambridge."),
  entry("vienna-biocenter-phd", "Vienna BioCenter PhD Programme", "Vienna BioCenter", "RESEARCH_INSTITUTE", "AT", "https://training.vbc.ac.at/phd-programme/", "PhD", P,
    "Funded doctoral positions in the life sciences across the Vienna BioCenter institutes, with two selection rounds a year."),
  entry("ista-phd", "ISTA PhD Programme", "Institute of Science and Technology Austria", "RESEARCH_INSTITUTE", "AT", "https://phd.ista.ac.at/", "PhD", P,
    "A fully funded, interdisciplinary PhD programme that includes the life sciences and neuroscience, open to bachelor's and master's graduates."),
  entry("la-caixa-inphinit", "\"la Caixa\" INPhINIT Doctoral Fellowships", "\"la Caixa\" Foundation", "FOUNDATION", "ES", "https://fundacionlacaixa.org/en/inphinit-doctoral-fellowships-incoming", "INPhINIT", P,
    "Doctoral fellowships at research centres and universities in Spain and Portugal in health, life sciences and other STEM fields."),
  entry("pasteur-ppu", "Pasteur–Paris University International Doctoral Program (PPU)", "Institut Pasteur", "RESEARCH_INSTITUTE", "FR", "https://www.pasteur.fr/en/education/ppu", "PPU", P,
    "A funded international doctoral programme for students with a degree from outside France, carried out in Institut Pasteur laboratories in Paris."),
  entry("weizmann-feinberg", "Weizmann Institute of Science graduate programmes", "Weizmann Institute of Science", "RESEARCH_INSTITUTE", "IL", "https://www.weizmann.ac.il/feinberg/", "Feinberg", MP,
    "MSc and PhD programmes in the life sciences and related fields at the Feinberg Graduate School, with fellowships for admitted students."),
  entry("kaust-fellowship", "KAUST Fellowship for MS and PhD study", "King Abdullah University of Science and Technology", "UNIVERSITY", "SA", "https://admissions.kaust.edu.sa/", "KAUST", MP,
    "Admitted master's and doctoral students, including those in bioscience and bioengineering, receive a fellowship that covers tuition and living costs."),

  // ── Asia: leading universities and national schemes ───────────────────────
  entry("hkpfs", "Hong Kong PhD Fellowship Scheme", "Research Grants Council of Hong Kong", "FOUNDATION", "HK", "https://cerg1.ugc.edu.hk/hkpfs/index.html", "Fellowship Scheme", P,
    "PhD fellowships tenable at Hong Kong's publicly funded universities, including HKU, CUHK and HKUST, open to applicants of any nationality. Applications usually run from September to early December."),
  entry("singa", "Singapore International Graduate Award (SINGA)", "Agency for Science, Technology and Research (A*STAR)", "RESEARCH_INSTITUTE", "SG", "https://www.a-star.edu.sg/Scholarships/for-graduate-studies/singapore-international-graduate-award-singa", "SINGA", P,
    "Funded PhD training in biomedical sciences and engineering at A*STAR institutes, NUS, NTU and other Singapore universities, for international students."),
  entry("tigp", "Taiwan International Graduate Program (TIGP)", "Academia Sinica", "RESEARCH_INSTITUTE", "TW", "https://tigp.sinica.edu.tw/", "TIGP", P,
    "English-taught PhD programmes with fellowship support, run by Academia Sinica with Taiwanese universities, including molecular medicine and neuroscience."),
  entry("oist-phd", "OIST PhD Programme", "Okinawa Institute of Science and Technology", "UNIVERSITY", "JP", "https://www.oist.jp/admissions", "PhD", P,
    "A fully funded five-year PhD programme taught in English, with neuroscience and molecular biology among its research areas."),
  entry("nus-research-scholarship", "NUS Research Scholarship", "National University of Singapore", "UNIVERSITY", "SG", "https://nusgs.nus.edu.sg/scholarships/", "Research Scholarship", MP,
    "Stipend and tuition support for full-time research master's and PhD students at the National University of Singapore."),
  entry("ntu-research-scholarship", "NTU Research Scholarship", "Nanyang Technological University", "UNIVERSITY", "SG", "https://www.ntu.edu.sg/admissions/graduate/financialmatters/scholarships/rss", "Research Scholarship", MP,
    "Stipend and tuition support for full-time research master's and PhD students at Nanyang Technological University."),
  entry("duke-nus-phd", "Duke-NUS PhD programmes", "Duke-NUS Medical School", "UNIVERSITY", "SG", "https://www.duke-nus.edu.sg/education/phd-programmes", "PhD", P,
    "Funded PhD programmes in integrated biology and medicine, quantitative biology and clinical sciences at Duke-NUS Medical School in Singapore."),
  entry("hku-presidential-phd", "HKU Presidential PhD Scholar Programme", "The University of Hong Kong", "UNIVERSITY", "HK", "https://gradsch.hku.hk/prospective_students/fees_scholarships_and_financial_support/hku_presidential_phd_scholar_programme", "Presidential PhD", P,
    "An enhanced scholarship package for outstanding new PhD students at the University of Hong Kong."),
  entry("cuhk-postgraduate-scholarships", "CUHK postgraduate scholarships", "The Chinese University of Hong Kong", "UNIVERSITY", "HK", "https://www.gs.cuhk.edu.hk/admissions/scholarships-fees/scholarships", "Scholarship", P,
    "Postgraduate studentships and the Vice-Chancellor's PhD Scholarship Scheme for research students at CUHK."),
  entry("utokyo-scholarships", "University of Tokyo scholarships for international students", "The University of Tokyo", "UNIVERSITY", "JP", "https://www.u-tokyo.ac.jp/en/prospective-students/scholarships.html", "Scholarship", MP,
    "Scholarships and fellowships available to international graduate students at the University of Tokyo, including the university's own fellowship."),
  entry("snu-gsfs", "Seoul National University scholarships for international graduate students", "Seoul National University", "UNIVERSITY", "KR", "https://en.snu.ac.kr/admission/graduate/scholarships/before_application", "Scholarship", MP,
    "Scholarships for international master's and doctoral students at Seoul National University, including the Graduate Scholarship for Excellent Foreign Students."),
  entry("kaist-international-graduate", "KAIST scholarships for international graduate students", "Korea Advanced Institute of Science and Technology", "UNIVERSITY", "KR", "https://admission.kaist.ac.kr/intl-graduate/", "KAIST", MP,
    "International students admitted to KAIST master's and doctoral programmes, including biological sciences and bio and brain engineering, receive scholarship support."),

  // ── Europe: leading universities ──────────────────────────────────────────
  entry("clarendon", "Clarendon Fund Scholarships", "University of Oxford", "UNIVERSITY", "GB", "https://www.ox.ac.uk/clarendon", "Clarendon", MP,
    "Fully funded graduate scholarships at the University of Oxford in every subject. Applicants are considered automatically when they apply for a graduate course by the December or January deadline."),
  entry("cambridge-trust", "Cambridge Trust Scholarships", "Cambridge Commonwealth, European and International Trust", "FOUNDATION", "GB", "https://www.cambridgetrust.org/scholarships/", "Cambridge Trust", MP,
    "Scholarships for international students on master's and PhD courses at the University of Cambridge, many awarded with partner funders."),
  entry("imperial-presidents-phd", "Imperial College President's PhD Scholarships", "Imperial College London", "UNIVERSITY", "GB", "https://www.imperial.ac.uk/study/fees-and-funding/postgraduate-doctoral/grants-scholarships/presidents-phd-scholarships/", "President", P,
    "Full tuition and a stipend for outstanding PhD applicants in any Imperial department, including medicine and life sciences."),
  entry("ucl-research-excellence", "UCL Research Excellence Scholarship", "University College London", "UNIVERSITY", "GB", "https://www.ucl.ac.uk/scholarships/research-excellence-scholarship", "Research Excellence", P,
    "Fully funded scholarships for doctoral research at UCL, open to applicants of any nationality."),
  entry("lshtm-funding", "LSHTM scholarships and funding", "London School of Hygiene & Tropical Medicine", "UNIVERSITY", "GB", "https://www.lshtm.ac.uk/study/fees-and-funding/funding-scholarships", "scholarship", MP,
    "Scholarships for master's and research degrees in public health, epidemiology and tropical medicine at LSHTM."),
  entry("eth-esop", "ETH Zurich Excellence Scholarship & Opportunity Programme", "ETH Zurich", "UNIVERSITY", "CH", "https://ethz.ch/en/studies/financial/scholarships/excellencescholarship.html", "Excellence Scholarship", M,
    "Scholarships covering living and study costs for excellent students starting a master's degree at ETH Zurich."),
  entry("epfl-excellence-fellowships", "EPFL Excellence Fellowships", "EPFL", "UNIVERSITY", "CH", "https://www.epfl.ch/education/studies/en/financing-study/grants/excellence-fellowships/", "Excellence Fellowships", M,
    "Fellowships for outstanding students starting a master's programme at EPFL, including life sciences engineering."),
  entry("ki-global-masters", "Karolinska Institutet Global Master's Scholarships", "Karolinska Institutet", "UNIVERSITY", "SE", "https://education.ki.se/ki-global-masters-scholarships", "Global Master", M,
    "Tuition-fee scholarships for fee-paying students admitted to a global master's programme at Karolinska Institutet."),
  entry("lund-global-scholarship", "Lund University Global Scholarship", "Lund University", "UNIVERSITY", "SE", "https://www.lunduniversity.lu.se/admissions/bachelors-and-masters-studies/scholarships-and-awards/lund-university-global-scholarship", "Global Scholarship", M,
    "Merit-based tuition scholarships for top students from outside the EU/EEA admitted to a Lund University master's programme."),
  entry("kuleuven-master-mind", "KU Leuven Master Mind Scholarships", "KU Leuven", "UNIVERSITY", "BE", "https://www.kuleuven.be/english/international/mastermindscholarships", "Master Mind", M,
    "Scholarships for excellent international students taking a master's programme at KU Leuven."),
  entry("utrecht-excellence", "Utrecht Excellence Scholarships", "Utrecht University", "UNIVERSITY", "NL", "https://www.uu.nl/en/masters/general-information/scholarships-and-funding/utrecht-excellence-scholarships", "Excellence Scholarship", M,
    "Scholarships for outstanding students from outside the EEA on selected master's programmes at Utrecht University, including life sciences."),
  entry("leiden-lexs", "Leiden University Excellence Scholarship (LExS)", "Leiden University", "UNIVERSITY", "NL", "https://www.universiteitleiden.nl/en/scholarships/sea/leiden-university-excellence-scholarship-lexs", "Excellence Scholarship", M,
    "Tuition scholarships for excellent students from outside the EEA enrolling in a Leiden master's programme."),
  entry("amsterdam-merit", "Amsterdam Merit Scholarship", "University of Amsterdam", "UNIVERSITY", "NL", "https://www.uva.nl/en/education/fees-and-funding/masters-scholarships-and-loans/amsterdam-merit-scholarship/amsterdam-merit-scholarship.html", "Merit Scholarship", M,
    "Scholarships for exceptionally talented students from outside the EEA on University of Amsterdam master's programmes."),
  entry("paris-saclay-international-masters", "Université Paris-Saclay International Master's Scholarships", "Université Paris-Saclay", "UNIVERSITY", "FR", "https://www.universite-paris-saclay.fr/en/admission/bourses-et-aides-financieres/international-masters-scholarships-program-idex", "Scholarship", M,
    "Scholarships for international students admitted to a master's programme at Université Paris-Saclay."),

  // ── Dual-degree (MD-PhD) and physician-scientist training ─────────────────
  entry("mdphd-nih-partnership", "NIH MD/PhD Partnership Training Program", "National Institutes of Health", "RESEARCH_INSTITUTE", "US", "https://mdphd.gpp.nih.gov/", "MD/PhD", P,
    "Combined MD/PhD training in which the PhD research is carried out at the NIH in partnership with a US medical school."),
  entry("mdphd-nih-oxcam", "NIH Oxford-Cambridge Scholars Program", "National Institutes of Health", "RESEARCH_INSTITUTE", null, "https://oxcam.gpp.nih.gov/", "Oxford", P,
    "Accelerated, funded doctoral training split between the NIH and the University of Oxford or Cambridge, with a combined MD/PhD track."),
  entry("mdphd-nigms-mstp", "NIH Medical Scientist Training Program (MSTP)", "National Institute of General Medical Sciences", "RESEARCH_INSTITUTE", "US", "https://www.nigms.nih.gov/training/instpredoc/Pages/PredocOverview-MSTP.aspx", "Medical Scientist Training", P,
    "NIH-funded MD-PhD programmes at US medical schools that cover tuition and pay a stipend. The page lists every participating institution; you apply to the institutions directly."),
  entry("mdphd-swiss-national", "Swiss National MD-PhD Programme", "Swiss Academy of Medical Sciences", "FOUNDATION", "CH", "https://www.samw.ch/en/Funding/MD-PhD-Program.html", "MD-PhD", P,
    "Grants that fund medical graduates to complete a PhD in the natural sciences, public health, clinical research or biomedical ethics at a Swiss university."),
  entry("mdphd-wellcome-health-professionals", "Wellcome PhD Programmes for Health Professionals", "Wellcome", "FOUNDATION", "GB", "https://wellcome.org/grant-funding/schemes/phd-programmes-health-professionals", "Health Professionals", P,
    "Funded PhD programmes at UK and Irish institutions for doctors and other registered health professionals who want a research career."),
  entry("mdphd-bif-md-fellowships", "Boehringer Ingelheim Fonds MD Fellowships", "Boehringer Ingelheim Fonds", "FOUNDATION", null, "https://www.bifonds.de/fellowships-grants/md-fellowships.html", "MD", F,
    "Fellowships for medical students who interrupt their studies for a full-time experimental research project in basic biomedical science."),
  entry("mdphd-duke-nus", "Duke-NUS MD-PhD Programme", "Duke-NUS Medical School", "UNIVERSITY", "SG", "https://www.duke-nus.edu.sg/education/md-phd-programme", "MD-PhD", P,
    "A combined MD-PhD track at Duke-NUS Medical School in Singapore for students training as clinician-scientists."),
  entry("mdphd-cambridge-mbphd", "University of Cambridge MB/PhD Programme", "University of Cambridge", "UNIVERSITY", "GB", "https://www.medschl.cam.ac.uk/education/courses/mbphd/", "MB/PhD", P,
    "An intercalated PhD within clinical medical training at Cambridge for students aiming at a career in academic medicine."),
  entry("mdphd-ucl-mbphd", "UCL MBPhD Programme", "University College London", "UNIVERSITY", "GB", "https://www.ucl.ac.uk/medical-school/study/mbphd-programme", "MBPhD", P,
    "A combined medical degree and PhD at UCL Medical School, with funded studentships for the research years."),
  entry("mdphd-toronto", "University of Toronto MD/PhD Program", "University of Toronto", "UNIVERSITY", "CA", "https://mdphd.utoronto.ca/", "MD/PhD", P,
    "Canada's largest combined MD/PhD programme, with stipend support during training."),
  entry("mdphd-mcgill", "McGill University MD-PhD Program", "McGill University", "UNIVERSITY", "CA", "https://www.mcgill.ca/mdphd/", "MD-PhD", P,
    "A combined MD-PhD programme at McGill for students preparing for a career as a clinician-scientist."),
  entry("mdphd-harvard-mit", "Harvard/MIT MD-PhD Program", "Harvard Medical School", "UNIVERSITY", "US", "https://www.hms.harvard.edu/md_phd/", "MD-PhD", P,
    "A funded dual-degree programme that combines Harvard's MD with a PhD at Harvard or MIT."),
  entry("mdphd-stanford-mstp", "Stanford Medical Scientist Training Program", "Stanford University School of Medicine", "UNIVERSITY", "US", "https://med.stanford.edu/mstp.html", "MSTP", P,
    "Stanford's funded MD-PhD programme, covering tuition and a stipend for both degrees."),
  entry("mdphd-ucsf-mstp", "UCSF Medical Scientist Training Program", "University of California, San Francisco", "UNIVERSITY", "US", "https://mstp.ucsf.edu/", "MSTP", P,
    "UCSF's funded MD-PhD programme for future physician-scientists."),
  entry("mdphd-johns-hopkins", "Johns Hopkins MD-PhD Program", "Johns Hopkins University School of Medicine", "UNIVERSITY", "US", "https://mdphd.johnshopkins.edu/", "MD-PhD", P,
    "A funded dual-degree programme at Johns Hopkins, one of the longest-running in the United States."),
  entry("mdphd-washu-mstp", "Washington University Medical Scientist Training Program", "Washington University School of Medicine in St. Louis", "UNIVERSITY", "US", "https://mstp.wustl.edu/", "MSTP", P,
    "A funded MD-PhD programme at Washington University in St. Louis with full tuition and stipend support."),
  entry("mdphd-penn-mstp", "Penn Medical Scientist Training Program", "Perelman School of Medicine, University of Pennsylvania", "UNIVERSITY", "US", "https://www.med.upenn.edu/mstp/", "MD-PhD", P,
    "The University of Pennsylvania's funded MD-PhD programme across biomedical and other graduate groups."),
  entry("mdphd-tri-institutional", "Tri-Institutional MD-PhD Program", "Weill Cornell Medicine, The Rockefeller University and Memorial Sloan Kettering", "UNIVERSITY", "US", "https://mdphd.weill.cornell.edu/", "MD-PhD", P,
    "A funded dual-degree programme in New York run jointly by Weill Cornell, Rockefeller and Sloan Kettering."),
  entry("mdphd-yale", "Yale MD-PhD Program", "Yale School of Medicine", "UNIVERSITY", "US", "https://medicine.yale.edu/mdphd/", "MD-PhD", P,
    "Yale's funded MD-PhD programme for students pursuing careers in academic medicine and research."),
  entry("mdphd-columbia", "Columbia University MD-PhD Program", "Columbia University Vagelos College of Physicians and Surgeons", "UNIVERSITY", "US", "https://www.mdphd.cuimc.columbia.edu/", "MD-PhD", P,
    "A funded dual-degree programme at Columbia University Irving Medical Center."),
  entry("mdphd-michigan", "University of Michigan MD-PhD Program", "University of Michigan Medical School", "UNIVERSITY", "US", "https://medicine.umich.edu/medschool/education/md-phd-program", "MD-PhD", P,
    "The University of Michigan's funded Medical Scientist Training Program."),
  entry("mdphd-ucsd-mstp", "UC San Diego Medical Scientist Training Program", "University of California San Diego School of Medicine", "UNIVERSITY", "US", "https://mstp.ucsd.edu/", "MSTP", P,
    "UC San Diego's funded MD-PhD programme, with research at the university and neighbouring institutes."),
  entry("mdphd-ucla-caltech", "UCLA-Caltech Medical Scientist Training Program", "David Geffen School of Medicine at UCLA", "UNIVERSITY", "US", "https://mstp.healthsciences.ucla.edu/", "MSTP", P,
    "A funded MD-PhD programme with PhD training at UCLA or Caltech."),
  entry("mdphd-vanderbilt-mstp", "Vanderbilt Medical Scientist Training Program", "Vanderbilt University School of Medicine", "UNIVERSITY", "US", "https://medschool.vanderbilt.edu/mstp/", "MSTP", P,
    "Vanderbilt's funded MD-PhD programme for physician-scientists."),
  entry("mdphd-northwestern-mstp", "Northwestern Medical Scientist Training Program", "Northwestern University Feinberg School of Medicine", "UNIVERSITY", "US", "https://www.feinberg.northwestern.edu/sites/mstp/", "MSTP", P,
    "Northwestern's funded MD-PhD programme in Chicago."),
];
