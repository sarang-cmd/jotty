/**
 * Domain knowledge used to tell "same subject" apart from "same assignment".
 *
 * The judge needs to separate three things:
 *   1. this page is about the task in front of you
 *   2. this page is about the same subject, but a different topic
 *   3. this page has nothing to do with either
 *
 * The cluster names are internal. The human-facing reason strings live in
 * relevance.js so they can be written in the coach's voice.
 */

export const SUBJECTS = {
  chemistry: {
    label: "Chemistry",
    clusters: {
      gases: [
        "gas", "gases", "ideal gas", "pv=nrt", "partial pressure", "mole", "moles", "molar",
        "stoichiometry", "stoichiometric", "limiting reagent", "combustion", "avogadro",
        "kinetic molecular", "effusion", "dalton", "atm", "kpa", "torr",
      ],
      bonding: [
        "bond", "bonding", "covalent", "ionic", "electronegativity", "lewis", "vsepr",
        "hybridization", "molecular geometry", "polarity", "intermolecular", "hydrogen bond",
      ],
      reactions: [
        "reaction", "equation", "balancing", "oxidation", "reduction", "redox", "equilibrium",
        "rate law", "catalyst", "enthalpy", "entropy", "gibbs", "thermochemistry", "precipitate",
      ],
      acids: [
        "acid", "base", "ph", "pka", "buffer", "titration", "neutralization", "ka", "kb",
      ],
      atomic: [
        "atom", "atomic", "electron", "orbital", "quantum number", "periodic table", "isotope",
        "nuclear", "radioactive", "ionization",
      ],
      organic: [
        "organic", "alkane", "alkene", "alkyne", "functional group", "isomer", "benzene",
        "nomenclature", "iupac", "stereochemistry", "chirality", "alcohol", "carboxylic",
      ],
      polymers: [
        "polymer", "teflon", "ptfe", "plastic", "monomer", "polyethylene", "nylon", "pvc",
        "polystyrene", "elastomer", "resin",
      ],
      lab: [
        "lab", "laboratory", "experiment", "safety", "apparatus", "burette", "pipette",
        "spectroscopy", "chromatography", "calorimetry", "yield",
      ],
    },
  },
  biology: {
    label: "Biology",
    clusters: {
      cells: ["cell", "organelle", "mitochondria", "membrane", "osmosis", "diffusion", "mitosis", "meiosis"],
      genetics: ["dna", "rna", "gene", "genetics", "allele", "punnett", "transcription", "translation", "mutation", "crispr"],
      physiology: ["heart", "neuron", "hormone", "kidney", "digestion", "immune", "circulation", "respiration", "homeostasis"],
      ecology: ["ecosystem", "food web", "population", "biodiversity", "carbon cycle", "succession", "biome"],
      evolution: ["evolution", "natural selection", "speciation", "adaptation", "phylogeny", "fossil"],
      microbiology: ["bacteria", "virus", "pathogen", "antibiotic", "microbiome", "fungi"],
    },
  },
  physics: {
    label: "Physics",
    clusters: {
      mechanics: ["force", "newton", "acceleration", "momentum", "friction", "incline", "projectile", "tension"],
      energy: ["energy", "work", "power", "kinetic", "potential", "conservation", "joule", "efficiency"],
      electricity: ["circuit", "voltage", "current", "resistance", "ohm", "capacitor", "kirchhoff", "magnetic field"],
      waves: ["wave", "frequency", "wavelength", "sound", "doppler", "refraction", "interference", "optics", "lens"],
      thermo: ["thermodynamics", "heat", "temperature", "entropy", "carnot", "ideal gas law"],
      modern_physics: ["quantum", "photon", "relativity", "nuclear", "photoelectric", "standard model"],
    },
  },
  math: {
    label: "Math",
    clusters: {
      algebra: ["equation", "linear", "quadratic", "polynomial", "factor", "inequality", "slope", "function"],
      calculus: ["derivative", "integral", "limit", "chain rule", "series", "differential", "gradient"],
      geometry: ["triangle", "circle", "angle", "theorem", "area", "volume", "coordinate", "trigonometry", "sine", "cosine"],
      statistics: ["probability", "mean", "median", "deviation", "distribution", "regression", "hypothesis", "p-value"],
      discrete: ["matrix", "vector", "graph", "combinatorics", "permutation", "modular", "proof"],
    },
  },
  cs: {
    label: "Computer science",
    clusters: {
      programming: ["variable", "loop", "function", "recursion", "class", "pointer", "javascript", "python", "java", "compiler"],
      algorithms: ["algorithm", "complexity", "sorting", "search", "dynamic programming", "graph traversal", "big o", "binary tree"],
      systems: ["operating system", "memory", "process", "thread", "kernel", "cache", "concurrency", "deadlock"],
      networks: ["network", "tcp", "http", "dns", "packet", "socket", "routing", "protocol"],
      data: ["database", "sql", "normalization", "index", "transaction", "query", "schema"],
      ai: ["machine learning", "neural network", "training", "gradient descent", "model", "dataset", "classification"],
    },
  },
  history: {
    label: "History",
    clusters: {
      ancient: ["rome", "greece", "egypt", "mesopotamia", "empire", "republic", "pharaoh"],
      earlymodern: ["renaissance", "reformation", "colonial", "absolutism", "exploration", "printing press"],
      modern: ["revolution", "industrial", "nationalism", "imperialism", "world war", "cold war", "treaty"],
      revolutions: ["french revolution", "american revolution", "independence", "constitution", "suffrage"],
      historiography: ["primary source", "secondary source", "historiography", "archive", "revisionist"],
    },
  },
  economics: {
    label: "Economics",
    clusters: {
      micro: ["demand", "supply", "elasticity", "market", "monopoly", "utility", "equilibrium price"],
      macro: ["inflation", "gdp", "unemployment", "interest rate", "fiscal", "monetary", "recession"],
      trade: ["trade", "tariff", "comparative advantage", "exchange rate", "globalization"],
      finance: ["investment", "bond", "stock", "portfolio", "risk", "compound interest"],
    },
  },
  literature: {
    label: "Literature",
    clusters: {
      poetry: ["poem", "poetry", "sonnet", "meter", "rhyme", "stanza", "metaphor"],
      novel: ["novel", "narrator", "chapter", "character", "plot", "theme", "fiction", "protagonist"],
      drama: ["play", "shakespeare", "tragedy", "act", "scene", "soliloquy"],
      analysis: ["essay", "thesis", "citation", "analysis", "criticism", "symbolism"],
    },
  },
};

/** Conventional subject words that also identify a transcript without a cluster. */
export const SUBJECT_WORDS = {
  chemistry: ["chemistry", "chemical", "chem"],
  biology: ["biology", "biological", "bio"],
  physics: ["physics", "physical science"],
  math: ["math", "maths", "mathematics", "algebra", "calculus", "geometry", "statistics"],
  cs: ["computer science", "programming", "coding", "software"],
  history: ["history", "historical"],
  economics: ["economics", "economy", "econ"],
  literature: ["literature", "english class", "literary"],
};

export function detectSubject(text) {
  const haystack = ` ${String(text || "").toLowerCase()} `;
  const scores = [];
  for (const [id, subject] of Object.entries(SUBJECTS)) {
    let score = 0;
    for (const word of SUBJECT_WORDS[id] || []) {
      if (haystack.includes(` ${word} `)) score += 2;
    }
    for (const terms of Object.values(subject.clusters)) {
      for (const term of terms) {
        if (term.includes(" ")) {
          if (haystack.includes(` ${term} `)) score += 1.5;
        } else if (new RegExp(`\\b${term}\\b`).test(haystack)) {
          score += 1;
        }
      }
    }
    if (score > 0) scores.push({ id, label: subject.label, score });
  }
  scores.sort((a, b) => b.score - a.score);
  return scores;
}

/** Which topic cluster inside a subject does this text lean towards? */
export function detectCluster(subjectId, text) {
  const subject = SUBJECTS[subjectId];
  if (!subject) return null;
  const haystack = ` ${String(text || "").toLowerCase()} `;
  let best = null;
  for (const [clusterId, terms] of Object.entries(subject.clusters)) {
    let score = 0;
    const hits = [];
    for (const term of terms) {
      const pattern = term.includes(" ")
        ? haystack.includes(` ${term} `)
        : new RegExp(`\\b${term}\\b`).test(haystack);
      if (pattern) {
        score += term.includes(" ") ? 2 : 1;
        hits.push(term);
      }
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { id: clusterId, score, hits };
    }
  }
  return best;
}

/** Domains that are almost never academic when a focus session is running. */
export const DISTRACTION_DOMAINS = [
  "youtube.com", "instagram.com", "tiktok.com", "x.com", "twitter.com", "facebook.com",
  "reddit.com", "netflix.com", "twitch.tv", "discord.com", "snapchat.com", "pinterest.com",
  "primevideo.com", "disneyplus.com", "hulu.com", "spotify.com", "steampowered.com",
  "roblox.com", "9gag.com", "tumblr.com", "threads.net", "bilibili.com",
];

/** Domains we treat as reference material rather than entertainment. */
export const REFERENCE_DOMAINS = [
  "khanacademy.org", "chem.libretexts.org", "openstax.org", "wikipedia.org",
  "britannica.com", "coursera.org", "edx.org", "ocw.mit.edu", "arxiv.org",
  "scholar.google.com", "jstor.org", "desmos.com", "wolframalpha.com", "quizlet.com",
  "docs.google.com", "notion.so", "overleaf.com", "github.com", "stackoverflow.com",
];

export function matchDomain(host, list) {
  if (!host) return false;
  const clean = String(host).toLowerCase().replace(/^www\./, "");
  return list.some((domain) => {
    const d = String(domain || "").toLowerCase().replace(/^www\./, "").trim();
    if (!d) return false;
    return clean === d || clean.endsWith(`.${d}`);
  });
}

export const SUBJECT_OPTIONS = [
  "Chemistry", "Biology", "Physics", "Math", "Computer science",
  "History", "Economics", "Literature", "Other",
];

/** Curated channel handles per subject. No view counts, no invented metadata. */
export const CURATED_CHANNELS = {
  Chemistry: [
    { handle: "@khanacademy", name: "Khan Academy" },
    { handle: "@TylerDeWitt", name: "Tyler DeWitt" },
    { handle: "@ProfessorDaveExplains", name: "Professor Dave Explains" },
    { handle: "@crashcourse", name: "CrashCourse" },
    { handle: "@TheOrganicChemistryTutor", name: "The Organic Chemistry Tutor" },
  ],
  Biology: [
    { handle: "@khanacademy", name: "Khan Academy" },
    { handle: "@crashcourse", name: "CrashCourse" },
    { handle: "@AmoebaSisters", name: "Amoeba Sisters" },
    { handle: "@BozemanScience", name: "Bozeman Science" },
  ],
  Physics: [
    { handle: "@khanacademy", name: "Khan Academy" },
    { handle: "@PhysicsVideosbyEugeneKhutoryansky", name: "Physics Videos by Eugene Khutoryansky" },
    { handle: "@crashcourse", name: "CrashCourse" },
    { handle: "@MinutePhysics", name: "MinutePhysics" },
  ],
  Math: [
    { handle: "@khanacademy", name: "Khan Academy" },
    { handle: "@3blue1brown", name: "3Blue1Brown" },
    { handle: "@patrickjmt", name: "patrickJMT" },
    { handle: "@Mathantics", name: "Math Antics" },
  ],
  "Computer science": [
    { handle: "@freecodecamp", name: "freeCodeCamp.org" },
    { handle: "@crashcourse", name: "CrashCourse" },
    { handle: "@Computerphile", name: "Computerphile" },
    { handle: "@AbdulBari", name: "Abdul Bari" },
  ],
  History: [
    { handle: "@crashcourse", name: "CrashCourse" },
    { handle: "@khanacademy", name: "Khan Academy" },
    { handle: "@OverSimplified", name: "OverSimplified" },
    { handle: "@TomRichey", name: "Tom Richey" },
  ],
  Economics: [
    { handle: "@crashcourse", name: "CrashCourse" },
    { handle: "@MarginalRevolutionUniversity", name: "Marginal Revolution University" },
    { handle: "@khanacademy", name: "Khan Academy" },
  ],
  Literature: [
    { handle: "@crashcourse", name: "CrashCourse" },
    { handle: "@khanacademy", name: "Khan Academy" },
    { handle: "@ThugNotes", name: "Wisecrack" },
  ],
  Other: [
    { handle: "@khanacademy", name: "Khan Academy" },
    { handle: "@crashcourse", name: "CrashCourse" },
  ],
};
