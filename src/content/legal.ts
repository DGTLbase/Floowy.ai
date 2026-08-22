/**
 * Single source of truth for the legal pages (privacy policy + terms).
 *
 * Pure data + a framework-agnostic HTML serializer — NO React/JSX — so it can be
 * consumed by both the React pages (src/components/LegalPage.tsx) AND the
 * build-time prerender plugin (scripts/prerender-plugin.ts). The prerender uses
 * legalToHtml() to inject the full policy text into the static HTML, so Google's
 * OAuth Trust & Safety crawler (which doesn't run JS) reads a complete policy.
 *
 * Paragraph/list `html` strings are trusted, hand-authored content.
 */

export type LegalBlock =
  | { type: "p"; html: string }
  | { type: "ul"; items: string[] };

export interface LegalSection {
  heading: string;
  blocks: LegalBlock[];
}

export interface LegalDoc {
  path: string;
  title: string;
  version: string;
  sections: LegalSection[];
  footer: string;
}

const LINK = (href: string, text: string, ext = true) =>
  `<a href="${href}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ""} class="text-primary hover:underline">${text}</a>`;
const MAIL = (addr: string) => `<a href="mailto:${addr}" class="text-primary hover:underline">${addr}</a>`;

export const privacyPolicy: LegalDoc = {
  path: "/privacy-policy",
  title: "Privacy Policy",
  version: "Version November 2025",
  footer: "© 2025 Floowy AI B.V. – All rights reserved.",
  sections: [
    {
      heading: "About Our Privacy Policy",
      blocks: [
        { type: "p", html: "Floowy.ai respects your privacy and values the protection of your personal data. This Privacy Policy explains how Floowy AI B.V., acting under the trade name Floowy.ai, handles personal information collected through our website and related platforms." },
        { type: "p", html: "Floowy.ai only collects data necessary to deliver and improve its services. Personal data is treated confidentially and never shared with third parties without your explicit consent. No personal information about your website visit is stored other than anonymous analytics data used to improve performance, which you can disable at any time through your browser settings." },
        { type: "p", html: `For more information on data protection, please visit the website of the Dutch Data Protection Authority: ${LINK("https://autoriteitpersoonsgegevens.nl/nl", "https://autoriteitpersoonsgegevens.nl/nl")}` },
        { type: "p", html: "Until you accept the use of cookies and other tracking systems, no non-anonymised analytical or tracking cookies will be placed on your device. By continuing to use this website, you agree to this Privacy Policy. The current version applies until replaced by a new version published on our website." },
      ],
    },
    {
      heading: "1. Collection of Information",
      blocks: [
        { type: "p", html: "Your data is collected by Floowy.ai and, where applicable, its external processors. \"Personal data\" refers to all information relating to an identified or identifiable natural person such as a name, identification number, IP address, location data, or any factor specific to one's physical, physiological, genetic, mental, economic, cultural, or social identity." },
        { type: "p", html: "Personal data collected on the website is primarily used to maintain contact with you and, where applicable, to process orders or service requests." },
      ],
    },
    {
      heading: "2. Your Rights",
      blocks: [
        { type: "p", html: "Under Article 13(2)(b) of the GDPR, every individual has the right to:" },
        { type: "ul", items: ["Access their personal data", "Rectify or delete their data", "Restrict or object to processing", "Request data portability"] },
        { type: "p", html: `You can exercise these rights by contacting us at: ${MAIL("hello@floowy.ai")}<br />Please include a copy of valid identification (with signature and contact address visible).` },
      ],
    },
    {
      heading: "3. Processing of Personal Data",
      blocks: [
        { type: "p", html: "In the event of a legal investigation or regulatory request, Floowy.ai may be required to share collected data with authorities following a formal and justified request. Once disclosed, such data is no longer protected by this Privacy Policy. If certain data are required to access specific website functions, Floowy.ai will clearly indicate this at the time of collection." },
      ],
    },
    {
      heading: "4. Commercial Communication",
      blocks: [
        { type: "p", html: `You may receive commercial messages from Floowy.ai. If you no longer wish to receive them, you can opt out at any time by emailing ${MAIL("hello@floowy.ai")}. If you encounter personal data of others while visiting our website, you must refrain from collecting, using, or sharing it in any unauthorised manner. Floowy.ai bears no responsibility for such actions.` },
      ],
    },
    {
      heading: "5. Data Retention",
      blocks: [
        { type: "p", html: "Collected data will be stored only for as long as required by law or necessary for the purposes described in this policy." },
      ],
    },
    {
      heading: "6. Cookies",
      blocks: [
        { type: "p", html: "Cookies are small text files placed on your device that allow us to improve your browsing experience. They help websites remember preferences such as language, region, or login details, and allow us to analyse website performance." },
        { type: "p", html: "When you visit our website for the first time, you will see a cookie banner explaining our use of cookies. By continuing to browse, you consent to their use. Your consent remains valid for 13 months unless withdrawn earlier." },
      ],
    },
    {
      heading: "7. How We Use Cookies",
      blocks: [
        { type: "p", html: "We use cookies, web beacons, tracking pixels, and similar technologies to optimise user experience and tailor our services." },
        { type: "p", html: "Cookies are used to:" },
        { type: "ul", items: ["Enable essential website functions", "Authenticate users and prevent fraud", "Improve website performance and personalise content", "Support remarketing and analytical purposes"] },
        { type: "p", html: "You have the right to refuse, disable, or delete cookies at any time. However, disabling them may affect the functionality of certain features or sections of the website." },
      ],
    },
    {
      heading: "8. Types of Cookies We Use",
      blocks: [
        { type: "ul", items: [
          "<strong>Functional cookies</strong> – remember user preferences and login sessions.",
          "<strong>Anonymous analytical cookies</strong> – collect aggregated visitor statistics to improve our site.",
          "<strong>Non-anonymous analytical cookies</strong> – measure engagement and site performance for optimisation.",
          "<strong>Tracking cookies</strong> – display relevant advertisements and personalise user experience.",
        ] },
        { type: "p", html: "All cookies used by Floowy.ai are safe and do not store sensitive data such as passwords or payment details." },
      ],
    },
    {
      heading: "9. Other Tracking Technologies",
      blocks: [
        { type: "p", html: "In addition to cookies, we may use web beacons and pixel tags to measure user interactions on our website and emails. These tools collect limited information such as cookie ID, timestamps, and viewed pages, purely for statistical purposes. Web beacons cannot be disabled individually, but you can limit their activity by controlling cookies in your browser." },
      ],
    },
    {
      heading: "10. Website Analytics",
      blocks: [
        { type: "p", html: `Floowy.ai uses Google Analytics to measure website usage and visitor behaviour. Google may use this information to create anonymised advertising profiles. You can opt out by installing the Google Analytics Opt-Out Browser Add-on: ${LINK("https://tools.google.com/dlpage/gaoptout", "https://tools.google.com/dlpage/gaoptout")}` },
        { type: "p", html: "You may also delete cookies manually through your browser settings. Floowy.ai is not responsible for the republication of website content by unauthorised third parties." },
      ],
    },
    {
      heading: "11. Complaints",
      blocks: [
        { type: "p", html: `If you have concerns regarding the processing of your personal data, please contact us first at ${MAIL("hello@floowy.ai")}. If we cannot resolve your issue, you have the right to file a complaint with the Dutch Data Protection Authority (Autoriteit Persoonsgegevens).` },
      ],
    },
    {
      heading: "12. Contact",
      blocks: [
        { type: "p", html: `For questions about your data or this Privacy Policy, please contact our Data Protection Officer at: ${MAIL("hello@floowy.ai")}` },
      ],
    },
  ],
};

const termDefs: string[] = [
  "<strong>Agreement:</strong> The agreement between Floowy.ai and the Client regarding the provision of Services.",
  "<strong>Annex:</strong> Appendix to these Conditions containing specific provisions related to the Services provided.",
  "<strong>Client:</strong> The natural person or legal entity that has entered into, or intends to enter into, an Agreement with Floowy.ai.",
  "<strong>Conditions:</strong> These general terms and conditions of Floowy.ai, including all applicable Annexes.",
  "<strong>Credit(s):</strong> A prepaid, non-refundable unit purchased by the Client that entitles the Client to use certain features or functionalities of the Service(s), as further specified on the Floowy.ai platform or in the applicable Agreement.",
  "<strong>Floowy.ai:</strong> Contracted party — Floowy AI B.V., acting under the trade name Floowy.ai, including its group companies that have declared these Conditions applicable.",
  "<strong>IP Rights:</strong> All intellectual property rights, including but not limited to copyrights, trade marks, patents, design rights, trade names, database rights, and know-how.",
  "<strong>Parties:</strong> Floowy.ai and the Client.",
  "<strong>Personal Data:</strong> Any information relating to an identified or identifiable natural person, as defined in Article 4(1) of the GDPR.",
  "<strong>Service(s):</strong> The services provided by Floowy.ai under the Agreement, including all deliverables or results thereof.",
];

export const termsConditions: LegalDoc = {
  path: "/terms-conditions",
  title: "Terms & Conditions",
  version: "Version July 2026",
  footer: "© 2025 Floowy AI B.V. – All rights reserved.",
  sections: [
    {
      heading: "1. Definitions",
      blocks: [
        { type: "p", html: "1.1. The following capitalised terms used in these Terms and Conditions (\"Conditions\") shall have the meanings given below:" },
        ...termDefs.map((d): LegalBlock => ({ type: "p", html: d })),
      ],
    },
    {
      heading: "2. General",
      blocks: [
        { type: "p", html: "2.1. These Conditions form part of all offers, quotations, Agreements, and related legal acts between Floowy.ai and the Client. If specific provisions in an Annex conflict with these general Conditions, the provisions in the Annex shall prevail." },
        { type: "p", html: "2.2. Written communication includes email. Electronic communication is considered received on the day it is sent, unless proven otherwise." },
        { type: "p", html: "2.3. Deviations from these Conditions are valid only if agreed in writing and apply solely to the specific Agreement for which they were made." },
        { type: "p", html: "2.4. The Client's general terms or purchase conditions are expressly excluded." },
        { type: "p", html: "2.5. Once these Conditions apply to an Agreement, they shall automatically apply to all future Agreements between Floowy.ai and the Client." },
        { type: "p", html: "2.6. If any provision is found invalid or unenforceable, the remaining provisions remain in full force. The Parties shall replace the invalid clause with one that closely reflects the original intent." },
        { type: "p", html: "2.7. In case of conflict between the Agreement and these Conditions, the Agreement shall prevail." },
        { type: "p", html: "2.8. Floowy.ai may amend these Conditions. Clients will be informed in writing." },
        { type: "p", html: "2.9. Articles 7:404, 7:407(2), and 7:409 of the Dutch Civil Code are excluded." },
      ],
    },
    {
      heading: "3. Quotations and Formation of Agreement",
      blocks: [
        { type: "p", html: "3.1. Quotations and offers from Floowy.ai are non-binding and considered invitations to enter into an Agreement, unless stated otherwise in writing." },
        { type: "p", html: "3.2. Offers and quotations expire four (4) weeks after issuance, unless stated otherwise." },
        { type: "p", html: "3.3. The Client warrants that all data provided to Floowy.ai for the purpose of an offer are accurate and complete." },
        { type: "p", html: "3.4. An Agreement is established upon written confirmation by the Client of an offer or quotation made by Floowy.ai." },
        { type: "p", html: "3.5. Assignments by the Client are irrevocable." },
        { type: "p", html: "3.6. Floowy.ai reserves the right to terminate negotiations without obligation to compensate for any damages." },
      ],
    },
    {
      heading: "4. Execution and Delivery",
      blocks: [
        { type: "p", html: "4.1. Floowy.ai shall perform the Agreement with due care and according to professional standards. Obligations are deemed best-effort unless explicitly agreed otherwise." },
        { type: "p", html: "4.2. Delivery times are indicative and not strict deadlines. Delays do not entitle the Client to compensation." },
        { type: "p", html: "4.3. If the Agreement is executed in phases, Floowy.ai may postpone subsequent phases until prior results are approved in writing." },
        { type: "p", html: "4.4. Floowy.ai may engage third parties for the performance of its obligations." },
        { type: "p", html: "4.5. Services are considered accepted unless the Client notifies Floowy.ai in writing within five (5) working days after delivery, detailing why acceptance is withheld." },
      ],
    },
    {
      heading: "5. Prices and Payment Terms",
      blocks: [
        { type: "p", html: "5.1. All prices exclude VAT and other levies." },
        { type: "p", html: "5.2. Services not listed in the quotation are not included in the Agreement." },
        { type: "p", html: "5.3. Floowy.ai may issue interim or advance invoices. Payment must be made within fourteen (14) days of the invoice date, without deduction or set-off." },
        { type: "p", html: "5.4. Late payment incurs statutory commercial interest and collection costs." },
        { type: "p", html: "5.5. Floowy.ai may withhold Services if payment obligations are not met." },
        { type: "p", html: "5.6. Prices may be indexed annually in line with the CBS consumer price index plus a maximum of 25%." },
        { type: "p", html: "5.7. The Client may purchase Credits for use within the Service(s). The applicable price, package size, and validity of Credits are as stated on the Floowy.ai platform at the time of purchase." },
        { type: "p", html: "5.8. Credits are prepaid and, once purchased, are final and non-refundable. This applies regardless of whether the Credits have been used, partially used, or remain unused, and regardless of the reason for non-use, including but not limited to termination of the Agreement, suspension of the Client's account, or discontinued use of the Service(s) by the Client." },
        { type: "p", html: "5.9. Credits have no monetary value outside the Floowy.ai platform, cannot be exchanged for cash, and cannot be transferred to third parties or to another Client account, unless explicitly agreed in writing by Floowy.ai." },
        { type: "p", html: "5.10. Credits are subject to the validity period (if any) stated at the time of purchase. Credits that are not used within this period expire automatically and without compensation." },
        { type: "p", html: "5.11. Floowy.ai reserves the right to correct, adjust, or revoke Credits in the event of a technical error, fraud, or abuse of the Service(s), without the Client being entitled to compensation." },
        { type: "p", html: "5.12. Article 5.8 does not affect any mandatory statutory rights of the Client that cannot be excluded under applicable law." },
      ],
    },
    {
      heading: "6. Client Obligations",
      blocks: [
        { type: "p", html: "6.1. The Client shall provide all necessary data and cooperate fully. Floowy.ai shall not be liable for damages resulting from inaccurate or incomplete information." },
        { type: "p", html: "6.2. Delays caused by the Client's failure to provide information may result in suspension of Services and additional costs." },
        { type: "p", html: "6.3. Usernames or passwords provided by Floowy.ai must be kept confidential. The Client is responsible for misuse unless caused by Floowy.ai's intent or gross negligence." },
      ],
    },
    {
      heading: "7. Termination",
      blocks: [
        { type: "p", html: "7.1. Agreements are entered into for an indefinite period unless explicitly agreed otherwise." },
        { type: "p", html: "7.2. Agreements for a fixed term automatically convert into indefinite agreements unless terminated with one (1) month's notice." },
        { type: "p", html: "7.3. Indefinite agreements may be terminated with two (2) months' notice." },
        { type: "p", html: "7.4. Floowy.ai may terminate immediately if the Client becomes insolvent or ceases operations." },
        { type: "p", html: "7.5. Upon termination, the Client must cease all use of the Services." },
      ],
    },
    {
      heading: "8. Intellectual Property",
      blocks: [
        { type: "p", html: "8.1. All IP Rights in the Services or deliverables remain with Floowy.ai and/or its licensors." },
        { type: "p", html: "8.2. The Client receives a non-exclusive, non-transferable right to use the Services as agreed." },
        { type: "p", html: "8.3. Floowy.ai retains the right to use the results of Services for self-promotion." },
      ],
    },
    {
      heading: "9. Privacy and Data Protection",
      blocks: [
        { type: "p", html: "9.1. Where Floowy.ai processes Personal Data on behalf of the Client, Floowy.ai acts as a \"processor\" and the Client as the \"controller\" under GDPR." },
        { type: "p", html: "9.2. Floowy.ai shall take appropriate technical and organisational measures to protect Personal Data." },
        { type: "p", html: "9.3. The Client indemnifies Floowy.ai against claims relating to unlawful data processing unless caused by Floowy.ai's negligence." },
      ],
    },
    {
      heading: "10. Confidentiality",
      blocks: [
        { type: "p", html: "10.1. Both Parties must treat all confidential information as strictly confidential during the Agreement and for five (5) years after termination." },
        { type: "p", html: "10.2. Disclosure is only permitted if required by law or with prior written consent." },
      ],
    },
    {
      heading: "11. Liability",
      blocks: [
        { type: "p", html: "11.1. Except in cases of wilful misconduct or gross negligence, Floowy.ai's total liability is limited to direct damages up to 50% of the annual Agreement value or €250,000, whichever is lower." },
        { type: "p", html: "11.2. Floowy.ai is not liable for indirect damages, including loss of profits or data." },
        { type: "p", html: "11.3. Any claims must be reported within thirty (30) days of discovery." },
      ],
    },
    {
      heading: "12. Force Majeure",
      blocks: [
        { type: "p", html: "12.1. Neither Party shall be liable for failure to perform due to force majeure, including but not limited to natural disasters, internet failures, or government restrictions." },
        { type: "p", html: "12.2. If force majeure lasts over 30 days, either Party may terminate the Agreement." },
      ],
    },
    {
      heading: "13. Applicable Law and Disputes",
      blocks: [
        { type: "p", html: "13.1. These Conditions and all related Agreements are governed exclusively by Dutch law." },
        { type: "p", html: "13.2. Disputes shall be submitted to the competent court in Amsterdam or Rotterdam." },
      ],
    },
  ],
};

export const legalDocs: Record<string, LegalDoc> = {
  "/privacy-policy": privacyPolicy,
  "/terms-conditions": termsConditions,
};

/** Framework-agnostic semantic HTML for crawlers (used by the prerender plugin). */
export function legalToHtml(doc: LegalDoc): string {
  const sections = doc.sections
    .map((s) => {
      const blocks = s.blocks
        .map((b) =>
          b.type === "p"
            ? `<p>${b.html}</p>`
            : `<ul>${b.items.map((i) => `<li>${i}</li>`).join("")}</ul>`,
        )
        .join("");
      return `<section><h2>${s.heading}</h2>${blocks}</section>`;
    })
    .join("");
  return `<main class="legal-static"><h1>${doc.title}</h1><p>${doc.version}</p>${sections}<p>${doc.footer}</p></main>`;
}
