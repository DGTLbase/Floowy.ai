import tiktokLogo from "@/assets/logo-tiktok-new.png";
import metaLogo from "@/assets/logo-meta-new.png";
import googleAdsLogo from "@/assets/logo-google-ads-final.png";
import snapchatLogo from "@/assets/logo-snapchat-new.png";
import shopifyLogo from "@/assets/logo-shopify-new.png";
import amazonLogo from "@/assets/logo-amazon.png";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const PlatformsSection = () => {
  const platforms = [
    { name: "TikTok", logo: tiktokLogo },
    { name: "Meta", logo: metaLogo },
    { name: "Google Ads", logo: googleAdsLogo, larger: true },
    { name: "Snapchat", logo: snapchatLogo },
    { name: "Shopify", logo: shopifyLogo },
    { name: "Amazon", logo: amazonLogo },
  ];

  return (
    <section className="container mx-auto px-4 py-6 md:py-8 bg-gradient-card">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-header-dark mb-4">
            Create Once, Launch <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Anywhere</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground">
            Seamlessly distribute your content across all major platforms
          </p>
        </div>

        {/* Platform logos grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 justify-items-center items-center gap-4 md:gap-6 lg:gap-8">
          {platforms.map((platform, index) => (
            <div
              key={platform.name}
              className="group"
            >
              <div className="relative flex items-center justify-center w-24 h-24 md:w-32 md:h-32 p-6 bg-card rounded-2xl border border-border/50 transition-all duration-300 hover:border-primary/50 hover:shadow-glow">
                <img
                  src={platform.logo}
                  alt={`${platform.name} logo`}
                  className={`${platform.larger ? 'w-[110%] h-[110%]' : 'w-full h-full'} object-contain opacity-70 group-hover:opacity-100 transition-all duration-300`} loading="lazy" decoding="async"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PlatformsSection;
