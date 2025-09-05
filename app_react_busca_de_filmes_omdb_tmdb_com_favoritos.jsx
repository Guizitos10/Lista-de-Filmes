import React, { useEffect, useMemo, useState } from "react";

// Utilidades de armazenamento
const LS_KEYS = {
  apiKey: "omdb_api_key",
  favorites: "omdb_favorites_v1",
};

function loadApiKey() {
  return localStorage.getItem(LS_KEYS.apiKey) || "";
}

function saveApiKey(key) {
  localStorage.setItem(LS_KEYS.apiKey, key.trim());
}

function loadFavorites() {
  try {
    const raw = localStorage.getItem(LS_KEYS.favorites);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveFavorites(favs) {
  localStorage.setItem(LS_KEYS.favorites, JSON.stringify(favs));
}

// Hook simples para roteamento por hash
function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash || "#/search");

  useEffect(() => {
    const onHash = () => setHash(window.location.hash || "#/search");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const route = useMemo(() => {
    const clean = hash.replace(/^#\//, "");
    const [name, param] = clean.split("/");
    return { name: name || "search", param };
  }, [hash]);

  const navigate = (to) => {
    if (!to.startsWith("#/")) to = "#/" + to;
    window.location.hash = to;
  };

  return { route, navigate, hash };
}

// Componentes básicos
function Spinner() {
  return (
    <div className="flex items-center justify-center py-8" aria-live="polite" aria-busy="true">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
      <span className="ml-3 text-sm">Carregando…</span>
    </div>
  );
}

function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="my-4 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">
      {message}
    </div>
  );
}

function Poster({ src, alt }) {
  const fallback =
    "data:image/svg+xml;charset=UTF-8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='450'>\n` +
        `<rect width='100%' height='100%' fill='#f3f4f6'/>` +
        `<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#9ca3af' font-family='Arial' font-size='16'>Sem Pôster</text>` +
      `</svg>`
    );
  const ok = src && src !== "N/A" ? src : fallback;
  return (
    <img
      src={ok}
      alt={alt}
      className="h-64 w-full rounded-xl object-cover shadow-sm"
      loading="lazy"
    />
  );
}

// API — OMDb
async function searchMovies({ apiKey, query, page }) {
  const url = new URL("https://www.omdbapi.com/");
  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("s", query);
  url.searchParams.set("type", "movie");
  url.searchParams.set("page", String(page));

  const res = await fetch(url);
  if (!res.ok) throw new Error("Falha na comunicação com a API.");
  const data = await res.json();
  if (data.Response === "False") throw new Error(data.Error || "Erro na busca.");
  const total = parseInt(data.totalResults || "0", 10);
  return { items: data.Search || [], total };
}

async function fetchMovieDetails({ apiKey, id }) {
  const url = new URL("https://www.omdbapi.com/");
  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("i", id);
  url.searchParams.set("plot", "full");

  const res = await fetch(url);
  if (!res.ok) throw new Error("Falha na comunicação com a API.");
  const data = await res.json();
  if (data.Response === "False") throw new Error(data.Error || "Filme não encontrado.");
  return data;
}

// Barra superior com busca + config de API Key + navegação
function TopBar({ apiKey, onSetApiKey, onSearch, initialQuery, navigate, currentTab }) {
  const [term, setTerm] = useState(initialQuery || "");
  const [showKey, setShowKey] = useState(false);
  const [keyInput, setKeyInput] = useState(apiKey || "");

  useEffect(() => setTerm(initialQuery || ""), [initialQuery]);

  const submit = (e) => {
    e.preventDefault();
    if (!term.trim()) return;
    onSearch(term.trim());
    navigate("search");
  };

  const saveKey = () => {
    onSetApiKey(keyInput.trim());
    setShowKey(false);
  };

  return (
    <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <span className="text-xl font-semibold">🎬 MovieFinder</span>

        <nav className="ml-2 flex items-center gap-2 rounded-full bg-gray-100 p-1 text-sm">
          {[
            { id: "search", label: "Buscar" },
            { id: "favorites", label: "Favoritos" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => navigate(t.id)}
              className={`rounded-full px-3 py-1 ${
                currentTab === t.id ? "bg-white shadow" : "text-gray-600 hover:bg-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <form onSubmit={submit} className="mx-2 flex flex-1 items-center gap-2">
          <input
            type="text"
            className="w-full rounded-2xl border px-3 py-2 outline-none focus:ring"
            placeholder="Busque por título (ex.: Inception)"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
          <button className="rounded-2xl border px-4 py-2 font-medium hover:bg-gray-50">Buscar</button>
        </form>

        <div className="ml-auto">
          <button
            onClick={() => setShowKey((v) => !v)}
            className="rounded-2xl border px-3 py-2 text-sm hover:bg-gray-50"
          >
            {apiKey ? "Configurar API Key" : "Inserir API Key"}
          </button>
        </div>
      </div>

      {showKey && (
        <div className="border-t bg-gray-50/70">
          <div className="mx-auto flex max-w-6xl items-end gap-2 px-4 py-3">
            <div className="flex-1">
              <label className="mb-1 block text-sm text-gray-600">OMDb API Key</label>
              <input
                type="text"
                className="w-full rounded-xl border px-3 py-2"
                placeholder="Ex.: k_abcdefg"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-500">
                Obtenha uma chave gratuita em omdbapi.com/apikey.aspx e cole aqui.
              </p>
            </div>
            <button onClick={saveKey} className="rounded-xl border px-3 py-2 font-medium hover:bg-white">
              Salvar
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

function MovieCard({ movie, onDetails, onToggleFavorite, isFavorite }) {
  return (
    <div className="flex flex-col rounded-2xl border bg-white p-3 shadow-sm">
      <Poster src={movie.Poster} alt={movie.Title} />
      <div className="mt-3 flex-1">
        <h3 className="line-clamp-2 text-base font-semibold">{movie.Title}</h3>
        <p className="mt-1 text-sm text-gray-500">{movie.Year}</p>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => onDetails(movie.imdbID)}
          className="flex-1 rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
        >
          Detalhes
        </button>
        <button
          onClick={() => onToggleFavorite(movie)}
          className={`rounded-xl px-3 py-2 text-sm ${
            isFavorite ? "border bg-amber-50" : "border hover:bg-gray-50"
          }`}
        >
          {isFavorite ? "★" : "☆"}
        </button>
      </div>
    </div>
  );
}

function Pagination({ page, total, onChange }) {
  if (total <= 1) return null;
  const maxButtons = 5;
  const start = Math.max(1, page - Math.floor(maxButtons / 2));
  const end = Math.min(total, start + maxButtons - 1);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
      <button
        className="rounded-xl border px-3 py-1 text-sm disabled:opacity-50"
        onClick={() => onChange(1)}
        disabled={page === 1}
      >
        « Primeiro
      </button>
      <button
        className="rounded-xl border px-3 py-1 text-sm disabled:opacity-50"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
      >
        ‹ Anterior
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`rounded-xl border px-3 py-1 text-sm ${
            p === page ? "bg-gray-900 text-white" : "hover:bg-gray-50"
          }`}
        >
          {p}
        </button>
      ))}
      <button
        className="rounded-xl border px-3 py-1 text-sm disabled:opacity-50"
        onClick={() => onChange(page + 1)}
        disabled={page === total}
      >
        Próxima ›
      </button>
      <button
        className="rounded-xl border px-3 py-1 text-sm disabled:opacity-50"
        onClick={() => onChange(total)}
        disabled={page === total}
      >
        Última »
      </button>
    </div>
  );
}

function SearchPage({ apiKey, initialQuery, navigate, favorites, onToggleFavorite }) {
  const [query, setQuery] = useState(initialQuery || "");
  const [page, setPage] = useState(1);
  const [results, setResults] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const totalPages = Math.ceil((totalResults || 0) / 10);

  useEffect(() => {
    if (!apiKey || !query) return;
    let ignore = false;
    setLoading(true);
    setError("");
    searchMovies({ apiKey, query, page })
      .then(({ items, total }) => {
        if (ignore) return;
        setResults(items);
        setTotalResults(total);
      })
      .catch((err) => !ignore && setError(err.message || "Erro ao buscar."))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [apiKey, query, page]);

  useEffect(() => setQuery(initialQuery || ""), [initialQuery]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {!apiKey && (
        <ErrorBanner message="Insira sua OMDb API Key para começar a buscar." />
      )}

      <div className="mb-4 flex items-center gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Digite um título (ex.: Interstellar)"
          className="w-full rounded-2xl border px-3 py-2"
        />
        <button
          onClick={() => {
            if (!query.trim()) return;
            setPage(1);
          }}
          className="rounded-2xl border px-4 py-2 font-medium hover:bg-gray-50"
        >
          Pesquisar
        </button>
      </div>

      {loading && <Spinner />}
      <ErrorBanner message={error} />

      {!loading && !error && results.length > 0 && (
        <>
          <p className="mb-3 text-sm text-gray-600">
            {totalResults} resultado(s) — Página {page} de {totalPages}
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {results.map((m) => (
              <MovieCard
                key={m.imdbID}
                movie={m}
                onDetails={(id) => navigate(`movie/${id}`)}
                onToggleFavorite={onToggleFavorite}
                isFavorite={Boolean(favorites[m.imdbID])}
              />
            ))}
          </div>
          <Pagination page={page} total={totalPages} onChange={setPage} />
        </>
      )}

      {!loading && !error && query && results.length === 0 && (
        <p className="mt-8 text-center text-sm text-gray-500">Nenhum resultado encontrado.</p>
      )}
    </div>
  );
}

function DetailsPage({ apiKey, id, onBack, onToggleFavorite, isFavorite }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!apiKey || !id) return;
    let ignore = false;
    setLoading(true);
    setError("");
    fetchMovieDetails({ apiKey, id })
      .then((d) => !ignore && setData(d))
      .catch((err) => !ignore && setError(err.message || "Erro ao carregar detalhes."))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [apiKey, id]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <button onClick={onBack} className="mb-4 rounded-xl border px-3 py-2 hover:bg-gray-50">
        ← Voltar
      </button>

      {loading && <Spinner />}
      <ErrorBanner message={error} />

      {!loading && !error && data && (
        <article className="grid gap-6 rounded-2xl border bg-white p-4 shadow-sm md:grid-cols-[200px,1fr]">
          <Poster src={data.Poster} alt={data.Title} />
          <div>
            <h1 className="text-2xl font-bold">{data.Title} ({data.Year})</h1>
            <p className="mt-1 text-sm text-gray-600">{data.Runtime} • {data.Genre}</p>

            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-gray-100 px-3 py-1">Diretor: {data.Director}</span>
              <span className="rounded-full bg-gray-100 px-3 py-1">Classificação IMDB: {data.imdbRating}</span>
              {data.Rated && <span className="rounded-full bg-gray-100 px-3 py-1">{data.Rated}</span>}
            </div>

            <p className="mt-4 leading-relaxed text-gray-800">{data.Plot}</p>

            <div className="mt-4">
              <h2 className="font-semibold">Elenco</h2>
              <p className="text-gray-700">{data.Actors}</p>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={() => onToggleFavorite({
                  imdbID: data.imdbID,
                  Title: data.Title,
                  Year: data.Year,
                  Poster: data.Poster,
                })}
                className={`rounded-xl border px-4 py-2 font-medium ${
                  isFavorite ? "bg-amber-50" : "hover:bg-gray-50"
                }`}
              >
                {isFavorite ? "Remover dos Favoritos ★" : "Adicionar aos Favoritos ☆"}
              </button>
              <a
                href={`https://www.imdb.com/title/${data.imdbID}/`}
                target="_blank" rel="noreferrer"
                className="rounded-xl border px-4 py-2 font-medium hover:bg-gray-50"
              >
                Abrir no IMDb ↗
              </a>
            </div>
          </div>
        </article>
      )}
    </div>
  );
}

function FavoritesPage({ favorites, navigate, onToggleFavorite }) {
  const items = Object.values(favorites);
  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 text-center text-gray-600">
        Sua lista de favoritos está vazia.
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h2 className="mb-4 text-xl font-semibold">Meus Favoritos ({items.length})</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((m) => (
          <div key={m.imdbID} className="flex flex-col rounded-2xl border bg-white p-3 shadow-sm">
            <Poster src={m.Poster} alt={m.Title} />
            <h3 className="mt-3 line-clamp-2 text-base font-semibold">{m.Title}</h3>
            <p className="text-sm text-gray-500">{m.Year}</p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => navigate(`movie/${m.imdbID}`)}
                className="flex-1 rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
              >
                Detalhes
              </button>
              <button
                onClick={() => onToggleFavorite(m)}
                className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
              >
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MovieApp() {
  const { route, navigate } = useHashRoute();
  const [apiKey, setApiKey] = useState(loadApiKey());
  const [lastQuery, setLastQuery] = useState("");
  const [favorites, setFavorites] = useState(loadFavorites());

  const onSetApiKey = (key) => {
    setApiKey(key);
    saveApiKey(key);
  };

  const onToggleFavorite = (movie) => {
    setFavorites((prev) => {
      const copy = { ...prev };
      if (copy[movie.imdbID]) {
        delete copy[movie.imdbID];
      } else {
        copy[movie.imdbID] = movie;
      }
      saveFavorites(copy);
      return copy;
    });
  };

  // Atualiza tab corrente para estilizar navegação
  const currentTab = route.name === "favorites" ? "favorites" : "search";

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-900">
      <TopBar
        apiKey={apiKey}
        onSetApiKey={onSetApiKey}
        onSearch={(q) => setLastQuery(q)}
        initialQuery={lastQuery}
        navigate={navigate}
        currentTab={currentTab}
      />

      {route.name === "search" && (
        <SearchPage
          apiKey={apiKey}
          initialQuery={lastQuery}
          navigate={navigate}
          favorites={favorites}
          onToggleFavorite={onToggleFavorite}
        />
      )}

      {route.name === "movie" && route.param && (
        <DetailsPage
          apiKey={apiKey}
          id={route.param}
          onBack={() => navigate("search")}
          onToggleFavorite={onToggleFavorite}
          isFavorite={Boolean(favorites[route.param])}
        />
      )}

      {route.name === "favorites" && (
        <FavoritesPage
          favorites={favorites}
          navigate={navigate}
          onToggleFavorite={onToggleFavorite}
        />
      )}

      <footer className="mx-auto max-w-6xl px-4 py-10 text-center text-xs text-gray-500">
        Feito com React + OMDb • Favoritos em localStorage • {new Date().getFullYear()}
      </footer>
    </div>
  );
}
