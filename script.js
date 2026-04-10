const queryInput = document.querySelector('#query');
const searchBtn = document.querySelector('#searchBtn');
const deepSearchInput = document.querySelector('#deepSearch');
const upcomingOnlyInput = document.querySelector('#upcomingOnly');
const statusNode = document.querySelector('#status');
const resultsNode = document.querySelector('#results');
const countNode = document.querySelector('#count');
const chips = document.querySelectorAll('.chip');
const template = document.querySelector('#cardTemplate');

const METAGAME_INDEX = [
  {
    title: 'Roblox',
    type: 'Plateforme de jeux',
    source: 'Index local',
    upcoming: false,
    description:
      'Plateforme UGC contenant des millions d’expériences, y compris Blox Fruits.',
    url: 'https://www.roblox.com/',
    tags: ['roblox', 'plateforme', 'ugc'],
  },
  {
    title: 'Blox Fruits',
    type: 'Expérience Roblox',
    source: 'Index local',
    upcoming: false,
    description:
      'Jeu Roblox massivement populaire inspiré de l’univers des pirates et des fruits.',
    url: 'https://www.roblox.com/games/2753915549/Blox-Fruits',
    tags: ['blox fruits', 'roblox', 'one piece'],
  },
  {
    title: 'Fortnite',
    type: 'Plateforme / Battle Royale',
    source: 'Index local',
    upcoming: false,
    description:
      'Écosystème de jeux incluant Battle Royale, UEFN et créations communautaires.',
    url: 'https://www.fortnite.com/',
    tags: ['fortnite', 'epic games', 'uefn'],
  },
  {
    title: 'LEGO Fortnite Odyssey',
    type: 'Expérience Fortnite',
    source: 'Index local',
    upcoming: false,
    description:
      'Expérience officielle jouable dans Fortnite avec survie/crafting.',
    url: 'https://www.fortnite.com/',
    tags: ['lego fortnite', 'fortnite mode'],
  },
  {
    title: 'GTA VI',
    type: 'Jeu à venir',
    source: 'Index local',
    upcoming: true,
    description:
      'Grand Theft Auto VI est l’un des jeux les plus attendus, prévu prochainement.',
    url: 'https://www.rockstargames.com/VI',
    tags: ['gta 6', 'gta vi', 'grand theft auto'],
  },
];

function normalize(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function isFutureDate(text) {
  const date = new Date(text);
  return !Number.isNaN(date.getTime()) && date > new Date();
}

function render(items) {
  resultsNode.innerHTML = '';

  if (!items.length) {
    resultsNode.innerHTML = '<p class="meta">Aucun résultat trouvé. Essaie une recherche plus large.</p>';
    countNode.textContent = '0 élément';
    return;
  }

  for (const item of items) {
    const card = template.content.firstElementChild.cloneNode(true);
    card.querySelector('.badge').textContent = item.type || 'Jeu vidéo';
    card.querySelector('.source').textContent = item.source || 'Source inconnue';
    card.querySelector('.title').textContent = item.title || 'Sans titre';
    card.querySelector('.meta').textContent = item.meta || 'Métadonnées indisponibles';
    card.querySelector('.description').textContent = item.description || 'Pas de description.';

    const link = card.querySelector('.link');
    link.href = item.url || '#';

    resultsNode.append(card);
  }

  countNode.textContent = `${items.length} élément${items.length > 1 ? 's' : ''}`;
}

function localSearch(query) {
  const q = normalize(query);
  if (!q) return [];

  return METAGAME_INDEX.filter((entry) => {
    const bucket = [entry.title, entry.type, entry.description, ...(entry.tags || [])]
      .join(' ')
      .toLowerCase();
    return normalize(bucket).includes(q);
  }).map((entry) => ({
    ...entry,
    meta: entry.upcoming ? 'Statut: à venir' : 'Statut: disponible',
  }));
}

async function searchWikipedia(query) {
  const url = new URL('https://fr.wikipedia.org/w/api.php');
  url.searchParams.set('origin', '*');
  url.searchParams.set('action', 'query');
  url.searchParams.set('format', 'json');
  url.searchParams.set('prop', 'extracts|info');
  url.searchParams.set('inprop', 'url');
  url.searchParams.set('exintro', '1');
  url.searchParams.set('explaintext', '1');
  url.searchParams.set('generator', 'search');
  url.searchParams.set('gsrsearch', `${query} jeu vidéo`);
  url.searchParams.set('gsrlimit', '8');

  const res = await fetch(url);
  const data = await res.json();
  const pages = data?.query?.pages ? Object.values(data.query.pages) : [];

  return pages.map((page) => ({
    title: page.title,
    type: 'Référence encyclopédique',
    source: 'Wikipedia',
    upcoming: /sortie.*(prévu|attendu)|à venir/i.test(page.extract || ''),
    meta: page.fullurl ? 'Fiche disponible' : 'Fiche partielle',
    description: (page.extract || 'Description indisponible').slice(0, 220),
    url: page.fullurl || `https://fr.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
  }));
}

async function searchWikidata(query) {
  const url = new URL('https://www.wikidata.org/w/api.php');
  url.searchParams.set('origin', '*');
  url.searchParams.set('action', 'wbsearchentities');
  url.searchParams.set('format', 'json');
  url.searchParams.set('language', 'fr');
  url.searchParams.set('search', query);
  url.searchParams.set('type', 'item');
  url.searchParams.set('limit', '8');

  const res = await fetch(url);
  const data = await res.json();

  return (data.search || [])
    .filter((item) => /jeu|video game|roblox|fortnite|mode/i.test(item.description || ''))
    .map((item) => ({
      title: item.label,
      type: 'Entrée base de connaissances',
      source: 'Wikidata',
      upcoming: false,
      meta: item.id,
      description: item.description || 'Description non fournie.',
      url: item.concepturi,
    }));
}

function dedupe(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = normalize(item.title);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function runSearch() {
  const query = queryInput.value.trim();
  if (!query) {
    statusNode.textContent = 'Entre un nom de jeu pour lancer la recherche.';
    return;
  }

  statusNode.textContent = 'Recherche en cours...';

  const deep = deepSearchInput.checked;
  const upcomingOnly = upcomingOnlyInput.checked;

  let combined = [...localSearch(query)];

  if (deep) {
    try {
      const [wiki, wikidata] = await Promise.all([searchWikipedia(query), searchWikidata(query)]);
      combined = combined.concat(wiki, wikidata);
    } catch (error) {
      console.error(error);
      statusNode.textContent =
        'Recherche locale terminée, mais une source externe n’a pas répondu.';
    }
  }

  combined = dedupe(combined).filter((item) => {
    if (!upcomingOnly) return true;
    return Boolean(item.upcoming) || isFutureDate(item.meta);
  });

  const sorted = combined.sort((a, b) => {
    if (a.upcoming === b.upcoming) return a.title.localeCompare(b.title, 'fr');
    return a.upcoming ? -1 : 1;
  });

  render(sorted);

  if (!sorted.length) {
    statusNode.textContent = 'Aucun résultat avec les filtres actuels.';
  } else {
    statusNode.textContent = `${sorted.length} résultat(s) trouvé(s).`;
  }
}

searchBtn.addEventListener('click', runSearch);
queryInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') runSearch();
});

chips.forEach((chip) => {
  chip.addEventListener('click', () => {
    queryInput.value = chip.textContent;
    runSearch();
  });
});

render(localSearch('roblox'));
