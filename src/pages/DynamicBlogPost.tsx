import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowLeft, Check } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PageMeta from "@/components/PageMeta";
import { Skeleton } from "@/components/ui/skeleton";

type ContentBlock = {
  type: "heading" | "paragraph" | "image" | "benefits" | "before-after";
  headingText?: string;
  headingHighlight?: string;
  text?: string;
  imageUrl?: string;
  imageAlt?: string;
  items?: string[];
  beforeImageUrl?: string;
  beforeLabel?: string;
  afterImageUrl?: string;
  afterLabel?: string;
};

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  title_highlight: string | null;
  excerpt: string;
  category: string;
  cover_image_url: string;
  published_at: string | null;
  is_published: boolean;
  content_blocks: ContentBlock[];
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
};

const DynamicBlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetchPost(slug);
  }, [slug]);

  const fetchPost = async (slug: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();

      if (error || !data) {
        setNotFound(true);
        return;
      }
      setPost(data as any);
    } catch {
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <article className="py-20 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto space-y-6">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          </div>
        </article>
        <Footer />
      </div>
    );
  }

  if (notFound || !post) {
    navigate("/blog");
    return null;
  }

  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "";

  const renderBlock = (block: ContentBlock, index: number) => {
    switch (block.type) {
      case "heading":
        return (
          <h2 key={index} className="text-3xl font-bold mt-12 mb-6">
            {block.headingText && <span className="text-header-dark">{block.headingText} </span>}
            {block.headingHighlight && (
              <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                {block.headingHighlight}
              </span>
            )}
          </h2>
        );

      case "paragraph":
        return (
          <p key={index} className="text-lg text-foreground/80 leading-relaxed mb-6">
            {block.text}
          </p>
        );

      case "image":
        return (
          <div key={index} className="my-8">
            <img
              src={block.imageUrl}
              alt={block.imageAlt || ""}
              className="w-full rounded-lg object-cover"
              loading="lazy"
            />
            {block.imageAlt && (
              <p className="text-sm text-muted-foreground text-center mt-2">{block.imageAlt}</p>
            )}
          </div>
        );

      case "benefits":
        return (
          <div key={index} className="grid gap-2 mb-12">
            {(block.items || []).map((item, i) => (
              <div key={i} className="flex gap-3 p-4 bg-muted/30 rounded-lg">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-foreground/80">{item}</p>
              </div>
            ))}
          </div>
        );

      case "before-after":
        return (
          <div key={index} className="my-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-muted/30 rounded-lg p-6 h-full flex flex-col">
                  <div className="flex-1 rounded-lg overflow-hidden bg-card mb-4 aspect-[4/3]">
                    <img
                      src={block.beforeImageUrl}
                      alt={block.beforeLabel || "Before"}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="text-center">
                    <span className="inline-block bg-muted text-foreground px-4 py-2 rounded-full text-sm font-semibold">
                      {block.beforeLabel || "Before"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-primary/5 rounded-lg p-6 h-full flex flex-col border border-primary/20">
                  <div className="flex-1 rounded-lg overflow-hidden bg-card mb-4 aspect-[4/3]">
                    <img
                      src={block.afterImageUrl}
                      alt={block.afterLabel || "After"}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="text-center">
                    <span className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold">
                      {block.afterLabel || "After"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title={post.meta_title || `${post.title} ${post.title_highlight || ""} | Floowy`}
        description={post.meta_description || post.excerpt}
        keywords={post.meta_keywords || ""}
        canonicalUrl={`https://floowy.ai/blog/${post.slug}`}
        breadcrumbs={[
          { name: "Home", url: "https://floowy.ai" },
          { name: "Blog", url: "https://floowy.ai/blog" },
          { name: post.title, url: `https://floowy.ai/blog/${post.slug}` },
        ]}
      />
      <Navigation />

      <article className="py-20 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Link to="/blog" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-8 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Link>

            <div className="mb-6">
              <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                {post.category}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              <span className="text-header-dark">{post.title}</span>{" "}
              {post.title_highlight && (
                <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  {post.title_highlight}
                </span>
              )}
            </h1>

            <div className="flex items-center gap-2 text-muted-foreground mb-8">
              <Calendar className="w-4 h-4" />
              <time>{formattedDate}</time>
            </div>

            <div className="prose prose-lg max-w-none">
              <p className="text-xl text-muted-foreground leading-relaxed mb-8">
                {post.excerpt}
              </p>

              {(post.content_blocks || []).map((block, index) => renderBlock(block, index))}
            </div>
          </div>
        </div>
      </article>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-6">
            Make your content in seconds.
          </h2>
          <p className="text-xl text-primary-foreground/95 mb-8 max-w-2xl mx-auto">
            Watch how fast AI makes content people can't scroll past.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/auth")}
            className="text-lg px-8 py-6 bg-background text-primary hover:bg-background/95 rounded-full font-semibold shadow-glow"
          >
            Create Your First Ad
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default DynamicBlogPost;
