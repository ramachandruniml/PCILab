const RESOURCES = [
  {
    title: 'Living with Chronic Pain',
    category: 'Self-management',
    description: 'A broad collection of chronic pain education, support ideas, and advocacy resources from the U.S. Pain Foundation.',
    url: 'https://uspainfoundation.org/resources/'
  },
  {
    title: 'Mayo Clinic Anxiety Coach',
    category: 'Self-management',
    description: 'Helpful for calming the stress and anxiety that can come with pain flare-ups, uncertainty, and health-related worry.',
    url: 'https://anxietycoach.mayoclinic.org/'
  },
  {
    title: 'ACPA Guide to Chronic Pain',
    category: 'Planning',
    description: 'A structured guide from the American Chronic Pain Association with foundational education and action-oriented advice.',
    url: 'https://www.acpanow.com/acpa-stanford-guide.html#/'
  },
  {
    title: 'ACPA Communication Guide',
    category: 'Planning',
    description: 'Useful for organizing your thoughts, asking better questions, and communicating pain experiences more clearly.',
    url: 'https://www.acpanow.com/communication-guide.html#/'
  },
  {
    title: 'Preparing for a Provider Visit',
    category: 'Planning',
    description: 'Talking points and preparation tips to help make medical visits more focused, productive, and less overwhelming.',
    url: 'https://painmanagementcollaboratory.org/talking-points-preparing-for-a-provider-visit/'
  }
];

const FILTERS = ['All', 'Self-management', 'Planning'];

const searchInput = document.getElementById('resourceSearch');
const filterChips = document.getElementById('filterChips');
const resultsMeta = document.getElementById('resultsMeta');
const resourceList = document.getElementById('resourceList');

let activeFilter = 'All';

renderFilterChips();
renderResources();

searchInput.addEventListener('input', renderResources);

function renderFilterChips() {
  filterChips.innerHTML = '';

  FILTERS.forEach(function(filter) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chip';
    button.textContent = filter;
    button.classList.toggle('active', filter === activeFilter);
    button.addEventListener('click', function() {
      activeFilter = filter;
      renderFilterChips();
      renderResources();
    });
    filterChips.appendChild(button);
  });
}

function renderResources() {
  const query = searchInput.value.trim().toLowerCase();
  const filteredResources = RESOURCES.filter(function(resource) {
    const matchesFilter = activeFilter === 'All' || resource.category === activeFilter;
    const searchableText = [resource.title, resource.category, resource.description].join(' ').toLowerCase();
    const matchesSearch = searchableText.indexOf(query) !== -1;

    return matchesFilter && matchesSearch;
  });

  resultsMeta.textContent = filteredResources.length + ' resource' + (filteredResources.length === 1 ? '' : 's') + ' shown';

  if (!filteredResources.length) {
    resourceList.innerHTML = "<div class='empty-state'>No resources match that search. Try a broader word or switch filters.</div>";
    return;
  }

  resourceList.innerHTML = '';

  filteredResources.forEach(function(resource) {
    const card = document.createElement('a');
    card.className = 'resource-card';
    card.href = resource.url;
    card.target = '_blank';
    card.rel = 'noopener noreferrer';

    card.innerHTML =
      "<div class='resource-top'>" +
        "<div class='resource-title'>" + escapeHtml(resource.title) + "</div>" +
        "<div class='resource-tag'>" + escapeHtml(resource.category) + "</div>" +
      "</div>" +
      "<div class='resource-description'>" + escapeHtml(resource.description) + "</div>" +
      "<div class='resource-link'>Open Resource</div>";

    resourceList.appendChild(card);
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
