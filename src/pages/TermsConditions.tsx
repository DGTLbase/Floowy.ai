import { useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const TermsConditions = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Terms & Conditions
            </h1>
            <p className="text-xl text-muted-foreground">
              Version November 2025
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="prose prose-lg max-w-none">
            
            {/* Section 1 - Definitions */}
            <div className="mb-12 animate-fade-in">
              <h2 className="text-3xl font-bold mb-4 text-foreground">1. Definitions</h2>
              <p className="text-muted-foreground mb-4">
                1.1. The following capitalised terms used in these Terms and Conditions ("Conditions") shall have the meanings given below:
              </p>
              <div className="space-y-4 text-muted-foreground">
                <p><strong>Agreement:</strong> The agreement between Floowy.ai and the Client regarding the provision of Services.</p>
                <p><strong>Annex:</strong> Appendix to these Conditions containing specific provisions related to the Services provided.</p>
                <p><strong>Client:</strong> The natural person or legal entity that has entered into, or intends to enter into, an Agreement with Floowy.ai.</p>
                <p><strong>Conditions:</strong> These general terms and conditions of Floowy.ai, including all applicable Annexes.</p>
                <p><strong>Floowy.ai:</strong> Contracted party — Floowy AI B.V., acting under the trade name Floowy.ai, including its group companies that have declared these Conditions applicable.</p>
                <p><strong>IP Rights:</strong> All intellectual property rights, including but not limited to copyrights, trade marks, patents, design rights, trade names, database rights, and know-how.</p>
                <p><strong>Parties:</strong> Floowy.ai and the Client.</p>
                <p><strong>Personal Data:</strong> Any information relating to an identified or identifiable natural person, as defined in Article 4(1) of the GDPR.</p>
                <p><strong>Service(s):</strong> The services provided by Floowy.ai under the Agreement, including all deliverables or results thereof.</p>
              </div>
            </div>

            {/* Section 2 - General */}
            <div className="mb-12 animate-fade-in">
              <h2 className="text-3xl font-bold mb-4 text-foreground">2. General</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>2.1. These Conditions form part of all offers, quotations, Agreements, and related legal acts between Floowy.ai and the Client. If specific provisions in an Annex conflict with these general Conditions, the provisions in the Annex shall prevail.</p>
                <p>2.2. Written communication includes email. Electronic communication is considered received on the day it is sent, unless proven otherwise.</p>
                <p>2.3. Deviations from these Conditions are valid only if agreed in writing and apply solely to the specific Agreement for which they were made.</p>
                <p>2.4. The Client's general terms or purchase conditions are expressly excluded.</p>
                <p>2.5. Once these Conditions apply to an Agreement, they shall automatically apply to all future Agreements between Floowy.ai and the Client.</p>
                <p>2.6. If any provision is found invalid or unenforceable, the remaining provisions remain in full force. The Parties shall replace the invalid clause with one that closely reflects the original intent.</p>
                <p>2.7. In case of conflict between the Agreement and these Conditions, the Agreement shall prevail.</p>
                <p>2.8. Floowy.ai may amend these Conditions. Clients will be informed in writing.</p>
                <p>2.9. Articles 7:404, 7:407(2), and 7:409 of the Dutch Civil Code are excluded.</p>
              </div>
            </div>

            {/* Section 3 - Quotations */}
            <div className="mb-12 animate-fade-in">
              <h2 className="text-3xl font-bold mb-4 text-foreground">3. Quotations and Formation of Agreement</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>3.1. Quotations and offers from Floowy.ai are non-binding and considered invitations to enter into an Agreement, unless stated otherwise in writing.</p>
                <p>3.2. Offers and quotations expire four (4) weeks after issuance, unless stated otherwise.</p>
                <p>3.3. The Client warrants that all data provided to Floowy.ai for the purpose of an offer are accurate and complete.</p>
                <p>3.4. An Agreement is established upon written confirmation by the Client of an offer or quotation made by Floowy.ai.</p>
                <p>3.5. Assignments by the Client are irrevocable.</p>
                <p>3.6. Floowy.ai reserves the right to terminate negotiations without obligation to compensate for any damages.</p>
              </div>
            </div>

            {/* Section 4 - Execution */}
            <div className="mb-12 animate-fade-in">
              <h2 className="text-3xl font-bold mb-4 text-foreground">4. Execution and Delivery</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>4.1. Floowy.ai shall perform the Agreement with due care and according to professional standards. Obligations are deemed best-effort unless explicitly agreed otherwise.</p>
                <p>4.2. Delivery times are indicative and not strict deadlines. Delays do not entitle the Client to compensation.</p>
                <p>4.3. If the Agreement is executed in phases, Floowy.ai may postpone subsequent phases until prior results are approved in writing.</p>
                <p>4.4. Floowy.ai may engage third parties for the performance of its obligations.</p>
                <p>4.5. Services are considered accepted unless the Client notifies Floowy.ai in writing within five (5) working days after delivery, detailing why acceptance is withheld.</p>
              </div>
            </div>

            {/* Section 5 - Prices */}
            <div className="mb-12 animate-fade-in">
              <h2 className="text-3xl font-bold mb-4 text-foreground">5. Prices and Payment Terms</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>5.1. All prices exclude VAT and other levies.</p>
                <p>5.2. Services not listed in the quotation are not included in the Agreement.</p>
                <p>5.3. Floowy.ai may issue interim or advance invoices. Payment must be made within fourteen (14) days of the invoice date, without deduction or set-off.</p>
                <p>5.4. Late payment incurs statutory commercial interest and collection costs.</p>
                <p>5.5. Floowy.ai may withhold Services if payment obligations are not met.</p>
                <p>5.6. Prices may be indexed annually in line with the CBS consumer price index plus a maximum of 25%.</p>
              </div>
            </div>

            {/* Section 6 - Client Obligations */}
            <div className="mb-12 animate-fade-in">
              <h2 className="text-3xl font-bold mb-4 text-foreground">6. Client Obligations</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>6.1. The Client shall provide all necessary data and cooperate fully. Floowy.ai shall not be liable for damages resulting from inaccurate or incomplete information.</p>
                <p>6.2. Delays caused by the Client's failure to provide information may result in suspension of Services and additional costs.</p>
                <p>6.3. Usernames or passwords provided by Floowy.ai must be kept confidential. The Client is responsible for misuse unless caused by Floowy.ai's intent or gross negligence.</p>
              </div>
            </div>

            {/* Section 7 - Termination */}
            <div className="mb-12 animate-fade-in">
              <h2 className="text-3xl font-bold mb-4 text-foreground">7. Termination</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>7.1. Agreements are entered into for an indefinite period unless explicitly agreed otherwise.</p>
                <p>7.2. Agreements for a fixed term automatically convert into indefinite agreements unless terminated with one (1) month's notice.</p>
                <p>7.3. Indefinite agreements may be terminated with two (2) months' notice.</p>
                <p>7.4. Floowy.ai may terminate immediately if the Client becomes insolvent or ceases operations.</p>
                <p>7.5. Upon termination, the Client must cease all use of the Services.</p>
              </div>
            </div>

            {/* Section 8 - IP */}
            <div className="mb-12 animate-fade-in">
              <h2 className="text-3xl font-bold mb-4 text-foreground">8. Intellectual Property</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>8.1. All IP Rights in the Services or deliverables remain with Floowy.ai and/or its licensors.</p>
                <p>8.2. The Client receives a non-exclusive, non-transferable right to use the Services as agreed.</p>
                <p>8.3. Floowy.ai retains the right to use the results of Services for self-promotion.</p>
              </div>
            </div>

            {/* Section 9 - Privacy */}
            <div className="mb-12 animate-fade-in">
              <h2 className="text-3xl font-bold mb-4 text-foreground">9. Privacy and Data Protection</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>9.1. Where Floowy.ai processes Personal Data on behalf of the Client, Floowy.ai acts as a "processor" and the Client as the "controller" under GDPR.</p>
                <p>9.2. Floowy.ai shall take appropriate technical and organisational measures to protect Personal Data.</p>
                <p>9.3. The Client indemnifies Floowy.ai against claims relating to unlawful data processing unless caused by Floowy.ai's negligence.</p>
              </div>
            </div>

            {/* Section 10 - Confidentiality */}
            <div className="mb-12 animate-fade-in">
              <h2 className="text-3xl font-bold mb-4 text-foreground">10. Confidentiality</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>10.1. Both Parties must treat all confidential information as strictly confidential during the Agreement and for five (5) years after termination.</p>
                <p>10.2. Disclosure is only permitted if required by law or with prior written consent.</p>
              </div>
            </div>

            {/* Section 11 - Liability */}
            <div className="mb-12 animate-fade-in">
              <h2 className="text-3xl font-bold mb-4 text-foreground">11. Liability</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>11.1. Except in cases of wilful misconduct or gross negligence, Floowy.ai's total liability is limited to direct damages up to 50% of the annual Agreement value or €250,000, whichever is lower.</p>
                <p>11.2. Floowy.ai is not liable for indirect damages, including loss of profits or data.</p>
                <p>11.3. Any claims must be reported within thirty (30) days of discovery.</p>
              </div>
            </div>

            {/* Section 12 - Force Majeure */}
            <div className="mb-12 animate-fade-in">
              <h2 className="text-3xl font-bold mb-4 text-foreground">12. Force Majeure</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>12.1. Neither Party shall be liable for failure to perform due to force majeure, including but not limited to natural disasters, internet failures, or government restrictions.</p>
                <p>12.2. If force majeure lasts over 30 days, either Party may terminate the Agreement.</p>
              </div>
            </div>

            {/* Section 13 - Law */}
            <div className="mb-12 animate-fade-in">
              <h2 className="text-3xl font-bold mb-4 text-foreground">13. Applicable Law and Disputes</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>13.1. These Conditions and all related Agreements are governed exclusively by Dutch law.</p>
                <p>13.2. Disputes shall be submitted to the competent court in Amsterdam or Rotterdam.</p>
              </div>
            </div>

            {/* Footer Note */}
            <div className="mt-16 pt-8 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">
                © 2025 Floowy AI B.V. – All rights reserved.
              </p>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TermsConditions;