import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, ChevronRight, BookOpen, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { helpArticles, helpModules, HelpArticle } from "@/data/helpArticles";
import {
  Users, Car, FileText, Target, Wrench, ShieldAlert, PackageCheck,
  Shield, ShieldCheck, CarFront, Star, CreditCard,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  Users, Car, FileText, Target, Wrench, ShieldAlert, PackageCheck,
  Shield, ShieldCheck, CarFront, Star, CreditCard,
  Search,
};

function ModuleIcon({ name, className }: { name: string; className?: string }) {
  const Icon = iconMap[name] ?? BookOpen;
  return <Icon className={className} />;
}

function ArticleDetail({ article, onBack }: { article: HelpArticle; onBack: () => void }) {
  const paragraphs = article.content.split("\n\n");

  const renderParagraph = (text: string, i: number) => {
    // Bold headings that start with **
    if (text.startsWith("**") && text.endsWith("**")) {
      return <h3 key={i} className="font-semibold text-foreground mt-4 mb-1">{text.replace(/\*\*/g, "")}</h3>;
    }
    // Bold inline **text**
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} className="text-sm text-muted-foreground leading-relaxed mb-3">
        {parts.map((part, j) =>
          part.startsWith("**") && part.endsWith("**")
            ? <strong key={j} className="text-foreground font-medium">{part.replace(/\*\*/g, "")}</strong>
            : part
        )}
      </p>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ChevronRight className="h-3.5 w-3.5 rotate-180" /> Back to articles
      </button>

      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <ModuleIcon name={article.moduleIcon} className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{helpModules.find(m => m.key === article.module)?.label}</p>
          <h2 className="text-xl font-bold text-foreground">{article.title}</h2>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-6 italic border-l-2 border-primary/30 pl-3">{article.summary}</p>

      <div className="prose-sm max-w-none">
        {paragraphs.map((p, i) => {
          // Bullet list items starting with -
          if (p.includes("\n- ")) {
            const [heading, ...items] = p.split("\n- ");
            return (
              <div key={i} className="mb-3">
                {heading && renderParagraph(heading, i * 100)}
                <ul className="list-disc list-inside space-y-1 ml-2">
                  {items.map((item, j) => (
                    <li key={j} className="text-sm text-muted-foreground leading-relaxed">
                      {item.split(/(\*\*[^*]+\*\*)/g).map((part, k) =>
                        part.startsWith("**") && part.endsWith("**")
                          ? <strong key={k} className="text-foreground font-medium">{part.replace(/\*\*/g, "")}</strong>
                          : part
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          }
          return renderParagraph(p, i);
        })}
      </div>

      <div className="mt-6 flex flex-wrap gap-1.5">
        {article.tags.map(tag => (
          <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
        ))}
      </div>
    </motion.div>
  );
}

export default function HelpPage() {
  const [query, setQuery] = useState("");
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);

  const filtered = useMemo(() => {
    let articles = helpArticles;
    if (selectedModule) articles = articles.filter(a => a.module === selectedModule);
    if (query.trim()) {
      const q = query.toLowerCase();
      articles = articles.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.tags.some(t => t.includes(q)) ||
        a.content.toLowerCase().includes(q)
      );
    }
    return articles;
  }, [query, selectedModule]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="border-b border-border/50 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3">DealerOps Knowledge Base</h1>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Find answers about every feature — from invoicing and CRA Shield to GDPR compliance and team management.
          </p>
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={e => { setQuery(e.target.value); setSelectedArticle(null); }}
              placeholder="Search articles…"
              className="pl-9 h-11"
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {selectedArticle ? (
          <ArticleDetail article={selectedArticle} onBack={() => setSelectedArticle(null)} />
        ) : (
          <>
            {/* Module filter pills */}
            {!query && (
              <div className="flex flex-wrap gap-2 mb-8">
                <button
                  onClick={() => setSelectedModule(null)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                    !selectedModule
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border/50 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  }`}
                >
                  All modules
                </button>
                {helpModules.map(m => (
                  <button
                    key={m.key}
                    onClick={() => setSelectedModule(selectedModule === m.key ? null : m.key)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border inline-flex items-center gap-1.5 ${
                      selectedModule === m.key
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border/50 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    }`}
                  >
                    <ModuleIcon name={m.icon} className="h-3 w-3" />
                    {m.label}
                  </button>
                ))}
              </div>
            )}

            {query && (
              <p className="text-sm text-muted-foreground mb-6">
                {filtered.length} result{filtered.length !== 1 ? "s" : ""} for <strong className="text-foreground">"{query}"</strong>
              </p>
            )}

            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <Search className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No articles found. Try a different search term.</p>
              </div>
            ) : query ? (
              // Flat list when searching
              <div className="space-y-2">
                {filtered.map(article => (
                  <button
                    key={article.id}
                    onClick={() => setSelectedArticle(article)}
                    className="w-full text-left p-4 rounded-xl border border-border/50 bg-card/50 hover:border-primary/40 hover:bg-card transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <ModuleIcon name={article.moduleIcon} className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{article.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{article.summary}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1 group-hover:text-primary transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              // Grouped by module when browsing
              <div className="space-y-10">
                {helpModules
                  .filter(m => !selectedModule || m.key === selectedModule)
                  .map(m => {
                    const articles = filtered.filter(a => a.module === m.key);
                    if (articles.length === 0) return null;
                    return (
                      <div key={m.key}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
                            <ModuleIcon name={m.icon} className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <h2 className="text-sm font-semibold text-foreground">{m.label}</h2>
                          <div className="flex-1 h-px bg-border/40 ml-2" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {articles.map(article => (
                            <button
                              key={article.id}
                              onClick={() => setSelectedArticle(article)}
                              className="text-left p-4 rounded-xl border border-border/50 bg-card/50 hover:border-primary/40 hover:bg-card transition-all group"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors leading-snug">{article.title}</p>
                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{article.summary}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
