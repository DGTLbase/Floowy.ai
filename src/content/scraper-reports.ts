// Sample Social Scraper output, rendered as HTML for the report viewer on
// /social-media-scraper.
//
// WHY THIS IS NOT A PDF EMBED
// The landing page brief is explicit: if the reports are embedded as PDFs or
// images, the text inside them is invisible to Google and to the crawlers used
// by ChatGPT, Perplexity and Claude. The reports ARE the product argument on
// this page, so their content is the most valuable text on it — it has to be
// crawlable. Extracted here as structured data and rendered as HTML.
//
// The client is anonymised as LUMORA, a glow-serum brand. Both documents are
// real Social Scraper output from a TikTok scrape of that niche, in Dutch.

export interface ReportPage {
  n: number;
  title: string;
  body: string[];
}

export interface SampleReport {
  id: string;
  name: string;
  kicker: string;
  description: string;
  meta: string;
  pages: ReportPage[];
}

const INSIGHTS_PAGES: ReportPage[] = [
  {
    n: 2,
    title: "Inhoudsopgave",
    body: [
      "01",
      "Executive summary",
      "3",
      "02",
      "Scope en methode",
      "4",
      "03",
      "Thema-analyse",
      "5",
      "04",
      "Winnende formats en patronen",
      "6",
      "05",
      "Concurrentieanalyse",
      "7",
      "06",
      "Audience insights uit comments",
      "8",
      "07",
      "Belangrijkste kansen",
      "9",
      "08",
      "Key learnings",
      "10",
      "09",
      "Aanbevolen prioriteiten",
      "11"
    ],
  },
  {
    n: 3,
    title: "Executive summary",
    body: [
      "De glow-serum niche op TikTok wordt gedragen door creators, niet door merken. Creator-",
      "video’s halen in juni gemiddeld bijna twaalf keer zoveel views als de video’s die",
      "LUMORA zelf plaatst, en het verschil zit niet in productie-kwaliteit maar in format. Publiek kijkt naar",
      "transformatie en naar uitleg, en scrollt weg bij promotie. De sterkste content combineert een",
      "zichtbaar voor-en-na met een geloofwaardige stem die uitlegt waarom het werkt.",
      "LUMORA plaatst op dit moment vooral product-demo’s en aanbiedingen, precies de twee",
      "categorieën die het laagst scoren op zowel views als kijktijd. Tegelijk staat de vraag naar het",
      "product er in de comments dik bovenop: bijna een kwart van alle reacties vraagt letterlijk waar het",
      "te koop is. De aandacht is er, de intentie is er, maar de content die LUMORA zelf maakt vangt die",
      "vraag niet op. De grootste winst zit niet in meer budget, maar in een verschuiving van promotie",
      "naar creator-led transformatie en uitleg."
    ],
  },
  {
    n: 4,
    title: "Scope en methode",
    body: [
      "Deze analyse is gebaseerd op een TikTok-scrape van de glow-serum en niacinamide niche over",
      "de periode 1 tot en met 30 juni 2026. In totaal zijn 214 video’s geanalyseerd, verspreid over 22",
      "accounts, waaronder LUMORA zelf, relevante creators en directe concurrenten. Daarnaast is een",
      "steekproef van 3.120 comments meegenomen om koopintentie, vragen en sentiment te wegen.",
      "Per video is gekeken naar views, kijktijd tot het einde, save-rate en het onderliggende content-",
      "thema. In de rest van dit rapport werken we met percentages en verhoudingen in plaats van losse",
      "aantallen, zodat de patronen los van scrape-volume te interpreteren zijn.",
      "11,7x",
      "Creator-led",
      "video’s presteren",
      "beter dan brand-led",
      "63%",
      "Gemiddelde kijktijd op",
      "voor-en-na content",
      "23%",
      "Van de comments",
      "vraagt waar te koop",
      "41%",
      "Van de comments is",
      "een open",
      "productvraag"
    ],
  },
  {
    n: 5,
    title: "Thema-analyse",
    body: [
      "De niche valt uiteen in een paar duidelijke content-thema’s, en het verschil in prestatie",
      "tussen die thema’s is groot. Voor-en-na video’s trekken veruit de meeste views en",
      "houden mensen het langst vast, met een gemiddelde kijktijd van 63% tot het einde. Ingredient-",
      "uitleg en myth-busting halen iets minder views, maar scoren juist het hoogst op saves, met een",
      "save-rate tot 4,6%. Dat is een belangrijk signaal: mensen bewaren deze video’s om er later",
      "op terug te komen, wat wijst op serieuze overweging.",
      "Aan de andere kant van het spectrum staan product-demo’s, aanbiedingen en founder-",
      "content. Deze halen een fractie van de views en verliezen het grootste deel van hun kijkers binnen",
      "de eerste seconden. Aanbiedingsvideo’s presteren het slechtst, met een kijktijd van",
      "gemiddeld 24% en een save-rate onder de 1%.",
      "CONTENT-THEMA",
      "RELATIEVE VIEWS",
      "SAVE-RATE",
      "KIJKTIJD",
      "Voor-en-na",
      "Zeer hoog",
      "2,8%",
      "63%",
      "Ingredient-uitleg",
      "Hoog",
      "4,1%",
      "58%",
      "Myth-busting",
      "Gemiddeld",
      "4,6%",
      "58%",
      "Routine / GRWM",
      "Gemiddeld",
      "2,6%",
      "54%",
      "Product-demo",
      "Laag",
      "1,0%",
      "30%",
      "Aanbieding",
      "Laag",
      "0,8%",
      "24%",
      "Kernpatroon: transformatie wint op bereik, uitleg wint op saves. De combinatie van beide,",
      "een voor-en-na met een stem die uitlegt waarom het werkt, is precies wat de best",
      "presterende video’s in de niche doen."
    ],
  },
  {
    n: 6,
    title: "Winnende formats en patronen",
    body: [
      "Onder de losse thema’s zitten een paar terugkerende formats die het consistent goed doen.",
      "Deze patronen zijn belangrijker dan losse virale uitschieters, omdat ze herhaalbaar zijn.",
      "PATROON 01",
      "Het 14-dagen of 4-weken transformatie-logboek",
      "Een creator documenteert het gebruik over een vaste periode en toont ongefilterde huid aan",
      "het eind. De best presterende video van de maand, met bijna 900.000 views en 66% kijktijd,",
      "gebruikt exact dit format. De belofte van een tijdlijn houdt mensen tot het einde.",
      "PATROON 02",
      "De sceptische ingrediënten-check",
      "Een geloofwaardige stem, vaak een derm-achtig account, leest het label en oordeelt of het",
      "product de prijs waard is. Dit format heeft de hoogste save-rate in de niche en vangt precies",
      "het prijsbezwaar op dat ook in de comments terugkomt.",
      "PATROON 03",
      "De myth-buster",
      "Korte, stellige uitleg die een misverstand rechtzet, bijvoorbeeld dat niacinamide en vitamine",
      "C niet botsen. Hoogste save-rate van alle thema’s en zeer deelbaar, omdat mensen",
      "het doorsturen als bewijsmateriaal.",
      "W A T  L U M O R A  N U  M I S T",
      "De eigen content leunt op product-demo’s en aanbiedingen, de twee formats die",
      "onderaan bungelen. Er is nog geen enkel eigen transformatie-logboek en geen enkele",
      "ingrediënten-check in creator-hand. Precies daar ligt het gat."
    ],
  },
  {
    n: 7,
    title: "Concurrentieanalyse",
    body: [
      "De directe concurrentie in de niche haalt gemiddeld ruim 240.000 views per video, ongeveer zeven",
      "keer zoveel als LUMORA. Het verschil zit niet in productwaarde maar in distributie: concurrenten",
      "laten hun content grotendeels door creators maken en dragen, terwijl LUMORA vooral vanaf het",
      "eigen kanaal zendt.",
      "Opvallend is dat concurrenten hetzelfde promotie-probleem hebben. Ook bij hen zakken de",
      "aanbiedingsvideo’s weg. Waar zij winnen is met routine- en GRWM-content waarin het",
      "product terloops voorkomt in plaats van centraal staat. Dat betekent dat er ruimte is: niemand in",
      "de niche claimt op dit moment het geloofwaardige, uitleg-gedreven transformatieverhaal",
      "volledig. Dat is het territorium waar LUMORA zich kan onderscheiden."
    ],
  },
  {
    n: 8,
    title: "Audience insights uit comments",
    body: [
      "De comments laten een publiek zien dat al voorbij de kennismaking is en klaarstaat om te kopen,",
      "mits de twijfels worden weggenomen. Bijna een kwart van alle reacties vraagt letterlijk waar het",
      "product te koop is. Dat is directe, onbeantwoorde koopintentie.",
      "Daarnaast is 41% van de comments een open productvraag. De drie die het vaakst terugkomen",
      "zijn: werkt dit ook bij een gevoelige huid, hoe lang duurt het voor je resultaat ziet, en wat zit er",
      "precies in. Deze vragen zijn geen ruis, het zijn kant-en-klare content-briefings. Elke video die één",
      "van deze vragen beantwoordt, sluit direct aan op wat het publiek al wil weten.",
      "Er is ook een kleiner maar reëel scepsis-signaal. Ongeveer 6% van de reacties vindt de voor-en-na",
      "resultaten te mooi om waar te zijn, en 9% noemt de prijs aan de hoge kant. Beide zijn te",
      "ondervangen met de ingrediënten-check en myth-buster formats die in de niche al bewezen",
      "werken.",
      "Signaal: de vraag is er al. Het publiek zoekt geen reden om geïnteresseerd te raken, het",
      "zoekt bevestiging om te kopen. Content die twijfel wegneemt is nu waardevoller dan content",
      "die aandacht trekt."
    ],
  },
  {
    n: 9,
    title: "Belangrijkste kansen",
    body: [
      "KANS 01",
      "Zet in op creator-led transformatie",
      "Brief drie tot vijf micro-creators voor een 14-dagen of 4-weken logboek met ongefilterde",
      "eindshot. Boost de best presterende video als Spark Ad. Dit format levert nu de meeste views",
      "in de hele niche en LUMORA heeft er nog geen.",
      "KANS 02",
      "Maak van elke top-comment-vraag een video",
      "Draai de drie meest gestelde vragen, gevoelige huid, tijdlijn tot resultaat en ingrediënten, om",
      "tot losse explainer-video’s. Deze content vangt de 41% open vragen op die nu",
      "onbeantwoord blijft.",
      "KANS 03",
      "Claim de ingrediënten-check",
      "Werk samen met een geloofwaardig derm-achtig account voor een label-check die het",
      "prijsbezwaar frontaal adresseert. Dit format heeft de hoogste save-rate in de niche en",
      "ondervangt zowel de prijs- als de scepsis-comments.",
      "KANS 04",
      "Stop met zenden vanaf het merkkanaal",
      "De product-demo’s en aanbiedingsvideo’s leveren structureel weinig op.",
      "Verschuif dat budget en die productietijd naar creator-partnerships en het boosten van",
      "organisch bewezen content.",
      "KANS 05",
      "Vang de koopintentie af met een duidelijke route",
      "Bij 23% expliciete waar-te-koop vragen is een consistente, zichtbare aankooproute in bio en",
      "op high-performing video’s directe omzet. Dit is laaghangend fruit dat nu blijft",
      "hangen."
    ],
  },
  {
    n: 10,
    title: "Key learnings",
    body: [
      "Het beeld over juni is helder en consistent. Creator-led content verslaat merkpromotie met grote",
      "afstand, en de best presterende formats combineren zichtbare transformatie met geloofwaardige",
      "uitleg. LUMORA maakt op dit moment precies de content die het slechtst presteert, terwijl de vraag",
      "naar het product in de comments al luid en duidelijk aanwezig is.",
      "De strategische conclusie is dat de opgave geen bekendheidsprobleem is maar een format- en",
      "distributieprobleem. Het publiek is er, de intentie is er, en de winnende formats zijn bekend. De taak",
      "voor de komende maand is om die formats in creator-hand te leggen en de eigen productie-tijd",
      "weg te halen bij content die niet werkt."
    ],
  },
  {
    n: 11,
    title: "Aanbevolen prioriteiten voor juli.",
    body: [
      "Brief drie tot vijf micro-creators voor een 14-dagen transformatie-logboek en boost de winnaar",
      "als Spark Ad.",
      "Produceer drie explainer-video’s die de meest gestelde comment-vragen",
      "beantwoorden: gevoelige huid, tijdlijn en ingrediënten.",
      "Zet één ingrediënten-check op met een geloofwaardig derm-achtig account om het",
      "prijsbezwaar te ondervangen.",
      "Pauzeer de losse product-demo’s en aanbiedingsvideo’s op het merkkanaal en",
      "verschuif die inzet naar creator-content.",
      "Maak de aankooproute zichtbaar en consistent om de 23% expliciete koopintentie in comments",
      "af te vangen.",
      "•",
      "•",
      "•",
      "•",
      "•"
    ],
  },
  {
    n: 12,
    title: "Keep on flowing.",
    body: [
      
    ],
  }
];

const PLAN_PAGES: ReportPage[] = [
  {
    n: 2,
    title: "Inhoudsopgave",
    body: [
      "01",
      "Samenvatting",
      "3",
      "02",
      "Content-pijlers",
      "4",
      "03",
      "Uitgewerkte formats",
      "5",
      "04",
      "Hookbibliotheek",
      "7",
      "05",
      "Werkschema (organic-to-boost)",
      "8",
      "06",
      "Meetplan",
      "9",
      "07",
      "Startadvies",
      "10",
      "08",
      "Aanbevolen prioriteiten",
      "11"
    ],
  },
  {
    n: 3,
    title: "Samenvatting",
    body: [
      "Dit contentplan bouwt direct op de TikTok scrape-analyse van juni. De kern van die analyse:",
      "creator-led content verslaat merkpromotie met bijna twaalf keer zoveel views, transformatie wint",
      "op bereik, uitleg wint op saves, en het publiek staat in de comments al klaar om te kopen. LUMORA",
      "maakt op dit moment vooral de formats die het slechtst presteren.",
      "De strategie voor juli is daarom een verschuiving, geen uitbreiding. We halen productie-tijd weg bij",
      "product-demo’s en aanbiedingen, en leggen die in handen van creators die transformatie",
      "en uitleg maken. Elk format in dit plan is terug te voeren op een bewezen patroon uit de scrape. De",
      "opzet is organic-to-boost: creators maken organische content, en de best presterende",
      "video’s worden geboost als Spark Ads."
    ],
  },
  {
    n: 4,
    title: "Content-pijlers",
    body: [
      "Pijler 1: Transformatie. Zichtbaar voor-en-na over een vaste tijdlijn. Dit is het format met de",
      "meeste views in de niche en het format dat LUMORA nu volledig mist.",
      "Pijler 2: Uitleg en bewijs. Ingrediënten-checks en myth-busters die twijfel wegnemen.",
      "Hoogste save-rate in de niche en direct antwoord op het prijsbezwaar en de scepsis uit de",
      "comments.",
      "Pijler 3: Vraag-en-antwoord. Losse video’s die de meest gestelde comment-vragen",
      "beantwoorden: gevoelige huid, tijdlijn tot resultaat en ingrediënten. Vangt de 41% open",
      "vragen af die nu blijft hangen."
    ],
  },
  {
    n: 5,
    title: "Uitgewerkte formats",
    body: [
      "TRANSFORMATIE",
      "Het 14-dagen glow-logboek",
      "Hook: \"Ik test dat viral glow serum 14 dagen lang, en dit is dag 1.\"",
      "Script-richting: Creator filmt kort dag 1, 4, 8 en 14 met dezelfde belichting en hoek. Sluit af",
      "met een ongefilterde close-up zonder make-up. Voice-over vertelt de eerlijke ervaring, geen",
      "script dat als reclame klinkt.",
      "CTA: \"Linkje staat in mijn bio als je het zelf wil proberen.\"",
      "Scrape-onderbouwing: Het best presterende format van juni, tot bijna 900.000 views en",
      "66% kijktijd. De tijdlijn-belofte houdt mensen tot het einde.",
      "UITLEG EN BEWIJS",
      "De eerlijke ingrediënten-check",
      "Hook: \"Is dat dure serum het echt waard? Ik las het label voor je.\"",
      "Script-richting: Geloofwaardig derm-achtig account leest de belangrijkste ingrediënten",
      "hardop en oordeelt nuchter. Toon het label in beeld. Adresseer de prijs direct in plaats van",
      "eromheen.",
      "CTA: \"Bewaar dit als je twijfelt of het bij jouw huid past.\"",
      "Scrape-onderbouwing: Ingredient-uitleg heeft de hoogste save-rate in de niche, 4,1%, en",
      "ondervangt het prijsbezwaar van 9% van de comments.",
      "UITLEG EN BEWIJS",
      "De myth-buster in 20 seconden",
      "Hook: \"Nee, niacinamide en vitamine C botsen niet. Dit is waarom.\"",
      "Script-richting: Korte, stellige uitleg recht in de camera of via voice-over met tekst in beeld.",
      "Eén misverstand, één helder antwoord, klaar.",
      "CTA: \"Stuur dit door naar iemand die dat nog gelooft.\"",
      "Scrape-onderbouwing: Myth-busting heeft de allerhoogste save-rate, 4,6%, en is het meest",
      "deelbare thema omdat mensen het als bewijs doorsturen."
    ],
  },
  {
    n: 6,
    title: "VRAAG-EN-ANTWOORD",
    body: [
      "Werkt dit bij een gevoelige huid?",
      "Hook: \"Als je een gevoelige huid hebt, kijk dit even voordat je dit serum koopt.\"",
      "Script-richting: Eerlijk antwoord op de meest gestelde vraag uit de comments. Benoem",
      "voor wie het wel en niet geschikt is. Geen overbelofte.",
      "CTA: \"Vraag in de comments als je twijfelt over jouw huidtype.\"",
      "Scrape-onderbouwing: Gevoelige huid is de meest gestelde open vraag in de comments,",
      "18% van alle reacties.",
      "VRAAG-EN-ANTWOORD",
      "Hoe snel zie je resultaat?",
      "Hook: \"Dit is wanneer je écht verschil gaat zien, geen marketingpraat.\"",
      "Script-richting: Realistische tijdlijn per week, gekoppeld aan beelden. Onderbouw waarom,",
      "verwijs terug naar het transformatie-logboek.",
      "CTA: \"Volg voor de volledige 4-weken update.\"",
      "Scrape-onderbouwing: Tijdlijn tot resultaat is de op één na meest gestelde vraag in de",
      "comments, 15%.",
      "TEST-HYPOTHESE",
      "De split-screen: merkkanaal versus creator",
      "Hook: \"Zelfde serum, twee mensen, één eerlijk oordeel.\"",
      "Script-richting: Twee creators gebruiken het product parallel en vergelijken. Dit is nog geen",
      "bewezen patroon in de scrape, dus we draaien het als test-hypothese en meten hard",
      "voordat we opschalen.",
      "CTA: \"Wie van de twee overtuigt jou? Zeg het in de comments.\"",
      "Scrape-onderbouwing: Test-hypothese, niet gebaseerd op een bestaand patroon. Bewust",
      "als experiment opgenomen."
    ],
  },
  {
    n: 7,
    title: "Hookbibliotheek",
    body: [
      "Direct bruikbare openingszinnen, gegroepeerd per pijler. Bedoeld om letterlijk in de eerste twee",
      "seconden te gebruiken.",
      "T R A N S F O R M A T I E",
      "1. \"Ik test dat viral glow serum 14 dagen lang, en dit is dag 1.\"",
      "2. \"Mijn huid na 4 weken, geen make-up, geen filter.\"",
      "3. \"Ik geloofde het niet tot week 3.\"",
      "4. \"Van rode wangen naar rustige huid, dit is wat ik deed.\"",
      "U I T L E G  E N  B E W I J S",
      "5. \"Is dat dure serum het echt waard? Ik las het label voor je.\"",
      "6. \"Nee, niacinamide en vitamine C botsen niet.\"",
      "7. \"Waarom niacinamide je poriën echt kleiner laat lijken.\"",
      "8. \"Stop met dit fout te doen in je routine.\"",
      "V R A A G - E N - A N T W O O R D",
      "9. \"Als je een gevoelige huid hebt, kijk dit even eerst.\"",
      "10. \"Dit is wanneer je écht verschil gaat zien.\"",
      "11. \"Wat zit er nou echt in dit serum?\"",
      "12. \"De vraag die ik het vaakst krijg, en het eerlijke antwoord.\""
    ],
  },
  {
    n: 8,
    title: "Werkschema (organic-to-boost)",
    body: [
      "Het standaard werkschema voor deze organische content is organic-to-boost. We produceren",
      "niet meteen voor advertenties, maar laten de markt eerst kiezen welke content werkt.",
      "Stap 1, brief. Selecteer drie tot vijf micro-creators die geloofwaardig zijn in de skincare-niche. Brief",
      "ze op de pijlers, niet op een strak script. Geef ze de hooks als richtlijn, geen verplichte tekst.",
      "Stap 2, organisch plaatsen. Creators plaatsen de content organisch op hun eigen kanaal. Zo krijgt",
      "het de creator-led context die in de scrape bijna twaalf keer beter presteert dan merkcontent.",
      "Stap 3, meten. Laat de content een week lopen. Kijk naar kijktijd, saves en koopintentie in de",
      "comments, niet alleen naar views.",
      "Stap 4, boosten. Boost alleen de video’s die organisch bewijzen dat ze werken, als Spark",
      "Ads. Zo betaal je nooit voor content waarvan de markt nog niet heeft laten zien dat die aanslaat.",
      "Regel: nooit budget op content zetten die organisch niet heeft gepresteerd. De scrape laat",
      "zien dat merk-gestuurde promotie structureel wegzakt, dus de markt kiest eerst, het budget",
      "volgt."
    ],
  },
  {
    n: 9,
    title: "Meetplan",
    body: [
      "We sturen op signalen die voorspellen of een format echt werkt, niet op ijdele cijfers. Views alleen",
      "zeggen weinig, de combinatie van kijktijd en saves zegt veel meer over intentie.",
      "SIGNAAL",
      "WAT HET AANGEEFT",
      "ACTIE",
      "Kijktijd boven 55%",
      "Hook en format houden vast",
      "Kandidaat om te boosten",
      "Save-rate boven 3%",
      "Serieuze overweging",
      "Meer van dit thema maken",
      "Koopintentie in comments",
      "Directe vraag naar product",
      "Aankooproute versterken",
      "Kijktijd onder 30%",
      "Format slaat niet aan",
      "Stoppen, niet boosten",
      "Concreet: een video die na een week boven 55% kijktijd én boven 3% saves zit, gaat de boost in.",
      "Een video die onder 30% kijktijd blijft, stoppen we, hoeveel views die ook heeft."
    ],
  },
  {
    n: 10,
    title: "Startadvies",
    body: [
      "Concrete eerste stappen voor de komende week. Klein beginnen, snel meten, dan pas opschalen.",
      "Selecteer en brief deze week drie micro-creators voor het 14-dagen glow-logboek.",
      "Plan één ingrediënten-check in met een geloofwaardig derm-achtig account.",
      "Draai de drie meest gestelde comment-vragen om tot drie korte explainer-video’s.",
      "Pauzeer de losse product-demo’s en aanbiedingsvideo’s op het merkkanaal.",
      "Zet de aankooproute in bio zichtbaar en consistent, klaar om de koopintentie af te vangen.",
      "1.",
      "2.",
      "3.",
      "4.",
      "5."
    ],
  },
  {
    n: 11,
    title: "Aanbevolen prioriteiten voor augustus.",
    body: [
      "Schaal het transformatie-logboek op met de creators die in juli het best presteerden en boost",
      "de winnaars als Spark Ads.",
      "Bouw een vaste maandelijkse ingrediënten-check uit tot terugkerend format, gezien de hoge",
      "save-rate.",
      "Maak van de meest gestelde comment-vragen een doorlopende vraag-en-antwoord serie.",
      "Test het split-screen concept af en meet hard voordat er budget op gaat.",
      "Houd de eigen merkcontent beperkt tot ondersteuning van creator-content, niet als",
      "hoofdkanaal.",
      "•",
      "•",
      "•",
      "•",
      "•"
    ],
  },
  {
    n: 12,
    title: "Keep on flowing.",
    body: [
      
    ],
  }
];

export const SAMPLE_REPORTS: SampleReport[] = [
  {
    id: "insights",
    name: "Inzichtenrapport",
    kicker: "THE SCRAPER REPORT",
    description:
      "What 214 videos in the glow-serum niche reveal about the content that converts, and where the brand is leaving views on the table.",
    meta: "12 pages · 214 videos · 3,120 comments",
    pages: INSIGHTS_PAGES,
  },
  {
    id: "plan",
    name: "Contentplan",
    kicker: "THE CONTENT PLAN",
    description:
      "The same scrape turned into pillars, formats, a hook library and a week-by-week production schedule.",
    meta: "12 pages · formats, hooks and schedule",
    pages: PLAN_PAGES,
  },
];
