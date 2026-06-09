const BASE = 'https://api.github.com';

const $ = id => document.getElementById(id);

const input    = $('search-input');
const searchBtn= $('search-btn');
const loading  = $('loading');
const results  = $('results');
const errorBox = $('error-box');
const errorMsg = $('error-msg');
const sortSel  = $('sort-select');

const LANG_COLORS = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5',
  Java: '#b07219', 'C++': '#f34b7d', C: '#555555', 'C#': '#178600',
  Ruby: '#701516', Go: '#00ADD8', Rust: '#dea584', PHP: '#4F5D95',
  Swift: '#F05138', Kotlin: '#A97BFF', Shell: '#89e051', HTML: '#e34c26',
  CSS: '#563d7c', Vue: '#41b883', Dart: '#00B4AB', Scala: '#c22d40',
  R: '#198CE7', Lua: '#000080', Perl: '#0298c3', Elixir: '#6e4a7e',
};

let allRepos = [];

function showError(msg) {
  errorMsg.textContent = msg;
  errorBox.classList.remove('hidden');
}
function hideError() { errorBox.classList.add('hidden'); }
function showLoading() { loading.classList.remove('hidden'); }
function hideLoading() { loading.classList.add('hidden'); }
function showResults() { results.classList.remove('hidden'); }
function hideResults() { results.classList.add('hidden'); }

function fmtNum(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return n;
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  if (diff < 2592000) return Math.floor(diff / 86400) + 'd ago';
  if (diff < 31536000) return Math.floor(diff / 2592000) + 'mo ago';
  return Math.floor(diff / 31536000) + 'y ago';
}

function renderRepos(repos) {
  const grid = $('repos-grid');
  grid.innerHTML = '';

  if (!repos.length) {
    grid.innerHTML = '<p style="padding:2rem;color:var(--text-faint);font-family:var(--mono);font-size:0.8rem;">No public repositories found.</p>';
    return;
  }

  repos.forEach((repo, i) => {
    const card = document.createElement('div');
    card.className = 'repo-card';
    card.style.animationDelay = `${i * 0.04}s`;

    const langColor = repo.language ? (LANG_COLORS[repo.language] || '#8b8b8b') : null;
    const langHtml = repo.language
      ? `<span class="repo-lang">
           <span class="lang-dot" style="background:${langColor}"></span>
           ${repo.language}
         </span>`
      : '';

    const forkBadge = repo.fork ? `<span class="repo-fork-badge">fork</span>` : '';

    card.innerHTML = `
      <div class="repo-top">
        <a class="repo-name" href="${repo.html_url}" target="_blank" title="${repo.name}">${repo.name}</a>
        ${forkBadge}
      </div>
      <p class="repo-desc">${repo.description || '<span style="opacity:0.4;font-style:italic">No description</span>'}</p>
      <div class="repo-meta">
        ${langHtml}
        ${repo.stargazers_count > 0 ? `
        <span class="repo-stat">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          ${fmtNum(repo.stargazers_count)}
        </span>` : ''}
        ${repo.forks_count > 0 ? `
        <span class="repo-stat">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>
          ${fmtNum(repo.forks_count)}
        </span>` : ''}
        <span class="repo-updated">${timeAgo(repo.updated_at)}</span>
      </div>
    `;
    grid.appendChild(card);
  });
}

function sortRepos(repos, by) {
  const sorted = [...repos];
  if (by === 'stars') sorted.sort((a, b) => b.stargazers_count - a.stargazers_count);
  else if (by === 'updated') sorted.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  else if (by === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
  else if (by === 'forks') sorted.sort((a, b) => b.forks_count - a.forks_count);
  return sorted;
}

async function fetchUser(username) {
  const res = await fetch(`${BASE}/users/${username}`);
  if (res.status === 404) throw new Error(`User "${username}" not found.`);
  if (res.status === 403) throw new Error('Rate limit exceeded. Try again in a minute.');
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  return res.json();
}

async function fetchRepos(username) {
  const res = await fetch(`${BASE}/users/${username}/repos?per_page=100&sort=updated`);
  if (!res.ok) throw new Error(`Could not fetch repositories.`);
  return res.json();
}

function populateProfile(user) {
  $('avatar').src = user.avatar_url;
  $('avatar').alt = user.login;
  $('profile-name').textContent = user.name || user.login;
  $('profile-login').textContent = `@${user.login}`;
  $('profile-bio').textContent = user.bio || '';
  $('profile-link').href = user.html_url;

  $('stat-repos').textContent = fmtNum(user.public_repos);
  $('stat-followers').textContent = fmtNum(user.followers);
  $('stat-following').textContent = fmtNum(user.following);
  $('stat-gists').textContent = fmtNum(user.public_gists);

  const locEl = $('meta-location');
  if (user.location) {
    $('location-text').textContent = user.location;
    locEl.classList.remove('hidden');
  } else locEl.classList.add('hidden');

  const blogEl = $('meta-blog');
  if (user.blog) {
    const url = user.blog.startsWith('http') ? user.blog : `https://${user.blog}`;
    $('blog-link').href = url;
    $('blog-link').textContent = user.blog.replace(/^https?:\/\//, '');
    blogEl.classList.remove('hidden');
  } else blogEl.classList.add('hidden');

  const twEl = $('meta-twitter');
  if (user.twitter_username) {
    $('twitter-link').href = `https://twitter.com/${user.twitter_username}`;
    $('twitter-link').textContent = `@${user.twitter_username}`;
    twEl.classList.remove('hidden');
  } else twEl.classList.add('hidden');
}

async function search() {
  const username = input.value.trim();
  if (!username) { input.focus(); return; }

  hideError();
  hideResults();
  showLoading();

  try {
    const [user, repos] = await Promise.all([fetchUser(username), fetchRepos(username)]);

    populateProfile(user);

    allRepos = repos;
    const sorted = sortRepos(allRepos, sortSel.value);
    $('repos-count').textContent = sorted.length;
    renderRepos(sorted);

    hideLoading();
    showResults();
  } catch (err) {
    hideLoading();
    showError(err.message);
  }
}

searchBtn.addEventListener('click', search);
input.addEventListener('keydown', e => { if (e.key === 'Enter') search(); });
sortSel.addEventListener('change', () => {
  if (!allRepos.length) return;
  renderRepos(sortRepos(allRepos, sortSel.value));
});

input.focus();