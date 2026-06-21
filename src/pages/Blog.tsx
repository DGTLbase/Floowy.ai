import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar, Search } from "lucide-react";
import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PlatformsSection from "@/components/PlatformsSection";
import PageMeta from "@/components/PageMeta";
import { supabase } from "@/integrations/supabase/client";
import IndustriesHighlightSection from "@/components/IndustriesHighlightSection";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type BlogPostItem = {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  category: string;
  link: string;
};

const Blog = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [dynamicPosts, setDynamicPosts] = useState<BlogPostItem[]>([]);
  const postsPerPage = 6;

  const categories = ["All", "Visual Marketing", "Fashion Technology", "AI Technology", "Marketing Strategy"];

  useEffect(() => {
    fetchDynamicPosts();
  }, []);

  const fetchDynamicPosts = async () => {
    try {
      const { data } = await supabase
        .from("blog_posts")
        .select("id, slug, title, title_highlight, excerpt, category, cover_image_url, published_at")
        .eq("is_published", true)
        .order("published_at", { ascending: false });

      if (data) {
        const mapped: BlogPostItem[] = data.map((p: any) => ({
          id: p.id,
          title: `${p.title}${p.title_highlight ? ` ${p.title_highlight}` : ""}`,
          excerpt: p.excerpt,
          image: p.cover_image_url,
          date: p.published_at
            ? new Date(p.published_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
            : "",
          category: p.category,
          link: `/blog/${p.slug}`,
        }));
        setDynamicPosts(mapped);
      }
    } catch (error) {
      console.error("Error fetching blog posts:", error);
    }
  };

  const allPosts = dynamicPosts;

  const filteredPosts = allPosts.filter(post => {
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const endIndex = startIndex + postsPerPage;
  const currentPosts = filteredPosts.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      <PageMeta 
        title="AI content creation blog for modern marketing teams | Floowy"
        description="Read the AI content creation blog to learn how brands use AI for marketing visuals. Get insights on photoshoots, concepts and creative workflows."
        keywords="AI content creation blog, marketing blog, AI marketing insights, content creation tips"
        canonicalUrl="https://floowy.ai/blog"
        breadcrumbs={[
          { name: "Home", url: "https://floowy.ai" },
          { name: "Blog", url: "https://floowy.ai/blog" }
        ]}
      />
      <Navigation />

      {/* Blog Header & Filters */}
      <section className="pt-8 md:pt-10 pb-4 md:pb-5 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-8">
              <span className="text-header-dark">All</span> <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Articles</span>
            </h1>
            
            {/* Category Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-8">
              {/* Category Pills */}
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedCategory === category
                        ? "bg-foreground text-background"
                        : "bg-card text-foreground hover:bg-muted border border-border"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search blogs..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 bg-card"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="pt-8 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {currentPosts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentPosts.map((post) => (
                  <Link to={post.link} key={post.id}>
                    <Card className="overflow-hidden border-border/50 hover:shadow-glow transition-all hover:-translate-y-1 h-full">
                      <div className="aspect-[4/3] overflow-hidden">
                        <img 
                          src={post.image} 
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" loading="lazy" decoding="async"
                        />
                      </div>
                      <CardContent className="p-6">
                        <div className="text-xs text-muted-foreground mb-3">
                          {post.date}
                        </div>
                        <h2 className="text-xl font-bold text-foreground mb-3 hover:text-primary transition-colors line-clamp-2">
                          {post.title}
                        </h2>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {post.excerpt}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <p className="text-xl text-muted-foreground">No articles found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <PlatformsSection />

      <IndustriesHighlightSection />

      {/* CTA Section */}
      <section className="py-12 md:py-16 bg-primary mt-[50px]">
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

export default Blog;
