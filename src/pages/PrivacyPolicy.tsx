import { useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const PrivacyPolicy = () => {
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
              Privacy Policy
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
            
            {/* About Section */}
            <div className="mb-12 animate-fade-in">
              <h2 className="text-3xl font-bold mb-4 text-foreground">About Our Privacy Policy</h2>
              <p className="text-muted-foreground mb-4">
                Floowy.ai respects your privacy and values the protection of your personal data. This Privacy Policy explains how Floowy AI B.V., acting under the trade name Floowy.ai, handles personal information collected through our website and related platforms.
              </p>
              <p className="text-muted-foreground mb-4">
                Floowy.ai only collects data necessary to deliver and improve its services. Personal data is treated confidentially and never shared with third parties without your explicit consent. No personal information about your website visit is stored other than anonymous analytics data used to improve performance, which you can disable at any time through your browser settings.
              </p>
              <p className="text-muted-foreground mb-4">
                For more information on data protection, please visit the website of the Dutch Data Protection Authority:{" "}
                <a href="https://autoriteitpersoonsgegevens.nl/nl" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  https://autoriteitpersoonsgegevens.nl/nl
                </a>
              </p>
              <p className="text-muted-foreground">
                Until you accept the use of cookies and other tracking systems, no non-anonymised analytical or tracking cookies will be placed on your device. By continuing to use this website, you agree to this Privacy Policy. The current version applies until replaced by a new version published on our website.
              </p>
            </div>

            {/* Section 1 */}
            <div className="mb-12 animate-fade-in">
              <h2 className="text-3xl font-bold mb-4 text-foreground">1. Collection of Information</h2>
              <p className="text-muted-foreground mb-4">
                Your data is collected by Floowy.ai and, where applicable, its external processors. "Personal data" refers to all information relating to an identified or identifiable natural person such as a name, identification number, IP address, location data, or any factor specific to one's physical, physiological, genetic, mental, economic, cultural, or social identity.
              </p>
              <p className="text-muted-foreground">
                Personal data collected on the website is primarily used to maintain contact with you and, where applicable, to process orders or service requests.
              </p>
            </div>

            {/* Section 2 */}
            <div className="mb-12 animate-fade-in">
              <h2 className="text-3xl font-bold mb-4 text-foreground">2. Your Rights</h2>
              <p className="text-muted-foreground mb-4">
                Under Article 13(2)(b) of the GDPR, every individual has the right to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
                <li>Access their personal data</li>
                <li>Rectify or delete their data</li>
                <li>Restrict or object to processing</li>
                <li>Request data portability</li>
              </ul>
              <p className="text-muted-foreground">
                You can exercise these rights by contacting us at:{" "}
                <a href="mailto:hello@floowy.ai" className="text-primary hover:underline">
                  hello@floowy.ai
                </a>
                <br />
                Please include a copy of valid identification (with signature and contact address visible).
              </p>
            </div>

            {/* Section 3 */}
            <div className="mb-12 animate-fade-in">
              <h2 className="text-3xl font-bold mb-4 text-foreground">3. Processing of Personal Data</h2>
              <p className="text-muted-foreground">
                In the event of a legal investigation or regulatory request, Floowy.ai may be required to share collected data with authorities following a formal and justified request. Once disclosed, such data is no longer protected by this Privacy Policy. If certain data are required to access specific website functions, Floowy.ai will clearly indicate this at the time of collection.
              </p>
            </div>

            {/* Section 4 */}
            <div className="mb-12 animate-fade-in">
              <h2 className="text-3xl font-bold mb-4 text-foreground">4. Commercial Communication</h2>
              <p className="text-muted-foreground">
                You may receive commercial messages from Floowy.ai. If you no longer wish to receive them, you can opt out at any time by emailing{" "}
                <a href="mailto:hello@floowy.ai" className="text-primary hover:underline">
                  hello@floowy.ai
                </a>
                . If you encounter personal data of others while visiting our website, you must refrain from collecting, using, or sharing it in any unauthorised manner. Floowy.ai bears no responsibility for such actions.
              </p>
            </div>

            {/* Section 5 */}
            <div className="mb-12 animate-fade-in">
              <h2 className="text-3xl font-bold mb-4 text-foreground">5. Data Retention</h2>
              <p className="text-muted-foreground">
                Collected data will be stored only for as long as required by law or necessary for the purposes described in this policy.
              </p>
            </div>

            {/* Section 6 */}
            <div className="mb-12 animate-fade-in">
              <h2 className="text-3xl font-bold mb-4 text-foreground">6. Cookies</h2>
              <p className="text-muted-foreground mb-4">
                Cookies are small text files placed on your device that allow us to improve your browsing experience. They help websites remember preferences such as language, region, or login details, and allow us to analyse website performance.
              </p>
              <p className="text-muted-foreground">
                When you visit our website for the first time, you will see a cookie banner explaining our use of cookies. By continuing to browse, you consent to their use. Your consent remains valid for 13 months unless withdrawn earlier.
              </p>
            </div>

            {/* Section 7 */}
            <div className="mb-12 animate-fade-in">
              <h2 className="text-3xl font-bold mb-4 text-foreground">7. How We Use Cookies</h2>
              <p className="text-muted-foreground mb-4">
                We use cookies, web beacons, tracking pixels, and similar technologies to optimise user experience and tailor our services.
              </p>
              <p className="text-muted-foreground mb-4">
                Cookies are used to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
                <li>Enable essential website functions</li>
                <li>Authenticate users and prevent fraud</li>
                <li>Improve website performance and personalise content</li>
                <li>Support remarketing and analytical purposes</li>
              </ul>
              <p className="text-muted-foreground">
                You have the right to refuse, disable, or delete cookies at any time. However, disabling them may affect the functionality of certain features or sections of the website.
              </p>
            </div>

            {/* Section 8 */}
            <div className="mb-12 animate-fade-in">
              <h2 className="text-3xl font-bold mb-4 text-foreground">8. Types of Cookies We Use</h2>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
                <li><strong>Functional cookies</strong> – remember user preferences and login sessions.</li>
                <li><strong>Anonymous analytical cookies</strong> – collect aggregated visitor statistics to improve our site.</li>
                <li><strong>Non-anonymous analytical cookies</strong> – measure engagement and site performance for optimisation.</li>
                <li><strong>Tracking cookies</strong> – display relevant advertisements and personalise user experience.</li>
              </ul>
              <p className="text-muted-foreground">
                All cookies used by Floowy.ai are safe and do not store sensitive data such as passwords or payment details.
              </p>
            </div>

            {/* Section 9 */}
            <div className="mb-12 animate-fade-in">
              <h2 className="text-3xl font-bold mb-4 text-foreground">9. Other Tracking Technologies</h2>
              <p className="text-muted-foreground">
                In addition to cookies, we may use web beacons and pixel tags to measure user interactions on our website and emails. These tools collect limited information such as cookie ID, timestamps, and viewed pages, purely for statistical purposes. Web beacons cannot be disabled individually, but you can limit their activity by controlling cookies in your browser.
              </p>
            </div>

            {/* Section 10 */}
            <div className="mb-12 animate-fade-in">
              <h2 className="text-3xl font-bold mb-4 text-foreground">10. Website Analytics</h2>
              <p className="text-muted-foreground mb-4">
                Floowy.ai uses Google Analytics to measure website usage and visitor behaviour. Google may use this information to create anonymised advertising profiles. You can opt out by installing the Google Analytics Opt-Out Browser Add-on:{" "}
                <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  https://tools.google.com/dlpage/gaoptout
                </a>
              </p>
              <p className="text-muted-foreground">
                You may also delete cookies manually through your browser settings. Floowy.ai is not responsible for the republication of website content by unauthorised third parties.
              </p>
            </div>

            {/* Section 11 */}
            <div className="mb-12 animate-fade-in">
              <h2 className="text-3xl font-bold mb-4 text-foreground">11. Complaints</h2>
              <p className="text-muted-foreground">
                If you have concerns regarding the processing of your personal data, please contact us first at{" "}
                <a href="mailto:hello@flowy.ai" className="text-primary hover:underline">
                  hello@flowy.ai
                </a>
                . If we cannot resolve your issue, you have the right to file a complaint with the Dutch Data Protection Authority (Autoriteit Persoonsgegevens).
              </p>
            </div>

            {/* Section 12 */}
            <div className="mb-12 animate-fade-in">
              <h2 className="text-3xl font-bold mb-4 text-foreground">12. Contact</h2>
              <p className="text-muted-foreground">
                For questions about your data or this Privacy Policy, please contact our Data Protection Officer at:{" "}
                <a href="mailto:hello@flowy.ai" className="text-primary hover:underline">
                  hello@flowy.ai
                </a>
              </p>
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

export default PrivacyPolicy;