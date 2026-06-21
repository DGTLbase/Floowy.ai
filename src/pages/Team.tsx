import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PlatformsSection from "@/components/PlatformsSection";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useScrollAnimationInit } from "@/hooks/useScrollAnimationInit";
import teamDesmond from "@/assets/team-desmond-new.png";
import teamKarim from "@/assets/team-karim-new.png";
import teamDonny from "@/assets/team-donny-new.png";
import { Linkedin } from "lucide-react";
import { useState, useEffect } from "react";
import PageMeta from "@/components/PageMeta";

import IndustriesHighlightSection from "@/components/IndustriesHighlightSection";
const Team = () => {
  useScrollAnimationInit();
  const navigate = useNavigate();
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  const teamMembers = [
    {
      name: "Desmond Boateng",
      role: "Head of Partnerships",
      image: teamDesmond,
      bio: "Desmond builds meaningful partnerships that help Floowy.ai grow together with its clients. With a strong background in digital strategy and business development, he focuses on creating collaborations that deliver real impact and long-term value.",
      linkedin: "https://www.linkedin.com/in/desmond-boateng/"
    },
    {
      name: "Karim Oudejans",
      role: "Head of Operations",
      image: teamKarim,
      bio: "Karim makes sure everything runs smoothly behind the scenes. His strength lies in turning complex ideas into clear and efficient processes. With years of experience in project management and operations, he helps Floowy.ai stay organised, agile and ready to scale.",
      linkedin: "https://www.linkedin.com/in/karim-oudejans/"
    },
    {
      name: "Donny Eelzak",
      role: "AI Automation Strategist",
      image: teamDonny,
      bio: "Donny bridges creativity and technology. He focuses on designing smart AI automation strategies that help brands create better content in less time. With his deep understanding of AI tools and marketing dynamics, he ensures every solution is both intelligent and practical.",
      linkedin: "https://www.linkedin.com/in/donny-eelzak/"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCardIndex(idx => (idx + 1) % teamMembers.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [teamMembers.length]);

  const getCardPosition = (cardIndex: number) => {
    const diff = (cardIndex - currentCardIndex + teamMembers.length) % teamMembers.length;
    if (diff === 0) return 'center';
    if (diff === 1) return 'right';
    return 'left';
  };

  return (
    <div className="min-h-screen bg-background">
      <PageMeta 
        title="Meet the Floowy team building next generation AI content | Floowy"
        description="Meet the people behind Floowy who design the AI tools used to create modern marketing content. A team focused on speed, quality and creativity."
        keywords="Floowy team, AI content team, marketing AI experts, creative AI team"
        canonicalUrl="https://floowy.ai/team"
        breadcrumbs={[
          { name: "Home", url: "https://floowy.ai" },
          { name: "Team", url: "https://floowy.ai/team" }
        ]}
      />
      <Navigation />

      {/* Hero Section */}
      <section className="pt-20 pb-10 md:pt-24 md:pb-12">
        <div className="container mx-auto px-4 -mt-[30px]">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-header-dark mb-6">
              Meet The <span className="text-primary">Team</span> Behind Floowy.ai
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              At Floowy.ai, we believe that innovation and creativity go hand in hand. Behind our platform is a team of passionate marketers and problem solvers who share one mission: to make AI-powered marketing simple, effective and accessible for everyone.
            </p>
            <p className="text-lg text-foreground/80 leading-relaxed">
              Together we bring more than 15 years of experience in digital marketing, partnerships and AI automation. What connects us is our shared drive to help brands grow with smarter content, better strategy and more sustainable ways of working.
            </p>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="bg-muted/30">
        <div className="container mx-auto px-4 py-0">
          <div className="max-w-6xl mx-auto my-0">
            <h2 className="text-3xl md:text-5xl font-bold text-center text-header-dark mb-2">
              The Experts Behind The <span className="text-primary">Brand</span>
            </h2>

            {/* Team Carousel */}
            <div className="relative mx-auto h-[420px] w-full max-w-6xl pt-[30px] mb-0">
              <div className="relative h-full flex items-center justify-center">
                {teamMembers.map((member, idx) => {
                  const position = getCardPosition(idx);
                  return (
                    <div
                      key={idx}
                      className={`absolute transition-all duration-700 ease-in-out cursor-pointer ${
                        position === 'center'
                          ? 'z-30 scale-[0.7] opacity-100 translate-x-0 -translate-y-4'
                          : position === 'left'
                          ? 'z-10 scale-[0.6] opacity-100 -translate-x-[220px]'
                          : 'z-10 scale-[0.6] opacity-100 translate-x-[220px]'
                      }`}
                      style={{ width: '380px' }}
                      onClick={() => setCurrentCardIndex(idx)}
                    >
                      {/* Card Image */}
                      <div className={`rounded-2xl overflow-hidden shadow-glow border-4 transition-all duration-700 ease-in-out ${
                        position === 'center' ? 'border-primary' : 'border-border/50 grayscale'
                      }`}>
                        <div className="aspect-[3/4]">
                          <img 
                            src={member.image}
                            alt={member.name}
                            className="w-full h-full object-cover" loading="lazy" decoding="async"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Text Content - Separate Container */}
            <div className="relative mx-auto max-w-2xl mt-[10px] text-center min-h-[260px]">
              {teamMembers.map((member, idx) => (
                <div
                  key={idx}
                  className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                    currentCardIndex === idx
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-4 pointer-events-none'
                  }`}
                >
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    {member.name}
                  </h3>
                  <p className="text-base font-semibold text-primary mb-4">
                    {member.role}
                  </p>
                  <p className="text-sm text-foreground/70 leading-relaxed mb-4 max-w-md mx-auto">
                    {member.bio}
                  </p>
                  <a 
                    href={member.linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                  >
                    <Linkedin className="w-4 h-4" />
                    Connect on LinkedIn
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <PlatformsSection />

      <IndustriesHighlightSection />

      {/* CTA Section */}
      <section className="py-12 md:py-16 bg-primary mt-[30px]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-6">
            Make your content in seconds.
          </h2>
          <p className="text-xl text-primary-foreground/95 mb-8 max-w-2xl mx-auto">
            Watch how fast AI makes content people can't scroll past.
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('/auth')}
            className="w-full sm:w-auto text-lg px-8 py-6 bg-background text-primary hover:bg-background/95 rounded-full font-semibold shadow-glow"
          >
            Create Your First Ad
          </Button>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Team;
