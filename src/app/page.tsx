import Link from "next/link";
import { Github, Linkedin, Twitter } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const sections = [
  {
    title: "Blog",
    description: "Read my thoughts on web development, quantitative finance, and more.",
    path: "/blog",
  },
  {
    title: "Projects",
    description: "Explore a selection of my past and current projects.",
    path: "/projects",
  },
  {
    title: "Quant Dashboard",
    description: "Access my personal dashboard for quantitative analysis.",
    path: "/dashboard",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100 via-background to-background dark:from-slate-900 dark:via-background dark:to-background">
      {/* Header */}
      <header className="container mx-auto p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold tracking-tight">alian.dev</h1>
        <ThemeToggle />
      </header>

      <main className="container mx-auto px-4 py-16 max-w-5xl space-y-24">
        {/* Hero Section */}
        <section className="text-center space-y-6 animate-in slide-in-from-bottom-8 fade-in duration-1000">
          <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight">
            Welcome to My <span className="text-primary">Digital Space</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            I&apos;m a passionate developer, exploring the worlds of web technology and finance.
          </p>
          <div className="pt-4 space-x-4">
            <Button size="lg" asChild className="rounded-full shadow-lg hover:shadow-primary/25 transition-all">
              <Link href="/projects">View My Work</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="rounded-full">
              <Link href="/dashboard">Quant Dashboard</Link>
            </Button>
          </div>
        </section>

        {/* Sections Grid */}
        <section className="grid md:grid-cols-3 gap-6">
          {sections.map((section, i) => (
            <Card
              key={section.title}
              className="group hover:border-primary/50 transition-all duration-300 hover:shadow-md animate-in slide-in-from-bottom-8 fade-in"
              style={{ animationDelay: `${i * 150}ms`, animationFillMode: "both" }}
            >
              <CardHeader>
                <CardTitle className="group-hover:text-primary transition-colors">{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button variant="ghost" asChild className="p-0 hover:bg-transparent hover:text-primary w-full justify-start gap-2">
                  <Link href={section.path}>
                    Explore <span aria-hidden="true">&rarr;</span>
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </section>

        {/* Social Links */}
        <section className="text-center space-y-6">
          <h3 className="text-2xl font-semibold">Connect with me</h3>
          <div className="flex justify-center space-x-6">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              <span className="sr-only">GitHub</span>
              <Github className="h-6 w-6" />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              <span className="sr-only">LinkedIn</span>
              <Linkedin className="h-6 w-6" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              <span className="sr-only">Twitter</span>
              <Twitter className="h-6 w-6" />
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
