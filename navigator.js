const INCLUDED_CATEGORIES = [
      "Physical Therapy (PT)",
      "Occupational Therapy (OT)",
      "Chiropractic Care",
      "Massage Therapy",
      "Acupuncture",
      "Therapeutic Exercise Programs",
      "Pain Rehabilitation Programs",
      "Post-injury Functional Rehabilitation",
      "Exercise Groups",
      "Yoga Programs",
      "Mental Health Counseling",
      "Psychologists",
      "Nutrition Counseling",
      "Sleep Hygiene Programs",
      "Weight Management"
    ];

    const NPPES_API_URL = "/api/nppes";
    const NPPES_API_VERSION = "2.1";
    const DEFAULT_RESULT_LIMIT = 25;
    const CATEGORY_SEARCH_TERMS = {
      "Physical Therapy (PT)": ["Physical Therapist*"],
      "Occupational Therapy (OT)": ["Occupational Therapist*"],
      "Chiropractic Care": ["Chiropractor*"],
      "Massage Therapy": ["Massage Therapist*"],
      "Acupuncture": ["Acupuncturist*"],
      "Therapeutic Exercise Programs": ["Physical Therapist*", "Rehabilitation*"],
      "Pain Rehabilitation Programs": ["Rehabilitation*", "Pain Medicine*"],
      "Post-injury Functional Rehabilitation": ["Rehabilitation*", "Physical Therapist*"],
      "Exercise Groups": ["Physical Therapist*", "Recreation Therapist*"],
      "Yoga Programs": ["Physical Therapist*", "Occupational Therapist*"],
      "Mental Health Counseling": ["Counselor*", "Clinical Social Worker*"],
      "Psychologists": ["Psychologist*"],
      "Nutrition Counseling": ["Dietitian, Registered*", "Nutritionist*"],
      "Sleep Hygiene Programs": ["Sleep Specialist*", "Psychologist*"],
      "Weight Management": ["Dietitian, Registered*", "Obesity Medicine*"]
    };

    const RECENT_SEARCHES_KEY = "painCareRecentSearches";
    const zipInput = document.getElementById("zip");
    const categorySelect = document.getElementById("category");
    const resultsContainer = document.getElementById("results");
    const errorContainer = document.getElementById("error");
    const zipHint = document.getElementById("zipHint");
    const toast = document.getElementById("toast");

    populateCategoryFilter();
    renderQuickCategories();
    renderRecentSearches();
    bindEvents();
    renderWelcomeState();

    function bindEvents() {
      document.getElementById("findCareBtn").addEventListener("click", findCare);
      document.getElementById("resetFiltersBtn").addEventListener("click", resetFilters);

      zipInput.addEventListener("input", function() {
        zipInput.value = zipInput.value.replace(/\D/g, "").slice(0, 5);
        validateZip(true);
      });

      zipInput.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
          event.preventDefault();
          findCare();
        }
      });

      categorySelect.addEventListener("change", function() {
        updateActiveQuickCategory(categorySelect.value);
      });
    }

    function populateCategoryFilter() {
      INCLUDED_CATEGORIES.forEach(function(category) {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
      });
    }

    function renderQuickCategories() {
      const container = document.getElementById("quickCategories");
      const quickItems = INCLUDED_CATEGORIES.slice(0, 6);

      container.innerHTML = "<div class='toolbar-bottom'><div><label>Popular categories</label><div class='chip-group' id='quickCategoryChips'></div></div></div>";

      const chipHost = document.getElementById("quickCategoryChips");
      quickItems.forEach(function(category) {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "chip";
        chip.textContent = category;
        chip.addEventListener("click", function() {
          categorySelect.value = category;
          updateActiveQuickCategory(category);
          zipInput.focus();
        });
        chipHost.appendChild(chip);
      });
    }

    function updateActiveQuickCategory(activeCategory) {
      const chips = document.querySelectorAll("#quickCategoryChips .chip");
      chips.forEach(function(chip) {
        chip.classList.toggle("active", chip.textContent === activeCategory);
      });
    }

  function validateZip(isTyping) {
    const zip = zipInput.value.trim();

    if (!zip) {
      zipHint.textContent = "Use any 5-digit ZIP code.";
      if (!isTyping) {
        errorContainer.textContent = "";
      }
        return false;
      }

      if (zip.length < 5) {
        zipHint.textContent = "Keep going. A full ZIP code has 5 digits.";
        return false;
      }

      zipHint.textContent = "ZIP code looks good.";
      errorContainer.textContent = "";
      return true;
    }

    async function findCare() {
      const zip = zipInput.value.trim();
      const selectedCategory = categorySelect.value;

      errorContainer.textContent = "";
      resultsContainer.innerHTML = "";

      if (zip.length !== 5 || isNaN(zip)) {
        errorContainer.textContent = "Please enter a valid 5-digit ZIP code.";
        zipHint.textContent = "A ZIP code should contain exactly 5 numbers.";
        zipInput.focus();
        return;
      }

      showLoadingState(selectedCategory);

      try {
        const filteredResources = await fetchNppesResources(zip, selectedCategory);
        saveRecentSearch(zip, selectedCategory);
        renderRecentSearches();
        showResults(filteredResources, zip, selectedCategory);
      } catch (error) {
        errorContainer.textContent = "We couldn't load live NPPES results right now. Please try again in a moment.";
        resultsContainer.innerHTML =
          "<div class='empty-state'><strong>Live provider search is temporarily unavailable.</strong><br>" +
          "Try the same ZIP again, or choose a different category.</div>";
      }
    }

    function showLoadingState(selectedCategory) {
      const loadingMessage = selectedCategory === "All Categories"
        ? "Looking through supportive care options near your ZIP code..."
        : "Finding " + selectedCategory + " options near your ZIP code...";

      resultsContainer.innerHTML = "<div class='loading-state'>" + loadingMessage + "</div>";
    }

    function showResults(resources, zip, selectedCategory) {
      const resultsLabel = selectedCategory === "All Categories"
        ? resources.length + " resources found near " + zip
        : resources.length + " " + selectedCategory + " resources found near " + zip;
      const noMatchesMessage = selectedCategory === "All Categories"
        ? "No matches found near " + zip + ". Try a different category or clear the filters."
        : "No matches found for " + selectedCategory + " near " + zip + ".";

      if (resources.length === 0) {
        resultsContainer.innerHTML =
          "<div class='empty-state'><strong>No exact matches yet.</strong><br>" +
          noMatchesMessage +
          "</div>";
        return;
      }

      resultsContainer.innerHTML =
        "<p class='results-title'>" + resultsLabel + "</p>" +
        "<div class='toolbar'>" +
          "<div class='toolbar-top'>" +
            "<input id='resultSearch' class='toolbar-search' type='text' placeholder='Search by clinic, address, or description'>" +
            "<select id='sortResults' class='toolbar-select'>" +
              "<option value='recommended'>Sort: Recommended</option>" +
              "<option value='name-asc'>Sort: A to Z</option>" +
              "<option value='category-count'>Sort: Most services</option>" +
            "</select>" +
          "</div>" +
        "</div>" +
        "<div id='resultCards'></div>" +
        "<p class='note'>Showing live public NPI Registry data from CMS NPPES for ZIP " + escapeHtml(zip) + ". NPI data does not by itself confirm licensing or credentialing.</p>";

      const state = {
        zip: zip,
        selectedCategory: selectedCategory,
        resources: resources.slice()
      };

      renderResultCards(state.resources, state.selectedCategory);

      document.getElementById("resultSearch").addEventListener("input", function(event) {
        applyResultFilters(state, event.target.value, document.getElementById("sortResults").value);
      });

      document.getElementById("sortResults").addEventListener("change", function(event) {
        applyResultFilters(state, document.getElementById("resultSearch").value, event.target.value);
      });
    }

    function applyResultFilters(state, searchTerm, sortMode) {
      const query = searchTerm.trim().toLowerCase();
      let filtered = state.resources.filter(function(resource) {
        const haystack = [
          resource.name,
          resource.address,
          resource.description,
          resource.categories.join(" ")
        ].join(" ").toLowerCase();

        return haystack.indexOf(query) !== -1;
      });

      filtered = sortResources(filtered, sortMode);
      renderResultCards(filtered, state.selectedCategory, query);
    }

    function sortResources(resources, sortMode) {
      const sorted = resources.slice();

      if (sortMode === "name-asc") {
        sorted.sort(function(a, b) {
          return a.name.localeCompare(b.name);
        });
      } else if (sortMode === "category-count") {
        sorted.sort(function(a, b) {
          return b.categories.length - a.categories.length;
        });
      }

      return sorted;
    }

    async function fetchNppesResources(zip, selectedCategory) {
      const searchTerms = selectedCategory === "All Categories"
        ? [""]
        : getSearchTermsForCategory(selectedCategory);
      const requests = searchTerms.slice(0, 3).map(function(term) {
        return fetchNppesSearch(zip, term);
      });
      const responses = await Promise.all(requests);
      const deduped = new Map();

      responses.forEach(function(results) {
        results.forEach(function(resource) {
          if (!deduped.has(resource.npi)) {
            deduped.set(resource.npi, resource);
          }
        });
      });

      return Array.from(deduped.values());
    }

    function getSearchTermsForCategory(category) {
      return CATEGORY_SEARCH_TERMS[category] || [""];
    }

    async function fetchNppesSearch(zip, taxonomyDescription) {
      const params = new URLSearchParams();
      params.set("version", NPPES_API_VERSION);
      params.set("postal_code", zip);
      params.set("limit", String(DEFAULT_RESULT_LIMIT));

      if (taxonomyDescription) {
        params.set("taxonomy_description", taxonomyDescription);
      }

      const response = await fetch(NPPES_API_URL + "?" + params.toString());

      if (!response.ok) {
        throw new Error("NPPES request failed with status " + response.status);
      }

      const payload = await response.json();
      const results = Array.isArray(payload.results) ? payload.results : [];

      return results
        .map(function(item) {
          return normalizeNppesResult(item);
        })
        .filter(Boolean);
    }

    function normalizeNppesResult(item) {
      const basic = item.basic || {};
      const address = getPreferredAddress(item.addresses || []);
      const name = getProviderName(item);
      const phone = getProviderPhone(address, basic);
      const categories = getProviderCategories(item);

      if (!name) {
        return null;
      }

      return {
        npi: String(item.number || ""),
        name: name,
        address: formatAddress(address),
        phone: phone || "Phone not listed",
        categories: categories.length ? categories : ["Provider"],
        description: buildProviderDescription(item, categories)
      };
    }

    function getPreferredAddress(addresses) {
      const locationAddress = addresses.find(function(address) {
        return address.address_purpose === "LOCATION";
      });

      return locationAddress || addresses[0] || null;
    }

    function getProviderName(item) {
      const basic = item.basic || {};

      if (basic.organization_name) {
        return basic.organization_name;
      }

      const parts = [
        basic.name_prefix,
        basic.first_name,
        basic.middle_name,
        basic.last_name,
        basic.name_suffix
      ].filter(Boolean);

      return parts.join(" ").replace(/\s+/g, " ").trim();
    }

    function getProviderPhone(address, basic) {
      return (address && address.telephone_number) || basic.authorized_official_telephone_number || "";
    }

    function getProviderCategories(item) {
      const taxonomies = Array.isArray(item.taxonomies) ? item.taxonomies : [];
      const descriptions = taxonomies
        .map(function(taxonomy) {
          return taxonomy.desc;
        })
        .filter(Boolean);

      return descriptions.filter(function(description, index) {
        return descriptions.indexOf(description) === index;
      }).slice(0, 3);
    }

    function buildProviderDescription(item, categories) {
      const basic = item.basic || {};
      const enumerationType = item.enumeration_type === "NPI-2"
        ? "Organization"
        : "Individual provider";
      const primaryCategory = categories[0] || "Healthcare Provider";
      const credential = basic.credential ? " Credential: " + basic.credential + "." : "";

      return enumerationType + " listed in the CMS NPPES registry under " + primaryCategory + "." + credential;
    }

    function formatAddress(address) {
      if (!address) {
        return "Address not listed";
      }

      const cityStatePostal = [
        [address.city, address.state].filter(Boolean).join(", "),
        address.postal_code
      ].filter(Boolean).join(" ");
      const parts = [
        address.address_1,
        address.address_2,
        cityStatePostal
      ].filter(Boolean);

      return parts.join(", ");
    }

    function renderResultCards(resources, selectedCategory, query) {
      const cardHost = document.getElementById("resultCards");

      if (!resources.length) {
        cardHost.innerHTML =
          "<div class='empty-state'>No results match your search" +
          (query ? " for <strong>" + escapeHtml(query) + "</strong>." : ".") +
          "</div>";
        return;
      }

      cardHost.innerHTML = "";

      resources.forEach(function(resource) {
        const card = document.createElement("div");
        const primaryCategory = selectedCategory === "All Categories"
          ? resource.categories[0]
          : selectedCategory;
        const phoneDigits = resource.phone.replace(/[^\d]/g, "");
        const telLink = phoneDigits ? "tel:" + phoneDigits : "#";
        const hasAddress = resource.address !== "Address not listed";
        const mapQuery = encodeURIComponent(resource.address);
        const callAction = phoneDigits
          ? "<a class='card-link primary' href='" + telLink + "'>Call</a>"
          : "<button class='card-link primary' type='button' disabled>No phone listed</button>";
        const directionsAction = hasAddress
          ? "<a class='card-link' target='_blank' rel='noopener noreferrer' href='https://www.google.com/maps/search/?api=1&query=" + mapQuery + "'>Directions</a>"
          : "<button class='card-link' type='button' disabled>No address listed</button>";
        const copyAction = phoneDigits
          ? "<button class='card-link' type='button' data-copy-phone='" + escapeHtml(resource.phone) + "'>Copy Phone</button>"
          : "";

        card.className = "card";
        card.innerHTML =
          "<div class='card-head'>" +
            "<div>" +
              "<h3>" + escapeHtml(resource.name) + "</h3>" +
              "<div class='meta'>" + escapeHtml(resource.address) + " &middot; " + escapeHtml(resource.phone) + "</div>" +
            "</div>" +
            "<div class='badge'>" + escapeHtml(primaryCategory) + "</div>" +
          "</div>" +
          "<div class='categories'>Services: " + escapeHtml(resource.categories.join(", ")) + "</div>" +
          "<div class='desc'>" + escapeHtml(resource.description) + "</div>" +
          "<div class='card-actions'>" +
            callAction +
            directionsAction +
            copyAction +
          "</div>";

        cardHost.appendChild(card);
      });

      bindCopyButtons();
    }

    function bindCopyButtons() {
      const buttons = document.querySelectorAll("[data-copy-phone]");

      buttons.forEach(function(button) {
        button.addEventListener("click", function() {
          const phone = button.getAttribute("data-copy-phone");

          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(phone).then(function() {
              showToast("Phone number copied: " + phone);
            }).catch(function() {
              showToast("Unable to copy automatically. Number: " + phone);
            });
          } else {
            showToast("Copy not supported here. Number: " + phone);
          }
        });
      });
    }

    function saveRecentSearch(zip, category) {
      const recentSearches = getRecentSearches().filter(function(entry) {
        return !(entry.zip === zip && entry.category === category);
      });

      recentSearches.unshift({
        zip: zip,
        category: category
      });

      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recentSearches.slice(0, 4)));
    }

    function getRecentSearches() {
      try {
        return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]");
      } catch (error) {
        return [];
      }
    }

    function renderRecentSearches() {
      const container = document.getElementById("recentSearches");
      const recentSearches = getRecentSearches();

      if (!recentSearches.length) {
        container.innerHTML = "";
        return;
      }

      container.innerHTML = "<div class='toolbar-bottom'><div><label>Recent searches</label><div class='chip-group' id='recentSearchChips'></div></div></div>";

      const chipHost = document.getElementById("recentSearchChips");
      recentSearches.forEach(function(entry) {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "chip";
        chip.textContent = entry.zip + " - " + shortenCategory(entry.category);
        chip.title = entry.category;
        chip.addEventListener("click", function() {
          zipInput.value = entry.zip;
          categorySelect.value = entry.category;
          updateActiveQuickCategory(entry.category);
          findCare();
        });
        chipHost.appendChild(chip);
      });
    }

    function shortenCategory(category) {
      return category === "All Categories" ? "All" : category;
    }

  function resetFilters() {
    zipInput.value = "";
    categorySelect.value = "All Categories";
    updateActiveQuickCategory("All Categories");
    errorContainer.textContent = "";
    zipHint.textContent = "Use any 5-digit ZIP code.";
    renderWelcomeState();
    zipInput.focus();
  }

    function renderWelcomeState() {
      resultsContainer.innerHTML =
        "<div class='empty-state'><strong>Start with your ZIP code.</strong><br>We'll show pain care resources, then let you search and sort the results.</div>";
    }

    function showToast(message) {
      toast.textContent = message;
      toast.classList.add("visible");

      window.clearTimeout(showToast.timeoutId);
      showToast.timeoutId = window.setTimeout(function() {
        toast.classList.remove("visible");
      }, 2200);
    }

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

