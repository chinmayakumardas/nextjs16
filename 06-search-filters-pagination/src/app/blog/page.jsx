// export default async function BlogPage({ searchParams }) {
//   const params = await searchParams;

//   const query = params.query || "";
//   const category = params.category || "all";
//   const page = params.page || "1";

//   return (
//     <main>
//       <h1>Blog</h1>

//       <p>Search: {query || "Nothing"}</p>
//       <p>Category: {category}</p>
//       <p>Page: {page}</p>
//     </main>
//   );
// }

// "use client";

// import { useSearchParams, useRouter } from "next/navigation";

// export default function SearchBox() {
//   const searchParams = useSearchParams();
//   const router = useRouter();

//   function handleSearch(value) {
//     const params = new URLSearchParams(searchParams.toString());

//     if (value) {
//       params.set("query", value);
//     } else {
//       params.delete("query");
//     }

//     router.push(`/blog?${params.toString()}`);
//   }

//   return (
//     <input
//       placeholder="Search articles..."
//       onChange={(event) => handleSearch(event.target.value)}
//     />
//   );
// }


















"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

const articles = [
  {
    id: 1,
    title: "Learn Next.js Routing",
    category: "Next.js",
    author: "John",
    difficulty: "Beginner",
    date: "2026-09-20",
    image:
      "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80",
  },
  {
    id: 2,
    title: "Understanding React Server Components",
    category: "React",
    author: "Sarah",
    difficulty: "Advanced",
    date: "2026-09-18",
    image:
      "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=800&q=80",
  },
  {
    id: 3,
    title: "Next.js Search Parameters",
    category: "Next.js",
    author: "Mike",
    difficulty: "Intermediate",
    date: "2026-09-15",
    image:
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80",
  },
  {
    id: 4,
    title: "React Hooks Explained",
    category: "React",
    author: "John",
    difficulty: "Beginner",
    date: "2026-09-10",
    image:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80",
  },
  {
    id: 5,
    title: "Building APIs with Next.js",
    category: "Next.js",
    author: "Sarah",
    difficulty: "Intermediate",
    date: "2026-09-05",
    image:
      "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&q=80",
  },
  {
    id: 6,
    title: "Advanced JavaScript Patterns",
    category: "JavaScript",
    author: "Mike",
    difficulty: "Advanced",
    date: "2026-09-01",
    image:
      "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800&q=80",
  },
  {
    id: 7,
    title: "JavaScript Array Methods",
    category: "JavaScript",
    author: "John",
    difficulty: "Beginner",
    date: "2026-08-25",
    image:
      "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&q=80",
  },
  {
    id: 8,
    title: "React State Management",
    category: "React",
    author: "Sarah",
    difficulty: "Intermediate",
    date: "2026-08-20",
    image:
      "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80",
  },
  {
    id: 9,
    title: "Next.js Middleware",
    category: "Next.js",
    author: "Mike",
    difficulty: "Advanced",
    date: "2026-08-15",
    image:
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80",
  },
  {
    id: 10,
    title: "JavaScript Async Await",
    category: "JavaScript",
    author: "John",
    difficulty: "Intermediate",
    date: "2026-08-10",
    image:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80",
  },
  {
    id: 11,
    title: "React Component Patterns",
    category: "React",
    author: "Sarah",
    difficulty: "Advanced",
    date: "2026-08-05",
    image:
      "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=800&q=80",
  },
  {
    id: 12,
    title: "Next.js Dynamic Routes",
    category: "Next.js",
    author: "Mike",
    difficulty: "Intermediate",
    date: "2026-08-01",
    image:
      "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&q=80",
  },
];

const ITEMS_PER_PAGE = 6;
const CATEGORIES = ["Next.js", "React", "JavaScript"];
const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];

export default function BlogPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const query = searchParams.get("query") || "";
  const categoryParam = searchParams.get("category") || "";
  const difficultyParam = searchParams.get("difficulty") || "";
  const sort = searchParams.get("sort") || "newest";
  const page = Number(searchParams.get("page")) || 1;

  const selectedCategories = categoryParam
    ? categoryParam.split(",")
    : [];

  const selectedDifficulties = difficultyParam
    ? difficultyParam.split(",")
    : [];

  function updateParam(key, value) {
    const params = new URLSearchParams(searchParams.toString());

    if (Array.isArray(value)) {
      if (value.length > 0) {
        params.set(key, value.join(","));
      } else {
        params.delete(key);
      }
    } else {
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }

    if (key !== "page") {
      params.set("page", "1");
    }

    router.push(`/blog?${params.toString()}`);
  }

  function toggleCategory(cat) {
    const newCats = selectedCategories.includes(cat)
      ? selectedCategories.filter((c) => c !== cat)
      : [...selectedCategories, cat];

    updateParam("category", newCats);
  }

  function toggleDifficulty(diff) {
    const newDiffs = selectedDifficulties.includes(diff)
      ? selectedDifficulties.filter((d) => d !== diff)
      : [...selectedDifficulties, diff];

    updateParam("difficulty", newDiffs);
  }

  function resetFilters() {
    router.push("/blog");
  }

  const filteredArticles = useMemo(() => {
    let result = [...articles];

    if (query) {
      result = result.filter((article) =>
        article.title.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (selectedCategories.length > 0) {
      result = result.filter((article) =>
        selectedCategories.includes(article.category)
      );
    }

    if (selectedDifficulties.length > 0) {
      result = result.filter((article) =>
        selectedDifficulties.includes(article.difficulty)
      );
    }

    if (sort === "newest") {
      result.sort(
        (a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    } else if (sort === "oldest") {
      result.sort(
        (a, b) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    } else if (sort === "title") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [query, selectedCategories, selectedDifficulties, sort]);

  const totalPages = Math.ceil(
    filteredArticles.length / ITEMS_PER_PAGE
  );

  const currentPage = Math.min(
    Math.max(page, 1),
    Math.max(totalPages, 1)
  );

  const start = (currentPage - 1) * ITEMS_PER_PAGE;

  const visibleArticles = filteredArticles.slice(
    start,
    start + ITEMS_PER_PAGE
  );

  function changePage(newPage) {
    if (newPage < 1 || newPage > totalPages) return;

    updateParam("page", String(newPage));
  }

  const liveState = {
    query: query || null,
    categories:
      selectedCategories.length > 0
        ? selectedCategories
        : null,
    difficulties:
      selectedDifficulties.length > 0
        ? selectedDifficulties
        : null,
    sort,
    page: currentPage,
    totalResults: filteredArticles.length,
    totalPages,
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-6xl px-4 py-8">

        {/* Header */}
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold tracking-tight">
              Blog
            </h1>

            <Input
              placeholder="Search articles..."
              value={query}
              onChange={(e) =>
                updateParam("query", e.target.value)
              }
              className="w-64 bg-white"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-500">
              <span className="font-medium text-zinc-900">
                {filteredArticles.length}
              </span>{" "}
              result{filteredArticles.length !== 1 ? "s" : ""}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
            >
              Reset
            </Button>
          </div>
        </header>

        {/* Filters */}
        <div className="mb-8 space-y-4 rounded-xl border bg-white p-5 shadow-sm">

          {/* Categories */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Category (multi)
            </p>

            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const isActive =
                  selectedCategories.includes(cat);

                return (
                  <Badge
                    key={cat}
                    variant={
                      isActive ? "default" : "outline"
                    }
                    className={`cursor-pointer px-3 py-1.5 text-sm transition-all ${
                      isActive
                        ? cat === "Next.js"
                          ? "bg-blue-600 hover:bg-blue-700"
                          : cat === "React"
                          ? "bg-cyan-600 hover:bg-cyan-700"
                          : "bg-amber-600 hover:bg-amber-700"
                        : "hover:bg-zinc-100"
                    }`}
                    onClick={() => toggleCategory(cat)}
                  >
                    {cat}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Difficulty (multi)
            </p>

            <div className="flex flex-wrap gap-2">
              {DIFFICULTIES.map((diff) => {
                const isActive =
                  selectedDifficulties.includes(diff);

                return (
                  <Badge
                    key={diff}
                    variant={
                      isActive ? "default" : "outline"
                    }
                    className={`cursor-pointer px-3 py-1.5 text-sm transition-all ${
                      isActive
                        ? diff === "Beginner"
                          ? "bg-emerald-600 hover:bg-emerald-700"
                          : diff === "Intermediate"
                          ? "bg-orange-500 hover:bg-orange-600"
                          : "bg-rose-600 hover:bg-rose-700"
                        : "hover:bg-zinc-100"
                    }`}
                    onClick={() =>
                      toggleDifficulty(diff)
                    }
                  >
                    {diff}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-3">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Sort
            </p>

            <Select
              value={sort}
              onValueChange={(value) =>
                updateParam("sort", value)
              }
            >
              <SelectTrigger className="w-[160px] bg-white">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="newest">
                  Newest First
                </SelectItem>
                <SelectItem value="oldest">
                  Oldest First
                </SelectItem>
                <SelectItem value="title">
                  Title A-Z
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">

          {/* Results */}
          <div className="space-y-4">
            {visibleArticles.length > 0 ? (
              visibleArticles.map((article) => (
                <Card
                  key={article.id}
                  className="overflow-hidden border-zinc-200 shadow-sm"
                >
                  <div className="flex">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="h-28 w-36 object-cover"
                    />

                    <CardContent className="flex flex-1 flex-col justify-between p-4">
                      <div>
                        <div className="mb-2 flex items-center gap-2">
                          <Badge
                            className={
                              article.category === "Next.js"
                                ? "bg-blue-100 text-blue-700 hover:bg-blue-100"
                                : article.category === "React"
                                ? "bg-cyan-100 text-cyan-700 hover:bg-cyan-100"
                                : "bg-amber-100 text-amber-700 hover:bg-amber-100"
                            }
                          >
                            {article.category}
                          </Badge>

                          <Badge
                            variant="outline"
                            className={
                              article.difficulty === "Beginner"
                                ? "border-emerald-300 text-emerald-700"
                                : article.difficulty === "Intermediate"
                                ? "border-orange-300 text-orange-700"
                                : "border-rose-300 text-rose-700"
                            }
                          >
                            {article.difficulty}
                          </Badge>
                        </div>

                        <h2 className="text-[15px] font-semibold leading-snug">
                          {article.title}
                        </h2>
                      </div>

                      <div className="mt-2 flex justify-between text-xs text-zinc-500">
                        <span>By {article.author}</span>
                        <span>{article.date}</span>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="mb-3 text-zinc-500">
                    No articles found
                  </p>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetFilters}
                  >
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    changePage(currentPage - 1)
                  }
                  disabled={currentPage === 1}
                >
                  ← Previous
                </Button>

                <span className="text-sm text-zinc-500">
                  Page {currentPage} of {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    changePage(currentPage + 1)
                  }
                  disabled={currentPage === totalPages}
                >
                  Next →
                </Button>
              </div>
            )}
          </div>

          {/* Live JSON */}
          <div className="lg:sticky lg:top-6">
            <Card className="border-zinc-200 shadow-sm">
              <div className="flex items-center justify-between border-b bg-zinc-50 px-4 py-3">
                <span className="text-sm font-medium">
                  Live State
                </span>

                <span className="text-xs text-zinc-400">
                  real-time
                </span>
              </div>

              <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed text-zinc-800">
                {JSON.stringify(liveState, null, 2)}
              </pre>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}