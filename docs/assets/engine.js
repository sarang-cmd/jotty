var JottyEngine = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/demo/engine.js
  var engine_exports = {};
  __export(engine_exports, {
    VERDICT: () => VERDICT,
    VERDICT_LABEL: () => VERDICT_LABEL,
    buildHeatmap: () => buildHeatmap,
    buildReflection: () => buildReflection,
    createHabits: () => createHabits,
    createSession: () => createSession,
    dateKey: () => dateKey,
    evaluateReflection: () => evaluateReflection,
    focusStreak: () => focusStreak,
    formatCountdown: () => formatCountdown,
    formatDuration: () => formatDuration,
    formatHourRange: () => formatHourRange,
    judgePage: () => judgePage,
    rankWeakSpots: () => rankWeakSpots,
    recordEvent: () => recordEvent,
    recordSlice: () => recordSlice,
    remainingSeconds: () => remainingSeconds,
    shouldNudge: () => shouldNudge,
    softBlockDecision: () => softBlockDecision,
    summarizeDay: () => summarizeDay
  });

  // src/config/subjects.js
  var SUBJECTS = {
    chemistry: {
      label: "Chemistry",
      clusters: {
        gases: [
          "gas",
          "gases",
          "ideal gas",
          "pv=nrt",
          "partial pressure",
          "mole",
          "moles",
          "molar",
          "stoichiometry",
          "stoichiometric",
          "limiting reagent",
          "combustion",
          "avogadro",
          "kinetic molecular",
          "effusion",
          "dalton",
          "atm",
          "kpa",
          "torr"
        ],
        bonding: [
          "bond",
          "bonding",
          "covalent",
          "ionic",
          "electronegativity",
          "lewis",
          "vsepr",
          "hybridization",
          "molecular geometry",
          "polarity",
          "intermolecular",
          "hydrogen bond"
        ],
        reactions: [
          "reaction",
          "equation",
          "balancing",
          "oxidation",
          "reduction",
          "redox",
          "equilibrium",
          "rate law",
          "catalyst",
          "enthalpy",
          "entropy",
          "gibbs",
          "thermochemistry",
          "precipitate"
        ],
        acids: [
          "acid",
          "base",
          "ph",
          "pka",
          "buffer",
          "titration",
          "neutralization",
          "ka",
          "kb"
        ],
        atomic: [
          "atom",
          "atomic",
          "electron",
          "orbital",
          "quantum number",
          "periodic table",
          "isotope",
          "nuclear",
          "radioactive",
          "ionization"
        ],
        organic: [
          "organic",
          "alkane",
          "alkene",
          "alkyne",
          "functional group",
          "isomer",
          "benzene",
          "nomenclature",
          "iupac",
          "stereochemistry",
          "chirality",
          "alcohol",
          "carboxylic"
        ],
        polymers: [
          "polymer",
          "teflon",
          "ptfe",
          "plastic",
          "monomer",
          "polyethylene",
          "nylon",
          "pvc",
          "polystyrene",
          "elastomer",
          "resin"
        ],
        lab: [
          "lab",
          "laboratory",
          "experiment",
          "safety",
          "apparatus",
          "burette",
          "pipette",
          "spectroscopy",
          "chromatography",
          "calorimetry",
          "yield"
        ]
      }
    },
    biology: {
      label: "Biology",
      clusters: {
        cells: ["cell", "organelle", "mitochondria", "membrane", "osmosis", "diffusion", "mitosis", "meiosis"],
        genetics: ["dna", "rna", "gene", "genetics", "allele", "punnett", "transcription", "translation", "mutation", "crispr"],
        physiology: ["heart", "neuron", "hormone", "kidney", "digestion", "immune", "circulation", "respiration", "homeostasis"],
        ecology: ["ecosystem", "food web", "population", "biodiversity", "carbon cycle", "succession", "biome"],
        evolution: ["evolution", "natural selection", "speciation", "adaptation", "phylogeny", "fossil"],
        microbiology: ["bacteria", "virus", "pathogen", "antibiotic", "microbiome", "fungi"]
      }
    },
    physics: {
      label: "Physics",
      clusters: {
        mechanics: ["force", "newton", "acceleration", "momentum", "friction", "incline", "projectile", "tension"],
        energy: ["energy", "work", "power", "kinetic", "potential", "conservation", "joule", "efficiency"],
        electricity: ["circuit", "voltage", "current", "resistance", "ohm", "capacitor", "kirchhoff", "magnetic field"],
        waves: ["wave", "frequency", "wavelength", "sound", "doppler", "refraction", "interference", "optics", "lens"],
        thermo: ["thermodynamics", "heat", "temperature", "entropy", "carnot", "ideal gas law"],
        modern_physics: ["quantum", "photon", "relativity", "nuclear", "photoelectric", "standard model"]
      }
    },
    math: {
      label: "Math",
      clusters: {
        algebra: ["equation", "linear", "quadratic", "polynomial", "factor", "inequality", "slope", "function"],
        calculus: ["derivative", "integral", "limit", "chain rule", "series", "differential", "gradient"],
        geometry: ["triangle", "circle", "angle", "theorem", "area", "volume", "coordinate", "trigonometry", "sine", "cosine"],
        statistics: ["probability", "mean", "median", "deviation", "distribution", "regression", "hypothesis", "p-value"],
        discrete: ["matrix", "vector", "graph", "combinatorics", "permutation", "modular", "proof"]
      }
    },
    cs: {
      label: "Computer science",
      clusters: {
        programming: ["variable", "loop", "function", "recursion", "class", "pointer", "javascript", "python", "java", "compiler"],
        algorithms: ["algorithm", "complexity", "sorting", "search", "dynamic programming", "graph traversal", "big o", "binary tree"],
        systems: ["operating system", "memory", "process", "thread", "kernel", "cache", "concurrency", "deadlock"],
        networks: ["network", "tcp", "http", "dns", "packet", "socket", "routing", "protocol"],
        data: ["database", "sql", "normalization", "index", "transaction", "query", "schema"],
        ai: ["machine learning", "neural network", "training", "gradient descent", "model", "dataset", "classification"]
      }
    },
    history: {
      label: "History",
      clusters: {
        ancient: ["rome", "greece", "egypt", "mesopotamia", "empire", "republic", "pharaoh"],
        earlymodern: ["renaissance", "reformation", "colonial", "absolutism", "exploration", "printing press"],
        modern: ["revolution", "industrial", "nationalism", "imperialism", "world war", "cold war", "treaty"],
        revolutions: ["french revolution", "american revolution", "independence", "constitution", "suffrage"],
        historiography: ["primary source", "secondary source", "historiography", "archive", "revisionist"]
      }
    },
    economics: {
      label: "Economics",
      clusters: {
        micro: ["demand", "supply", "elasticity", "market", "monopoly", "utility", "equilibrium price"],
        macro: ["inflation", "gdp", "unemployment", "interest rate", "fiscal", "monetary", "recession"],
        trade: ["trade", "tariff", "comparative advantage", "exchange rate", "globalization"],
        finance: ["investment", "bond", "stock", "portfolio", "risk", "compound interest"]
      }
    },
    literature: {
      label: "Literature",
      clusters: {
        poetry: ["poem", "poetry", "sonnet", "meter", "rhyme", "stanza", "metaphor"],
        novel: ["novel", "narrator", "chapter", "character", "plot", "theme", "fiction", "protagonist"],
        drama: ["play", "shakespeare", "tragedy", "act", "scene", "soliloquy"],
        analysis: ["essay", "thesis", "citation", "analysis", "criticism", "symbolism"]
      }
    }
  };
  var SUBJECT_WORDS = {
    chemistry: ["chemistry", "chemical", "chem"],
    biology: ["biology", "biological", "bio"],
    physics: ["physics", "physical science"],
    math: ["math", "maths", "mathematics", "algebra", "calculus", "geometry", "statistics"],
    cs: ["computer science", "programming", "coding", "software"],
    history: ["history", "historical"],
    economics: ["economics", "economy", "econ"],
    literature: ["literature", "english class", "literary"]
  };
  function detectSubject(text) {
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
  function detectCluster(subjectId, text) {
    const subject = SUBJECTS[subjectId];
    if (!subject) return null;
    const haystack = ` ${String(text || "").toLowerCase()} `;
    let best = null;
    for (const [clusterId, terms] of Object.entries(subject.clusters)) {
      let score = 0;
      const hits = [];
      for (const term of terms) {
        const pattern = term.includes(" ") ? haystack.includes(` ${term} `) : new RegExp(`\\b${term}\\b`).test(haystack);
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
  var DISTRACTION_DOMAINS = [
    "youtube.com",
    "instagram.com",
    "tiktok.com",
    "x.com",
    "twitter.com",
    "facebook.com",
    "reddit.com",
    "netflix.com",
    "twitch.tv",
    "discord.com",
    "snapchat.com",
    "pinterest.com",
    "primevideo.com",
    "disneyplus.com",
    "hulu.com",
    "spotify.com",
    "steampowered.com",
    "roblox.com",
    "9gag.com",
    "tumblr.com",
    "threads.net",
    "bilibili.com"
  ];
  var REFERENCE_DOMAINS = [
    "khanacademy.org",
    "chem.libretexts.org",
    "openstax.org",
    "wikipedia.org",
    "britannica.com",
    "coursera.org",
    "edx.org",
    "ocw.mit.edu",
    "arxiv.org",
    "scholar.google.com",
    "jstor.org",
    "desmos.com",
    "wolframalpha.com",
    "quizlet.com",
    "docs.google.com",
    "notion.so",
    "overleaf.com",
    "github.com",
    "stackoverflow.com"
  ];
  function matchDomain(host, list) {
    if (!host) return false;
    const clean = String(host).toLowerCase().replace(/^www\./, "");
    return list.some((domain) => {
      const d = String(domain || "").toLowerCase().replace(/^www\./, "").trim();
      if (!d) return false;
      return clean === d || clean.endsWith(`.${d}`);
    });
  }

  // src/lib/text.js
  var STOPWORDS = /* @__PURE__ */ new Set([
    "a",
    "about",
    "after",
    "again",
    "against",
    "all",
    "also",
    "am",
    "an",
    "and",
    "any",
    "are",
    "aren't",
    "as",
    "at",
    "be",
    "because",
    "been",
    "before",
    "being",
    "below",
    "between",
    "both",
    "but",
    "by",
    "can",
    "can't",
    "cannot",
    "could",
    "couldn't",
    "did",
    "didn't",
    "do",
    "does",
    "doesn't",
    "doing",
    "don't",
    "down",
    "during",
    "each",
    "few",
    "for",
    "from",
    "further",
    "had",
    "hadn't",
    "has",
    "hasn't",
    "have",
    "haven't",
    "having",
    "he",
    "her",
    "here",
    "hers",
    "herself",
    "him",
    "himself",
    "his",
    "how",
    "i",
    "if",
    "in",
    "into",
    "is",
    "isn't",
    "it",
    "it's",
    "its",
    "itself",
    "just",
    "me",
    "more",
    "most",
    "my",
    "myself",
    "no",
    "nor",
    "not",
    "now",
    "of",
    "off",
    "on",
    "once",
    "only",
    "or",
    "other",
    "ought",
    "our",
    "ours",
    "ourselves",
    "out",
    "over",
    "own",
    "same",
    "shan't",
    "she",
    "should",
    "shouldn't",
    "so",
    "some",
    "such",
    "than",
    "that",
    "that's",
    "the",
    "their",
    "theirs",
    "them",
    "themselves",
    "then",
    "there",
    "these",
    "they",
    "this",
    "those",
    "through",
    "to",
    "too",
    "under",
    "until",
    "up",
    "very",
    "was",
    "wasn't",
    "we",
    "were",
    "weren't",
    "what",
    "when",
    "where",
    "which",
    "while",
    "who",
    "whom",
    "why",
    "will",
    "with",
    "won't",
    "would",
    "wouldn't",
    "you",
    "your",
    "yours",
    "yourself",
    "yourselves",
    "need",
    "want",
    "get",
    "make",
    "use",
    "using",
    "video",
    "watch",
    "watching",
    "youtube",
    "page",
    "site",
    "today",
    "tonight",
    "tomorrow",
    "assignment",
    "homework",
    "study",
    "studying",
    "learn",
    "learning",
    "explain",
    "explained",
    "explains",
    "help",
    "please",
    "really",
    "thing",
    "things",
    "part",
    "parts",
    "week",
    "day",
    "time",
    "like",
    "best",
    "good",
    "new"
  ]);
  function stem(word) {
    let w = word;
    if (w.length > 4 && w.endsWith("ies")) w = `${w.slice(0, -3)}y`;
    else if (w.length > 4 && w.endsWith("ses")) w = w.slice(0, -2);
    else if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) w = w.slice(0, -1);
    if (w.length > 6 && w.endsWith("ing")) w = w.slice(0, -3);
    else if (w.length > 5 && w.endsWith("ed")) w = w.slice(0, -2);
    return w;
  }
  function normalizeText(input) {
    return String(input || "").toLowerCase().replace(/[\u2018\u2019]/g, "'").replace(/[^a-z0-9'\s-]/g, " ").replace(/\s+/g, " ").trim();
  }
  function keywords(input) {
    const words = normalizeText(input).split(" ").filter(Boolean);
    const out = [];
    for (const raw of words) {
      if (raw.length < 2) continue;
      if (STOPWORDS.has(raw)) continue;
      const folded = stem(raw);
      if (STOPWORDS.has(folded)) continue;
      if (!out.includes(folded)) out.push(folded);
    }
    return out;
  }
  function taskPhrases(task) {
    const cleaned = String(task || "").replace(/\[[^\]]*\]/g, " ").replace(/\((?:due|p\.?|page)[^)]*\)/gi, " ").replace(/\s+/g, " ").trim();
    if (!cleaned) return [];
    const parts = cleaned.split(/[,;:.!?/|]+|\s+(?:and|then|plus)\s+/i).map((part) => part.trim()).filter((part) => part.split(/\s+/).length >= 1 && part.length >= 3);
    return parts.slice(0, 4);
  }
  function hashString(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i += 1) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return Math.abs(h);
  }
  function pick(list, seed) {
    if (!list.length) return null;
    return list[seed % list.length];
  }
  function formatDuration(totalSeconds) {
    const minutes = Math.max(0, Math.round(Number(totalSeconds || 0) / 60));
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest ? `${hours} h ${String(rest).padStart(2, "0")} min` : `${hours} h`;
  }
  function formatClock(hour, minute = 0) {
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }
  function formatHourRange(hour) {
    const start = formatClock(hour);
    const end = formatClock((hour + 1) % 24);
    return `${start}–${end}`;
  }
  var WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  function weekdayName(index) {
    return WEEKDAYS[(index % 7 + 7) % 7];
  }
  function dateKey(date = /* @__PURE__ */ new Date()) {
    const d = new Date(date);
    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, "0"),
      String(d.getDate()).padStart(2, "0")
    ].join("-");
  }
  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }
  function percent(part, whole) {
    if (!whole) return 0;
    return clamp(Math.round(part / whole * 100), 0, 100);
  }

  // src/lib/relevance.js
  var VERDICT = {
    ON_TASK: "on-task",
    ADJACENT: "adjacent",
    OFF_TASK: "off-task",
    NEUTRAL: "neutral"
  };
  var VERDICT_LABEL = {
    "on-task": "On task",
    adjacent: "Related, off task",
    "off-task": "Off task",
    neutral: "No session"
  };
  var SUBJECT_LABELS = {
    chemistry: "chemistry",
    biology: "biology",
    physics: "physics",
    math: "math",
    cs: "computer science",
    history: "history",
    economics: "economics",
    literature: "literature"
  };
  var CLUSTER_LABELS = {
    gases: "gas laws",
    bonding: "bonding",
    reactions: "reactions",
    acids: "acids and bases",
    atomic: "atomic structure",
    organic: "organic chemistry",
    polymers: "polymers",
    lab: "lab work",
    cells: "cells",
    genetics: "genetics",
    physiology: "physiology",
    ecology: "ecology",
    evolution: "evolution",
    microbiology: "microbiology",
    mechanics: "mechanics",
    energy: "energy",
    electricity: "electricity",
    waves: "waves and optics",
    thermo: "thermodynamics",
    modern_physics: "modern physics",
    algebra: "algebra",
    calculus: "calculus",
    geometry: "geometry",
    statistics: "statistics",
    discrete: "discrete math",
    programming: "programming",
    algorithms: "algorithms",
    systems: "systems",
    networks: "networks",
    data: "data and databases",
    ai: "machine learning",
    ancient: "ancient history",
    earlymodern: "early modern history",
    modern: "modern history",
    revolutions: "revolutions",
    historiography: "historiography",
    micro: "microeconomics",
    macro: "macroeconomics",
    trade: "trade",
    finance: "finance",
    poetry: "poetry",
    novel: "the novel",
    drama: "drama",
    analysis: "close reading"
  };
  function subjectIdFromLabel(label) {
    const clean = String(label || "").trim().toLowerCase();
    if (!clean) return null;
    for (const [id, words] of Object.entries(SUBJECT_WORDS)) {
      if (id === clean) return id;
      if (words.includes(clean)) return id;
    }
    if (clean === "computer science") return "cs";
    return null;
  }
  function hostFromUrl(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    } catch {
      return "";
    }
  }
  function pathWords(url) {
    try {
      const parsed = new URL(url);
      return decodeURIComponent(parsed.pathname).replace(/[-_/]+/g, " ").replace(/\.[a-z]{2,5}$/i, " ").replace(/\s+/g, " ").trim();
    } catch {
      return "";
    }
  }
  function countPhrase(haystack, phrase) {
    if (!phrase) return 0;
    const needle = ` ${normalizeText(phrase)} `;
    if (!needle.trim()) return 0;
    return haystack.includes(needle) ? 1 : 0;
  }
  function clusterLabel(subjectId, clusterId) {
    const subject = SUBJECTS[subjectId];
    if (!subject || !clusterId) return null;
    return CLUSTER_LABELS[clusterId] || clusterId;
  }
  function surfaceFor(host, settings) {
    if (!host) return "document";
    if (host === "youtube.com" || host.endsWith(".youtube.com") || host === "youtu.be") return "youtube";
    if (matchDomain(host, settings.allowlist || [])) return "allowlisted";
    if (matchDomain(host, DISTRACTION_DOMAINS)) return "social";
    if (matchDomain(host, REFERENCE_DOMAINS)) return "reference";
    return "document";
  }
  function channelTrust(channel, settings) {
    const list = (settings.trustedChannels || []).map(
      (entry) => String(entry || "").toLowerCase().replace(/^@/, "").trim()
    ).filter(Boolean);
    if (!channel || !list.length) return false;
    const clean = String(channel).toLowerCase().replace(/^@/, "").trim();
    return list.some((entry) => clean === entry || clean.includes(entry));
  }
  function judgePage(page = {}, context = {}) {
    const settings = context.settings || {};
    const session = context.session || {};
    const host = hostFromUrl(page.url || "");
    const title = String(page.title || "").trim();
    const channel = String(page.channel || "").trim();
    const description = String(page.description || "").slice(0, 600);
    const surface = surfaceFor(host, settings);
    const base = {
      host,
      surface,
      title,
      channel,
      verdict: VERDICT.NEUTRAL,
      confidence: 0,
      score: 0,
      reasons: [],
      signals: [],
      task: session.task || "",
      subject: session.subject || "",
      suggestedAction: "none",
      coachLine: ""
    };
    if (!session.task || session.status === "ended") {
      return {
        ...base,
        reasons: ["No focus session is running, so nothing is being judged."],
        coachLine: "Start a session when you know what you are working on."
      };
    }
    if (surface === "allowlisted") {
      return {
        ...base,
        verdict: VERDICT.ON_TASK,
        confidence: 0.95,
        score: 10,
        reasons: ["This domain is on your own allowlist."],
        coachLine: "You marked this site as part of your study setup."
      };
    }
    const task = session.task;
    const phrases = taskPhrases(task);
    const taskTerms = keywords(task);
    const haystack = ` ${normalizeText([title, description, channel, pathWords(page.url)].join(" "))} `;
    const pageText = `${title} ${description} ${channel} ${pathWords(page.url)}`;
    const pageSubject = detectSubject(pageText)[0] || null;
    const sessionSubjectId = subjectIdFromLabel(session.subject);
    const taskSubject = detectSubject(task)[0] || null;
    const effectiveSubjectId = pageSubject && pageSubject.id || sessionSubjectId || taskSubject && taskSubject.id || null;
    const signals = [];
    let taskScore = 0;
    for (const phrase of phrases) {
      if (phrase.split(/\s+/).length >= 2 && countPhrase(haystack, phrase)) {
        taskScore += 3;
        signals.push({ kind: "task", weight: 3, label: `Mentions “${phrase}”` });
      }
    }
    const matchedTerms = [];
    for (const term of taskTerms) {
      if (term.length < 3) continue;
      if (haystack.includes(` ${term} `) || haystack.includes(` ${term}s `)) {
        matchedTerms.push(term);
        taskScore += 1;
      }
    }
    if (matchedTerms.length) {
      signals.push({
        kind: "task",
        weight: matchedTerms.length,
        label: `Shares ${matchedTerms.length === 1 ? "the word" : "words"} “${matchedTerms.join("”, “")}” with the task`
      });
    }
    const taskCluster = detectCluster(
      effectiveSubjectId || sessionSubjectId || pageSubject?.id,
      task
    );
    const pageCluster = effectiveSubjectId ? detectCluster(effectiveSubjectId, pageText) : null;
    let subjectMatched = false;
    if (pageSubject) {
      if (sessionSubjectId) subjectMatched = pageSubject.id === sessionSubjectId;
      else subjectMatched = true;
    } else if (sessionSubjectId) {
      const words = SUBJECT_WORDS[sessionSubjectId] || [];
      subjectMatched = words.some((word) => haystack.includes(` ${word} `));
    }
    if (subjectMatched) {
      const label = SUBJECT_LABELS[effectiveSubjectId] || "the subject";
      signals.push({ kind: "subject", weight: 1, label: `Is ${label} material` });
    }
    const trustedChannel = channelTrust(channel, settings);
    if (trustedChannel) {
      signals.push({ kind: "channel", weight: 1, label: "Channel is on your study list" });
    }
    const sameCluster = Boolean(taskCluster && pageCluster) && taskCluster.id === pageCluster.id;
    let verdict = VERDICT.NEUTRAL;
    let confidence = 0.5;
    const reasons = [];
    if (taskScore >= 3) {
      verdict = VERDICT.ON_TASK;
      confidence = 0.93;
    } else if (taskScore >= 1.5) {
      verdict = VERDICT.ON_TASK;
      confidence = 0.82;
    } else if (sameCluster && subjectMatched) {
      verdict = VERDICT.ON_TASK;
      confidence = 0.78;
      reasons.push(
        `Same part of ${SUBJECT_LABELS[effectiveSubjectId] || "the subject"}: ${clusterLabel(effectiveSubjectId, pageCluster.id)}.`
      );
    } else if (subjectMatched) {
      verdict = VERDICT.ADJACENT;
      confidence = trustedChannel ? 0.8 : 0.72;
    } else if (surface === "social" || surface === "youtube") {
      verdict = VERDICT.OFF_TASK;
      confidence = 0.86;
    } else {
      verdict = VERDICT.OFF_TASK;
      confidence = 0.58;
    }
    const taskLabel = task.length > 52 ? `${task.slice(0, 49).trim()}…` : task;
    if (verdict === VERDICT.ON_TASK && !reasons.length) {
      reasons.push(`Looks like work on “${taskLabel}”.`);
    }
    if (verdict === VERDICT.ADJACENT) {
      const pageTopic = clusterLabel(effectiveSubjectId, pageCluster?.id);
      const taskTopic = clusterLabel(effectiveSubjectId, taskCluster?.id);
      if (pageTopic && taskTopic && pageTopic !== taskTopic) {
        reasons.unshift(
          `It is ${SUBJECT_LABELS[effectiveSubjectId] || "the subject"}, but about ${pageTopic} rather than ${taskTopic}.`
        );
      } else {
        reasons.unshift(
          `It is ${SUBJECT_LABELS[effectiveSubjectId] || "subject"} material, but not “${taskLabel}”.`
        );
      }
      if (trustedChannel) reasons.push("Trusted channel, but the topic still sits beside your task.");
    }
    if (verdict === VERDICT.OFF_TASK) {
      if (surface === "social" || surface === "youtube") {
        reasons.unshift(`${host || "This page"} is not connected to “${taskLabel}”.`);
      } else {
        reasons.unshift(`No link to “${taskLabel}” in the title, address or channel.`);
      }
    }
    let coachLine = "";
    let suggestedAction = "none";
    if (verdict === VERDICT.ADJACENT) {
      coachLine = "This is the subject, not the assignment. That is exactly the turn that costs you the hour.";
      suggestedAction = "nudge";
    } else if (verdict === VERDICT.OFF_TASK) {
      coachLine = "This is not the assignment. Want the way back?";
      suggestedAction = "nudge";
    } else if (verdict === VERDICT.ON_TASK) {
      coachLine = "You are on the assignment.";
    }
    return {
      ...base,
      verdict,
      confidence,
      score: Number(taskScore.toFixed(2)),
      reasons,
      signals,
      subjectId: effectiveSubjectId,
      taskCluster: taskCluster?.id || null,
      pageCluster: pageCluster?.id || null,
      suggestedAction,
      coachLine
    };
  }
  function softBlockDecision(page, judgement, settings = {}) {
    const host = hostFromUrl(page.url || "");
    const blockedDomain = matchDomain(host, settings.blocklist || []);
    const sessionOn = judgement && judgement.verdict !== VERDICT.NEUTRAL;
    if (!sessionOn) return { block: false, delaySeconds: 0, reason: "no-session" };
    if (!blockedDomain && !settings.blockUnrelated) return { block: false, delaySeconds: 0, reason: "not-listed" };
    if (settings.strictMode && blockedDomain) {
      return { block: true, strict: true, delaySeconds: Number(settings.blockDelaySeconds ?? 8), reason: "strict-list" };
    }
    if (blockedDomain && judgement.verdict !== VERDICT.ON_TASK) {
      return {
        block: true,
        strict: false,
        delaySeconds: Number(settings.blockDelaySeconds ?? 8),
        reason: "listed-and-off-task"
      };
    }
    if (settings.blockUnrelated && judgement.verdict === VERDICT.OFF_TASK && judgement.confidence >= 0.8) {
      return {
        block: true,
        strict: false,
        delaySeconds: Number(settings.blockDelaySeconds ?? 8),
        reason: "confidently-off-task"
      };
    }
    return { block: false, delaySeconds: 0, reason: "allowed" };
  }
  function shouldNudge(judgement, settings = {}) {
    if (!judgement || !settings.nudges) return false;
    if (judgement.verdict === VERDICT.ON_TASK) return false;
    if (judgement.verdict === VERDICT.NEUTRAL) return false;
    if (judgement.verdict === VERDICT.ADJACENT) return true;
    return judgement.confidence >= 0.7;
  }

  // src/lib/habits.js
  var HABITS_VERSION = 1;
  function createHabits() {
    return { version: HABITS_VERSION, days: {}, events: [], updatedAt: null };
  }
  function emptyDay() {
    return {
      hours: Array.from({ length: 24 }, () => ({ onTask: 0, offTask: 0 })),
      domains: {},
      flagged: 0,
      sessions: 0
    };
  }
  function cloneHabits(habits) {
    return JSON.parse(JSON.stringify(habits || createHabits()));
  }
  function ensureDay(habits, date) {
    if (!habits.days[date]) habits.days[date] = emptyDay();
    const day = habits.days[date];
    if (!Array.isArray(day.hours) || day.hours.length !== 24) day.hours = emptyDay().hours;
    if (!day.domains) day.domains = {};
    return day;
  }
  function recordSlice(habits, slice = {}) {
    const next = cloneHabits(habits);
    const date = slice.date || dateKey(/* @__PURE__ */ new Date());
    const hour = clamp(Number(slice.hour ?? (/* @__PURE__ */ new Date()).getHours()), 0, 23);
    const seconds = clamp(Math.round(Number(slice.seconds) || 0), 0, 3600);
    if (!seconds) return next;
    const day = ensureDay(next, date);
    const bucket = slice.verdict === VERDICT.ON_TASK ? "onTask" : "offTask";
    day.hours[hour][bucket] += seconds;
    const domain = String(slice.domain || "unknown").replace(/^www\./, "").toLowerCase();
    if (!day.domains[domain]) {
      day.domains[domain] = { seconds: 0, onTask: 0, offTask: 0, hours: {} };
    }
    const entry = day.domains[domain];
    entry.seconds += seconds;
    entry[bucket] += seconds;
    entry.hours[hour] = (entry.hours[hour] || 0) + seconds;
    if (bucket === "offTask" && slice.verdict === VERDICT.ADJACENT) entry.adjacent = (entry.adjacent || 0) + seconds;
    if (bucket === "offTask" && slice.verdict === VERDICT.OFF_TASK) entry.drifting = (entry.drifting || 0) + seconds;
    next.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    return next;
  }
  function recordEvent(habits, event = {}, options = {}) {
    const next = cloneHabits(habits);
    const limit = options.limit ?? 400;
    const entry = {
      id: event.id || `ev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      ts: event.ts || Date.now(),
      domain: String(event.domain || "").replace(/^www\./, "").toLowerCase(),
      url: event.url || "",
      title: String(event.title || "").slice(0, 180),
      channel: event.channel || "",
      verdict: event.verdict || VERDICT.OFF_TASK,
      action: event.action || "judged",
      task: event.task || "",
      subject: event.subject || "",
      seconds: Math.round(Number(event.seconds) || 0)
    };
    next.events.push(entry);
    const day = ensureDay(next, dateKey(new Date(entry.ts)));
    if (entry.verdict === VERDICT.OFF_TASK || entry.verdict === VERDICT.ADJACENT) day.flagged += 1;
    next.events = next.events.slice(-limit);
    next.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    return next;
  }
  function eventsForDate(habits, date) {
    return (habits?.events || []).filter((event) => dateKey(new Date(event.ts)) === date);
  }
  function flaggedEvents(habits, date) {
    return eventsForDate(habits, date).filter(
      (event) => event.verdict === VERDICT.OFF_TASK || event.verdict === VERDICT.ADJACENT
    );
  }
  function summarizeDay(habits, date = dateKey(/* @__PURE__ */ new Date())) {
    const day = habits?.days?.[date];
    if (!day) {
      return {
        date,
        totalSeconds: 0,
        onTaskSeconds: 0,
        offTaskSeconds: 0,
        focusPercent: 0,
        flagged: 0,
        topDomains: [],
        focusLabel: "No time recorded"
      };
    }
    let onTaskSeconds = 0;
    let offTaskSeconds = 0;
    for (const hour of day.hours) {
      onTaskSeconds += hour.onTask;
      offTaskSeconds += hour.offTask;
    }
    const totalSeconds = onTaskSeconds + offTaskSeconds;
    const topDomains = Object.entries(day.domains).map(([domain, entry]) => ({
      domain,
      seconds: entry.seconds,
      onTask: entry.onTask || 0,
      offTask: entry.offTask || 0,
      share: percent(entry.seconds, totalSeconds)
    })).sort((a, b) => b.seconds - a.seconds).slice(0, 5);
    return {
      date,
      totalSeconds,
      onTaskSeconds,
      offTaskSeconds,
      focusPercent: percent(onTaskSeconds, totalSeconds),
      flagged: day.flagged || 0,
      topDomains,
      focusLabel: totalSeconds ? `${formatDuration(totalSeconds)} recorded` : "No time recorded"
    };
  }
  function mondayIndex(date) {
    return (new Date(date).getDay() + 6) % 7;
  }
  var WEEKDAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  var WEEKDAY_LONG = WEEKDAYS.slice(1).concat(WEEKDAYS[0]);
  function shiftDate(date, deltaDays) {
    const d = new Date(date);
    d.setDate(d.getDate() + deltaDays);
    return d;
  }
  function buildHeatmap(habits, options = {}) {
    const weeks = clamp(Number(options.weeks) || 4, 1, 12);
    const endDate = options.endDate ? new Date(options.endDate) : /* @__PURE__ */ new Date();
    const rows = Array.from({ length: 7 }, (_, index) => ({
      weekday: index,
      label: WEEKDAY_SHORT[index],
      longLabel: WEEKDAY_LONG[index],
      hours: Array.from({ length: 24 }, () => ({ drift: 0, focus: 0, days: 0 })),
      drift: 0,
      focus: 0
    }));
    for (let offset = 0; offset < weeks * 7; offset += 1) {
      const d = shiftDate(endDate, -offset);
      const key = dateKey(d);
      const day = habits?.days?.[key];
      if (!day) continue;
      const row = rows[mondayIndex(d)];
      day.hours.forEach((bucket, hour) => {
        if (!bucket.offTask && !bucket.onTask) return;
        row.hours[hour].drift += bucket.offTask;
        row.hours[hour].focus += bucket.onTask;
        row.hours[hour].days += 1;
        row.drift += bucket.offTask;
        row.focus += bucket.onTask;
      });
    }
    let max = 0;
    let maxFocus = 0;
    for (const row of rows) {
      for (const cell of row.hours) {
        cell.driftMinutes = Math.round(cell.drift / 60);
        cell.focusMinutes = Math.round(cell.focus / 60);
        if (cell.driftMinutes > max) max = cell.driftMinutes;
        if (cell.focusMinutes > maxFocus) maxFocus = cell.focusMinutes;
      }
    }
    return { weeks, rows, max, maxFocus, generatedAt: (/* @__PURE__ */ new Date()).toISOString() };
  }
  function rankWeakSpots(habits, options = {}) {
    const weeks = clamp(Number(options.weeks) || 4, 1, 12);
    const limit = options.limit ?? 3;
    const endDate = options.endDate ? new Date(options.endDate) : /* @__PURE__ */ new Date();
    const cells = /* @__PURE__ */ new Map();
    for (let offset = 0; offset < weeks * 7; offset += 1) {
      const d = shiftDate(endDate, -offset);
      const key = dateKey(d);
      const day = habits?.days?.[key];
      if (!day) continue;
      const weekday = mondayIndex(d);
      day.hours.forEach((bucket, hour) => {
        if (!bucket.offTask) return;
        const id = `${weekday}-${hour}`;
        if (!cells.has(id)) {
          cells.set(id, { weekday, hour, drift: 0, focus: 0, occurrences: 0, domains: {} });
        }
        const cell = cells.get(id);
        cell.drift += bucket.offTask;
        cell.focus += bucket.onTask;
        cell.occurrences += 1;
      });
      for (const [domain, entry] of Object.entries(day.domains || {})) {
        if (!entry.drifting && !entry.adjacent) continue;
        const byHour = entry.hours || {};
        for (const [hour, seconds] of Object.entries(byHour)) {
          const id = `${weekday}-${hour}`;
          const cell = cells.get(id);
          if (!cell) continue;
          const driftShare = entry.offTask / Math.max(1, entry.seconds) * seconds;
          cell.domains[domain] = (cell.domains[domain] || 0) + driftShare;
        }
      }
    }
    const ranked = [...cells.values()].filter((cell) => cell.drift >= 60).sort((a, b) => b.drift - a.drift).slice(0, limit).map((cell) => {
      const domains = Object.entries(cell.domains).sort((a, b) => b[1] - a[1]);
      return {
        weekday: cell.weekday,
        weekdayLabel: WEEKDAY_LONG[cell.weekday],
        hour: cell.hour,
        hourLabel: `${String(cell.hour).padStart(2, "0")}:00`,
        driftMinutes: Math.round(cell.drift / 60),
        focusMinutes: Math.round(cell.focus / 60),
        occurrences: cell.occurrences,
        topDomain: domains[0]?.[0] || null,
        driftLabel: formatDuration(cell.drift)
      };
    });
    return ranked;
  }
  function focusStreak(habits, options = {}) {
    const goalMinutes = options.goalMinutes ?? 25;
    const from = options.today ? new Date(options.today) : /* @__PURE__ */ new Date();
    let streak = 0;
    for (let offset = 0; offset < 365; offset += 1) {
      const summary = summarizeDay(habits, dateKey(shiftDate(from, -offset)));
      if (summary.onTaskSeconds >= goalMinutes * 60) streak += 1;
      else if (offset === 0) continue;
      else break;
    }
    return streak;
  }

  // src/lib/reflection.js
  var DOMAIN_NAMES = {
    "youtube.com": "YouTube",
    "instagram.com": "Instagram",
    "tiktok.com": "TikTok",
    "x.com": "X",
    "twitter.com": "X",
    "reddit.com": "Reddit",
    "netflix.com": "Netflix",
    "twitch.tv": "Twitch",
    "discord.com": "Discord"
  };
  function domainLabel(domain) {
    const clean = String(domain || "").replace(/^www\./, "");
    if (DOMAIN_NAMES[clean]) return DOMAIN_NAMES[clean];
    return clean || "that site";
  }
  function eventHour(event) {
    return new Date(event.ts).getHours();
  }
  function eventClock(event) {
    const d = new Date(event.ts);
    return formatClock(d.getHours(), d.getMinutes());
  }
  function shortTitle(event) {
    const title = String(event.title || "").replace(/\s+/g, " ").trim();
    if (!title) return domainLabel(event.domain);
    return title.length > 64 ? `${title.slice(0, 61).trim()}…` : title;
  }
  var INTENT_OPTIONS = [
    { id: "planned", label: "I decided to take a break", detail: "The timing was mine." },
    { id: "drift", label: "I drifted there", detail: "I did not decide, I just ended up there." },
    { id: "needed", label: "I thought it would help with the task", detail: "It felt related at the time." }
  ];
  var PULL_OPTIONS = [
    { id: "sidebar", label: "A recommended video", detail: "The next thing was already on screen." },
    { id: "notification", label: "A message or notification", detail: "Someone or something interrupted." },
    { id: "stuck", label: "I got stuck and left", detail: "The work stopped making sense." },
    { id: "habit", label: "It is where my hands go", detail: "No single reason, just a routine." }
  ];
  var REPAIR_OPTIONS = [
    { id: "soft-block", label: "Put a delay in front of it" },
    { id: "shorter", label: "Make the session shorter, with a real break" },
    { id: "focus-player", label: "Search for the video inside Jotty" },
    { id: "environment", label: "Move the phone or close the tab" }
  ];
  var HELPED_OPTIONS = [
    { id: "task-first", label: "I started with the task before opening anything else" },
    { id: "focus-player", label: "I used the Focus Player instead of YouTube search" },
    { id: "timer", label: "A shorter session with a fixed end" },
    { id: "quiet", label: "The room was quieter than usual" }
  ];
  function buildReflection(habits, options = {}) {
    const yesterday = options.date || dateKey(new Date(Date.now() - 864e5));
    const events = flaggedEvents(habits, yesterday);
    const seed = hashString(`jotty:${yesterday}`);
    const weekday = weekdayName((/* @__PURE__ */ new Date(`${yesterday}T12:00:00`)).getDay());
    const task = options.task || events.find((event) => event.task)?.task || "your assignment";
    const questions = [];
    if (!events.length) {
      questions.push({
        id: "q-helpful",
        kind: "helpful",
        title: "What worked",
        prompt: `No drift was recorded on ${weekday}. What made that day easier?`,
        detail: "Naming it makes it repeatable. One sentence is plenty.",
        options: HELPED_OPTIONS,
        allowText: true
      });
      return {
        date: yesterday,
        weekday,
        flaggedCount: 0,
        task,
        questions,
        intro: `On ${weekday} you stayed with what you opened. That is the whole point, so let's keep the useful part.`
      };
    }
    const ranked = [...events].sort((a, b) => b.ts - a.ts);
    const primary = ranked.find((event) => event.verdict === VERDICT.OFF_TASK) || ranked[0];
    const adjacent = events.find((event) => event.verdict === VERDICT.ADJACENT);
    const primaryHour = eventHour(primary);
    questions.push({
      id: "q-intent",
      kind: "intent",
      title: "Intention",
      prompt: `At ${eventClock(primary)} yesterday you were on ${domainLabel(primary.domain)}, with “${task}” still open. Was that a break you chose?`,
      detail: `You were watching “${shortTitle(primary)}”.`,
      options: INTENT_OPTIONS,
      allowText: true,
      eventId: primary.id
    });
    const pullPrompt = pick(
      [
        `What put ${domainLabel(primary.domain)} in front of you at ${eventClock(primary)}?`,
        `What was happening in the work right before you opened ${domainLabel(primary.domain)}?`,
        `What was the last thing you did on the assignment before ${domainLabel(primary.domain)}?`
      ],
      seed
    );
    questions.push({
      id: "q-pull",
      kind: "pull",
      title: "The moment before",
      prompt: pullPrompt,
      detail: "The trigger matters more than the site. It is the part you can change.",
      options: PULL_OPTIONS,
      allowText: true,
      eventId: primary.id
    });
    if (adjacent) {
      questions.push({
        id: "q-adjacent",
        kind: "adjacent",
        title: "The useful detour",
        prompt: `“${shortTitle(adjacent)}” was real subject material, and it still pulled you off “${task}”. When is a related video actually research?`,
        detail: "Adjacent material is the hardest thing to judge, for you and for Jotty.",
        options: [
          { id: "research", label: "I meant to research an adjacent idea" },
          { id: "escape", label: "It was the same escape with a smarter label" },
          { id: "unclear", label: "I genuinely did not notice" }
        ],
        allowText: true,
        eventId: adjacent.id
      });
    }
    const weak = rankWeakSpots(habits, { weeks: 4, limit: 1, endDate: options.now })[0];
    const windowLabel = weak ? `${weak.weekdayLabel}s around ${formatHourRange(weak.hour)}` : `${formatHourRange(primaryHour)}`;
    questions.push({
      id: "q-repair",
      kind: "repair",
      title: "Next time",
      prompt: `${windowLabel} is where this keeps happening. What should be different next time?`,
      detail: "Pick one. Jotty will set it up before the window opens.",
      options: REPAIR_OPTIONS,
      allowText: true,
      weakSpot: weak || { weekday: (/* @__PURE__ */ new Date(`${yesterday}T12:00:00`)).getDay(), hour: primaryHour }
    });
    return {
      date: yesterday,
      weekday,
      flaggedCount: events.length,
      task,
      questions,
      weakSpot: weak || null,
      intro: `${events.length} ${events.length === 1 ? "page" : "pages"} yesterday did not belong to “${task}”. Three questions, then a plan for next week.`
    };
  }
  var DRIFT_OPTIONS = /* @__PURE__ */ new Set(["drift", "sidebar", "notification", "stuck", "habit", "escape"]);
  var PLANNED_OPTIONS = /* @__PURE__ */ new Set(["planned", "research"]);
  var NEEDED_OPTIONS = /* @__PURE__ */ new Set(["needed"]);
  function evaluateReflection(reflection, answers = {}) {
    const values = Object.values(answers || {});
    let drift = 0;
    let planned = 0;
    let needed = 0;
    for (const answer of values) {
      const option = answer?.option;
      if (!option) continue;
      if (DRIFT_OPTIONS.has(option)) drift += 1;
      else if (PLANNED_OPTIONS.has(option)) planned += 1;
      else if (NEEDED_OPTIONS.has(option)) needed += 1;
    }
    const answered = values.filter((answer) => answer?.option || answer?.text).length;
    const intent = answers["q-intent"]?.option;
    let verdict = "mixed";
    if (!answered) verdict = "unanswered";
    else if (drift > planned + needed) verdict = "drift";
    else if (planned >= drift && planned > 0) verdict = "planned";
    else if (needed > drift) verdict = "needed";
    const insights = {
      drift: "You did not choose most of it. That is useful: the problem is the doorway, not your discipline.",
      planned: "Most of it was deliberate. The fix is timing and length, not guilt.",
      needed: "You went looking for help and found a feed. Jotty can send you to the video without the feed.",
      mixed: "Some of it was chosen, some of it happened to you. Keep the chosen part, remove the doorway.",
      unanswered: "Answer at least one question to get a plan for next week."
    };
    const repair = answers["q-repair"]?.option;
    const weak = reflection?.weakSpot;
    const plan = [];
    if (repair === "soft-block" || verdict === "drift") {
      plan.push({
        id: "soft-block",
        title: weak ? `Soft block ${weak.weekdayLabel} ${formatHourRange(weak.hour)}` : "Soft block the next drift window",
        detail: weak ? `Jotty holds the site behind an 8-second delay at the window where your drift repeats.` : "Jotty holds the listed site behind a short delay during focus sessions.",
        action: "settings:soft-block"
      });
    }
    if (repair === "shorter") {
      plan.push({
        id: "shorter-session",
        title: "Sessions of 40 minutes with a 10 minute break",
        detail: "A session you can finish beats one you abandon.",
        action: "settings:session-length"
      });
    }
    if (repair === "focus-player" || verdict === "needed") {
      plan.push({
        id: "focus-player",
        title: "Search inside the Focus Player next time",
        detail: "Same subject videos, no sidebar and no next-up queue.",
        action: "open:focus"
      });
    }
    if (repair === "environment") {
      plan.push({
        id: "environment",
        title: "Move the phone out of reach before the session",
        detail: "Put it in another room for the length of one session.",
        action: "manual"
      });
    }
    if (!plan.length) {
      plan.push({
        id: "start-first",
        title: "Start with ten minutes of the task",
        detail: "Open the assignment before any video. Momentum first, help second.",
        action: "manual"
      });
    }
    return {
      answered,
      drift,
      planned,
      needed,
      verdict,
      insight: insights[verdict],
      plan: plan.slice(0, 3),
      completedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }

  // src/lib/session.js
  var SESSION_STATUS = { ACTIVE: "active", PAUSED: "paused", ENDED: "ended" };
  function sanitizeTask(task) {
    return String(task || "").replace(/\s+/g, " ").trim().slice(0, 160);
  }
  function createSession(input = {}) {
    const now = input.now ? new Date(input.now) : /* @__PURE__ */ new Date();
    const minutes = Math.min(240, Math.max(5, Number(input.minutes) || 50));
    const session = {
      id: `fs_${now.getTime()}`,
      task: sanitizeTask(input.task),
      subject: String(input.subject || "Chemistry").slice(0, 40),
      deadline: input.deadline ? String(input.deadline).slice(0, 10) : "",
      taskUrl: String(input.taskUrl || "").slice(0, 2e3),
      minutes,
      startedAt: now.toISOString(),
      endsAt: new Date(now.getTime() + minutes * 6e4).toISOString(),
      status: SESSION_STATUS.ACTIVE,
      pausedAt: null,
      pausedMs: 0,
      dateKey: dateKey(now)
    };
    return session;
  }
  function remainingSeconds(session, now = /* @__PURE__ */ new Date()) {
    if (!session || session.status === SESSION_STATUS.ENDED) return 0;
    const end = new Date(session.endsAt).getTime();
    const reference = session.status === SESSION_STATUS.PAUSED && session.pausedAt ? new Date(session.pausedAt).getTime() : new Date(now).getTime();
    return Math.max(0, Math.round((end - reference) / 1e3));
  }
  function formatCountdown(totalSeconds) {
    const seconds = Math.max(0, Math.round(totalSeconds));
    const h = Math.floor(seconds / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = seconds % 60;
    if (h) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return __toCommonJS(engine_exports);
})();
