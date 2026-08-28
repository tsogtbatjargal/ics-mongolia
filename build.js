#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { JSDOM } = require('jsdom');

function imgSrc(p) {
  return String(p).startsWith('/') ? '..' + p : p;
}

// Same as imgSrc but for pages nested 3 levels deep (e.g. en/products/ics-fod/index.html).
function imgSrcDeep(p) {
  return String(p).startsWith('/') ? '../../..' + p : p;
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Lucide icon paths (MIT, https://lucide.dev) — same family as brand-kit/icons.
// Keyed by the `icon:` value on each problems item in content/*.yml.
const PROBLEM_ICONS = {
  alert:
    '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  trend:
    '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  droplet:
    '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
  wrench:
    '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  swap:
    '<path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/>',
  boxes:
    '<path d="M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z"/><path d="m7 16.5-4.74-2.85"/><path d="m7 16.5 5-3"/><path d="M7 16.5v5.17"/><path d="M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z"/><path d="m17 16.5-5-3"/><path d="m17 16.5 4.74-2.85"/><path d="M17 16.5v5.17"/><path d="M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z"/><path d="M12 8 7.26 5.15"/><path d="m12 8 4.74-2.85"/><path d="M12 13.5V8"/>',
};

const COST_ICON =
  '<circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/>';

function svg(paths) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths}</svg>`;
}

// Renders the six "problems solved" cards. Shared by the homepage and the
// products index page.
function renderProblems(items) {
  return items.map(item => `
          <article class="problem-card">
            <div class="problem-head">
              <div class="problem-icon">${svg(PROBLEM_ICONS[item.icon] || PROBLEM_ICONS.alert)}</div>
              <h3>${esc(item.title)}</h3>
            </div>
            <p>${esc(item.text)}</p>${item.cost ? `
            <div class="problem-cost">${svg(COST_ICON)}<span>${esc(item.cost)}</span></div>` : ''}
          </article>`).join('');
}

// Renders the six product cards. `linked` controls whether each card gets its
// "read more" link — the products index page repeats the cards without them.
function renderProducts(items, linked = true) {
  return items.map(item => `
          <article class="product-card" id="${esc(String(item.name).toLowerCase())}">
            <div class="product-card-head">
              <span class="product-index">${esc(item.index)}</span>
              <h3 class="product-name">${esc(item.name)}</h3>
            </div>
            <div class="product-card-body">
              <p class="product-subtitle">${esc(item.subtitle)}</p>
              <ul class="product-points">
                ${item.points.map(pt => `<li>${esc(pt)}</li>`).join('\n                ')}
              </ul>${linked && item.url ? `
              <a class="product-link" href="${esc(item.url)}">${esc(item.link_label || item.name)}</a>` : ''}
            </div>
          </article>`).join('');
}

function renderPartners(items) {
  return items.map(item => `
          <article class="partner-card">
            <div class="partner-logo-slot">${item.logo
              ? `<img src="${esc(imgSrc(item.logo))}" alt="${esc(item.logo_alt || item.name)}">`
              : `<span class="partner-wordmark">${esc(item.wordmark || item.name)}</span>`}</div>${item.badge ? `
            <span class="partner-badge">${svg('<path d="M20 6 9 17l-5-5"/>')}${esc(item.badge)}</span>` : ''}
            <h3>${esc(item.name)}</h3>
            <p>${esc(item.text)}</p>${Array.isArray(item.links) && item.links.length ? `
            <div class="partner-links">
              ${item.links.map(l => `<a href="${esc(l.url)}"${/^https?:/.test(l.url) ? ' target="_blank" rel="noopener"' : ''}>${esc(l.label)}</a>`).join('\n              ')}
            </div>` : ''}
          </article>`).join('');
}

// Swaps the still screenshot for the demo video when `video:` is set on the
// product, keeping the screenshot as the poster frame.
function renderProductMedia(p, srcFor = imgSrc) {
  if (p.video) {
    return `
            <video
              class="ai-product-video"
              controls
              muted
              loop
              playsinline
              preload="none"
              ${p.video_poster ? `poster="${esc(srcFor(p.video_poster))}"` : ''}
            >
              <source src="${esc(srcFor(p.video))}" type="video/mp4">
            </video>${p.video_caption ? `
            <figcaption>${esc(p.video_caption)}</figcaption>` : ''}`;
  }
  return `
            <picture>
              <source srcset="${esc(srcFor(String(p.image).replace(/\.(png|jpe?g)$/, '.webp')))}" type="image/webp">
              <img class="ai-product-image" src="${esc(srcFor(p.image))}" alt="${esc(p.image_alt || '')}" loading="lazy">
            </picture>`;
}

function setText(el, text) {
  if (el && text != null) el.textContent = String(text);
}

function buildPage(lang) {
  const c = yaml.load(
    fs.readFileSync(path.join(__dirname, 'content', `${lang}.yml`), 'utf8')
  );
  const htmlPath = path.join(__dirname, lang, 'index.html');
  const dom = new JSDOM(fs.readFileSync(htmlPath, 'utf8'));
  const doc = dom.window.document;

  // ── Meta ──────────────────────────────────────────────────────────────────
  doc.documentElement.lang = c.language.code;

  const logoImg = doc.querySelector('a.logo img');
  if (logoImg) logoImg.setAttribute('alt', c.company.short_name);

  // Navigation
  const navLinks = doc.querySelectorAll('.nav-links > li:not(.language-switch) a');
  c.navigation.forEach((item, i) => {
    if (navLinks[i]) {
      navLinks[i].textContent = item.label;
      navLinks[i].setAttribute('href', item.url);
    }
  });

  // ── Hero ──────────────────────────────────────────────────────────────────
  const h = c.hero;
  setText(doc.querySelector('.hero-copy .eyebrow'), h.eyebrow);
  setText(doc.querySelector('.hero-copy h1'), h.title);
  setText(doc.querySelector('.hero-copy .lede'), h.lede);

  const primaryBtn = doc.querySelector('.hero-cta .btn.primary');
  if (primaryBtn) {
    primaryBtn.textContent = h.primary_cta.label;
    primaryBtn.setAttribute('href', h.primary_cta.url);
  }
  const ghostBtn = doc.querySelector('.hero-cta .btn.ghost');
  if (ghostBtn) {
    ghostBtn.textContent = h.secondary_cta.label;
    ghostBtn.setAttribute('href', h.secondary_cta.url);
  }

  const heroImg = doc.querySelector('.hero-photo img');
  if (heroImg) {
    heroImg.setAttribute('src', imgSrc(h.image));
    heroImg.setAttribute('alt', h.image_alt);
  }

  const photoSpans = doc.querySelectorAll('.photo-label span:not(.dot)');
  if (photoSpans[0]) photoSpans[0].textContent = h.photo_label;
  if (photoSpans[1]) photoSpans[1].textContent = h.photo_meta;

  const statsContainer = doc.querySelector('.hero-stats');
  if (statsContainer && Array.isArray(h.stats)) {
    statsContainer.innerHTML = h.stats.map(stat => `
        <li>
          <span>${esc(stat.value)}</span>
          <p>${esc(stat.text)}</p>
        </li>`).join('');
  }

  // ── Overview ──────────────────────────────────────────────────────────────
  const ov = c.overview;
  setText(doc.querySelector('#overview .eyebrow'), ov.eyebrow);
  setText(doc.querySelector('#overview h2'), ov.title);
  setText(doc.querySelector('#overview .section-header p:not(.eyebrow)'), ov.text);

  // ── Problems solved ───────────────────────────────────────────────────────
  const pr = c.problems;
  if (pr) {
    setText(doc.querySelector('#problems .eyebrow'), pr.eyebrow);
    setText(doc.querySelector('#problems h2'), pr.title);
    setText(doc.querySelector('#problems .section-header p:not(.eyebrow)'), pr.text);

    const problemsGrid = doc.querySelector('.problems-grid');
    if (problemsGrid && Array.isArray(pr.items)) {
      problemsGrid.innerHTML = renderProblems(pr.items);
    }
  }

  // ── Products ──────────────────────────────────────────────────────────────
  const pd = c.products;
  if (pd) {
    setText(doc.querySelector('#products .eyebrow'), pd.eyebrow);
    setText(doc.querySelector('#products h2'), pd.title);
    setText(doc.querySelector('#products .section-header p:not(.eyebrow)'), pd.text);

    const productsGrid = doc.querySelector('.products-grid');
    if (productsGrid && Array.isArray(pd.items)) {
      productsGrid.innerHTML = renderProducts(pd.items);
    }

    const productsCta = doc.querySelector('.products-cta');
    if (productsCta && pd.cta_label) {
      productsCta.textContent = pd.cta_label;
      productsCta.setAttribute('href', pd.cta_url);
    }
  }

  // ── Services ──────────────────────────────────────────────────────────────
  const sv = c.services;
  setText(doc.querySelector('#services .eyebrow'), sv.eyebrow);
  setText(doc.querySelector('#services h2'), sv.title);
  setText(doc.querySelector('#services .section-header p:not(.eyebrow)'), sv.text);

  const servicesGrid = doc.querySelector('.services-grid');
  if (servicesGrid) {
    servicesGrid.innerHTML = sv.items.map(item => `
          <article class="card service-card">
            <div class="service-icon">${esc(item.icon)}</div>
            <div>
              <h3>${esc(item.title)}</h3>
              <p>${esc(item.text)}</p>
              <div class="tag-row">
                ${item.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('\n                ')}
              </div>
            </div>
          </article>`).join('');
  }

  // ── AI Solutions ──────────────────────────────────────────────────────────
  const ai = c.ai_solutions;
  if (ai) {
    setText(doc.querySelector('#ai-solutions .eyebrow'), ai.eyebrow);
    setText(doc.querySelector('#ai-solutions h2'), ai.title);
    setText(doc.querySelector('#ai-solutions .ai-intro'), ai.intro);

    const p = ai.product || {};
    const productLogo = doc.querySelector('.ai-product-logo');
    if (productLogo && p.logo) {
      productLogo.setAttribute('src', imgSrc(p.logo));
      productLogo.setAttribute('alt', p.logo_alt || p.name || '');
    }
    setText(doc.querySelector('.ai-product-name'), p.name);
    setText(doc.querySelector('.ai-product-tagline'), p.tagline);
    setText(doc.querySelector('.ai-product-description'), p.description);

    const productMedia = doc.querySelector('.ai-product-media');
    if (productMedia && (p.video || p.image)) {
      productMedia.innerHTML = renderProductMedia(p);
    }

    const featGrid = doc.querySelector('.ai-features');
    if (featGrid && Array.isArray(p.features)) {
      featGrid.innerHTML = p.features.map(f => `
          <article class="card ai-feature">
            <h3>${esc(f.title)}</h3>
            <p>${esc(f.text)}</p>
          </article>`).join('');
    }

    const pageCta = doc.querySelector('.ai-product-page-cta');
    if (pageCta && p.page_cta_label) {
      pageCta.textContent = p.page_cta_label;
      pageCta.setAttribute('href', p.page_cta_url);
    }
  }

  // ── Approach ──────────────────────────────────────────────────────────────
  const ap = c.approach;
  setText(doc.querySelector('#approach .eyebrow'), ap.eyebrow);
  setText(doc.querySelector('#approach h2'), ap.title);
  setText(doc.querySelector('.approach-detail h3'), ap.detail_title);
  setText(doc.querySelector('.approach-highlight p'), ap.highlight);

  const stepsContainer = doc.querySelector('.steps');
  if (stepsContainer) {
    stepsContainer.innerHTML = ap.steps.map((step, i) => `
            <button
              class="approach-step${i === 0 ? ' active' : ''}"
              data-description="${esc(step.description)}"
            >
              <span>${esc(step.number)}</span>
              <div>
                <h3>${esc(step.title)}</h3>
                <p>${esc(step.summary)}</p>
              </div>
            </button>`).join('');
  }

  if (ap.steps[0]) {
    setText(doc.querySelector('#approach-description'), ap.steps[0].description);
  }

  // ── Partners & distribution ───────────────────────────────────────────────
  const pt = c.partners;
  if (pt) {
    setText(doc.querySelector('#partners .eyebrow'), pt.eyebrow);
    setText(doc.querySelector('#partners h2'), pt.title);
    setText(doc.querySelector('#partners .section-header p:not(.eyebrow)'), pt.text);

    const partnerGrid = doc.querySelector('.partner-grid');
    if (partnerGrid && Array.isArray(pt.items)) {
      partnerGrid.innerHTML = renderPartners(pt.items);
    }
  }

  // ── Results (case studies + testimonials) ────────────────────────────────
  const rs = c.results;
  if (rs) {
    // Section can be hidden site-wide (nav link + content) via content/*.yml's
    // results.enabled: false, without deleting the underlying copy — flip it back
    // to true and rebuild to bring it back.
    const resultsSection = doc.querySelector('#results');
    const resultsNavLink = doc.querySelector('.nav-links a[href="#results"]');
    const resultsHidden = rs.enabled === false;
    if (resultsSection) resultsSection.hidden = resultsHidden;
    if (resultsNavLink) {
      const navItem = resultsNavLink.closest('li');
      if (navItem) navItem.hidden = resultsHidden;
    }

    setText(doc.querySelector('#results .eyebrow'), rs.eyebrow);
    setText(doc.querySelector('#results h2'), rs.title);
    setText(doc.querySelector('#results .section-header p:not(.eyebrow)'), rs.text);

    const subheads = doc.querySelectorAll('#results .results-subhead');
    const subtexts = doc.querySelectorAll('#results .results-subtext');
    setText(subheads[0], rs.case_studies_title);
    setText(subtexts[0], rs.case_studies_text);
    setText(subheads[1], rs.testimonials_title);
    setText(subtexts[1], rs.testimonials_text);

    const caseGrid = doc.querySelector('.case-studies-grid');
    if (caseGrid && Array.isArray(rs.case_studies)) {
      caseGrid.innerHTML = rs.case_studies.map(cs => `
          <article class="card case-card">
            <p class="eyebrow">${esc(cs.category)}</p>
            <h3>${esc(cs.client)}</h3>
            <p>${esc(cs.description)}</p>
            <div class="case-stats">
              <div class="case-stat"><b>${esc(cs.stat_1_value)}</b><span>${esc(cs.stat_1_label)}</span></div>
              <div class="case-stat"><b>${esc(cs.stat_2_value)}</b><span>${esc(cs.stat_2_label)}</span></div>
            </div>
          </article>`).join('');
    }

    const testGrid = doc.querySelector('.testimonials-grid');
    if (testGrid && Array.isArray(rs.testimonials)) {
      testGrid.innerHTML = rs.testimonials.map(t => `
          <article class="card quote-card">
            <span class="quote-mark">&quot;</span>
            <p class="quote-text">${esc(t.quote)}</p>
            <div class="quote-attribution">
              <div class="avatar">??</div>
              <div><span class="quote-name">${esc(t.name)}</span><span class="muted-text">${esc(t.role)}</span></div>
            </div>
          </article>`).join('');
    }
  }

  // ── Team ──────────────────────────────────────────────────────────────────
  const tm = c.team;
  setText(doc.querySelector('#team .eyebrow'), tm.eyebrow);
  setText(doc.querySelector('#team h2'), tm.title);
  setText(doc.querySelector('#team .section-header p:not(.eyebrow)'), tm.text);

  const teamGrid = doc.querySelector('#team .cards');
  if (teamGrid) {
    teamGrid.innerHTML = tm.members.map(member => `
          <article class="card team-card">
            <div class="team-head">
              <div class="avatar">${esc(member.initials)}</div>
              <div>
                <h3>${esc(member.name)}</h3>
                <p>${esc(member.role)}</p>
              </div>
            </div>
            <p>${esc(member.bio)}</p>${member.details ? `
            <p class="muted-text">${esc(member.details)}</p>` : ''}
          </article>`).join('');
  }

  // ── Contact ───────────────────────────────────────────────────────────────
  const ct = c.contact;
  setText(doc.querySelector('#contact .eyebrow'), ct.eyebrow);
  setText(doc.querySelector('#contact h2'), ct.title);
  setText(doc.querySelector('#contact .section-header p:not(.eyebrow)'), ct.text);
  setText(doc.querySelector('.contact-panel h3'), ct.direct_title);

  const contactList = doc.querySelector('.contact-list');
  if (contactList) {
    contactList.innerHTML = ct.people.map(person => `
                <li>
                  <span>${esc(person.name)}</span>
                  <a href="mailto:${esc(person.email)}">${esc(person.email)}</a>
                  <span class="contact-meta">${esc(person.phone)}</span>
                </li>`).join('');
  }

  if (ct.form) {
    const f = ct.form;
    setText(doc.querySelector('.contact-form-title'), f.title);
    setText(doc.querySelector('label[data-field="name"] .field-label'), f.name_label);
    setText(doc.querySelector('label[data-field="email"] .field-label'), f.email_label);
    setText(doc.querySelector('label[data-field="company"] .field-label'), f.company_label);
    setText(doc.querySelector('label[data-field="message"] .field-label'), f.message_label);

    const nameInput = doc.querySelector('input[name="name"]');
    if (nameInput) nameInput.setAttribute('placeholder', f.name_placeholder);
    const emailInput = doc.querySelector('input[name="email"]');
    if (emailInput) emailInput.setAttribute('placeholder', f.email_placeholder);
    const companyInput = doc.querySelector('input[name="company"]');
    if (companyInput) companyInput.setAttribute('placeholder', f.company_placeholder);
    const messageInput = doc.querySelector('textarea[name="message"]');
    if (messageInput) messageInput.setAttribute('placeholder', f.message_placeholder);

    setText(doc.querySelector('.contact-form button[type="submit"]'), f.submit_label);
    setText(doc.querySelector('.contact-form-note'), f.note);

    const contactForm = doc.querySelector('.contact-form');
    if (contactForm) {
      contactForm.setAttribute('data-recipients', ct.people.map(p => p.email).join(','));
    }
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  setText(doc.querySelector('.footer p'), c.footer.copyright);
  setText(doc.querySelector('.footer a'), c.footer.back_to_top);

  fs.writeFileSync(htmlPath, dom.serialize());
  console.log(`✓ ${lang}/index.html`);
}

function buildProductPage(lang) {
  const c = yaml.load(
    fs.readFileSync(path.join(__dirname, 'content', `${lang}.yml`), 'utf8')
  );
  const p = c.ai_solutions.product;
  const pp = p.product_page;
  if (!pp) return;

  const htmlPath = path.join(__dirname, lang, 'products', 'ics-fod', 'index.html');
  const dom = new JSDOM(fs.readFileSync(htmlPath, 'utf8'));
  const doc = dom.window.document;

  // ── Meta ──────────────────────────────────────────────────────────────────
  doc.documentElement.lang = c.language.code;

  // Nav labels only — hrefs stay as cross-page links (e.g. "/en/#overview"),
  // not the homepage's same-page anchors, so they aren't overwritten here.
  const navLinks = doc.querySelectorAll('.nav-links > li:not(.language-switch) a');
  c.navigation.forEach((item, i) => {
    if (navLinks[i]) navLinks[i].textContent = item.label;
  });

  if (pp.meta_title) {
    doc.title = pp.meta_title;
    const ogTitle = doc.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', pp.meta_title);
    const twTitle = doc.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.setAttribute('content', pp.meta_title);
  }
  if (pp.meta_description) {
    const metaDesc = doc.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', pp.meta_description);
    const ogDesc = doc.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', pp.meta_description);
    const twDesc = doc.querySelector('meta[name="twitter:description"]');
    if (twDesc) twDesc.setAttribute('content', pp.meta_description);
  }

  // ── Hero ──────────────────────────────────────────────────────────────────
  setText(doc.querySelector('.hero-copy .eyebrow'), pp.hero_eyebrow);
  setText(doc.querySelector('.hero-copy h1'), pp.hero_title);
  setText(doc.querySelector('.hero-copy .lede'), pp.hero_lede);

  const primaryBtn = doc.querySelector('.hero-cta .btn.primary');
  if (primaryBtn && pp.primary_cta) {
    primaryBtn.textContent = pp.primary_cta.label;
    primaryBtn.setAttribute('href', pp.primary_cta.url);
  }
  const ghostBtn = doc.querySelector('.hero-cta .btn.ghost');
  if (ghostBtn && pp.secondary_cta) {
    ghostBtn.textContent = pp.secondary_cta.label;
    ghostBtn.setAttribute('href', pp.secondary_cta.url);
  }

  const heroImg = doc.querySelector('.hero-photo img');
  if (heroImg && p.image) {
    heroImg.setAttribute('src', imgSrcDeep(p.image));
    heroImg.setAttribute('alt', p.image_alt || '');
  }
  const heroSource = doc.querySelector('.hero-photo source');
  if (heroSource && p.image) {
    heroSource.setAttribute('srcset', imgSrcDeep(p.image).replace(/\.(png|jpe?g)$/, '.webp'));
  }

  const photoSpans = doc.querySelectorAll('.photo-label span:not(.dot)');
  if (photoSpans[0]) photoSpans[0].textContent = p.name;
  if (photoSpans[1]) photoSpans[1].textContent = p.tagline;

  // ── Intro ─────────────────────────────────────────────────────────────────
  setText(doc.querySelector('#intro .eyebrow'), pp.intro_eyebrow);
  setText(doc.querySelector('#intro h2'), pp.intro_title);
  setText(doc.querySelector('#intro .section-header p:not(.eyebrow)'), p.description);

  const featGrid = doc.querySelector('#intro .ai-features');
  if (featGrid && Array.isArray(p.features)) {
    featGrid.innerHTML = p.features.map(f => `
          <article class="card ai-feature">
            <h3>${esc(f.title)}</h3>
            <p>${esc(f.text)}</p>
          </article>`).join('');
  }

  // ── Specs ─────────────────────────────────────────────────────────────────
  setText(doc.querySelector('#specs .eyebrow'), pp.specs_eyebrow);
  setText(doc.querySelector('#specs h2'), pp.specs_title);
  setText(doc.querySelector('#specs .section-header p:not(.eyebrow)'), pp.specs_text);

  const specTable = doc.querySelector('.spec-table tbody');
  if (specTable && Array.isArray(pp.specs)) {
    specTable.innerHTML = pp.specs.map(s => `
            <tr><th>${esc(s.label)}</th><td>${esc(s.value)}</td></tr>`).join('');
  }

  // ── How it works ──────────────────────────────────────────────────────────
  setText(doc.querySelector('#how-it-works .eyebrow'), pp.how_it_works_eyebrow);
  setText(doc.querySelector('#how-it-works h2'), pp.how_it_works_title);

  const howSteps = doc.querySelector('.how-steps');
  if (howSteps && Array.isArray(pp.how_it_works)) {
    howSteps.innerHTML = pp.how_it_works.map((step, i) => `
          <div class="how-step">
            <div class="num">${i + 1}</div>
            <div>
              <h3>${esc(step.title)}</h3>
              <p>${esc(step.text)}</p>
            </div>
          </div>`).join('');
  }

  // ── Contact CTA ───────────────────────────────────────────────────────────
  setText(doc.querySelector('#page-contact .eyebrow'), pp.contact_eyebrow);
  setText(doc.querySelector('#page-contact h2'), pp.contact_title);
  setText(doc.querySelector('#page-contact .section-header p:not(.eyebrow)'), pp.contact_text);

  const contactPrimaryBtn = doc.querySelector('#page-contact .btn.primary');
  if (contactPrimaryBtn) contactPrimaryBtn.textContent = pp.contact_cta_label;
  const backHomeBtn = doc.querySelector('#page-contact .btn.ghost');
  if (backHomeBtn) backHomeBtn.textContent = pp.back_to_home_label;

  fs.mkdirSync(path.dirname(htmlPath), { recursive: true });
  fs.writeFileSync(htmlPath, dom.serialize());
  console.log(`✓ ${lang}/products/ics-fod/index.html`);
}

// Products index page (en|mn)/products/index.html — repeats the problem cards and
// the full product catalogue so each module has a linkable anchor of its own.
function buildProductsIndex(lang) {
  const c = yaml.load(
    fs.readFileSync(path.join(__dirname, 'content', `${lang}.yml`), 'utf8')
  );
  const pd = c.products;
  const ip = pd && pd.index_page;
  if (!ip) return;

  const htmlPath = path.join(__dirname, lang, 'products', 'index.html');
  const dom = new JSDOM(fs.readFileSync(htmlPath, 'utf8'));
  const doc = dom.window.document;

  doc.documentElement.lang = c.language.code;

  const logoImg = doc.querySelector('a.logo img');
  if (logoImg) logoImg.setAttribute('alt', c.company.short_name);

  // Nav labels only — hrefs stay as cross-page links back to the homepage.
  const navLinks = doc.querySelectorAll('.nav-links > li:not(.language-switch) a');
  c.navigation.forEach((item, i) => {
    if (navLinks[i]) navLinks[i].textContent = item.label;
  });

  if (ip.meta_title) {
    doc.title = ip.meta_title;
    const ogTitle = doc.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', ip.meta_title);
    const twTitle = doc.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.setAttribute('content', ip.meta_title);
  }
  if (ip.meta_description) {
    for (const sel of [
      'meta[name="description"]',
      'meta[property="og:description"]',
      'meta[name="twitter:description"]',
    ]) {
      const el = doc.querySelector(sel);
      if (el) el.setAttribute('content', ip.meta_description);
    }
  }

  // ── Hero ────────────────────────────────────────────────────────────────
  setText(doc.querySelector('.hero-copy .eyebrow'), ip.hero_eyebrow);
  setText(doc.querySelector('.hero-copy h1'), ip.hero_title);
  setText(doc.querySelector('.hero-copy .lede'), ip.hero_lede);

  const primaryBtn = doc.querySelector('.hero-cta .btn.primary');
  if (primaryBtn && ip.primary_cta) {
    primaryBtn.textContent = ip.primary_cta.label;
    primaryBtn.setAttribute('href', ip.primary_cta.url);
  }
  const ghostBtn = doc.querySelector('.hero-cta .btn.ghost');
  if (ghostBtn && ip.secondary_cta) {
    ghostBtn.textContent = ip.secondary_cta.label;
    ghostBtn.setAttribute('href', ip.secondary_cta.url);
  }

  // ── Catalogue ───────────────────────────────────────────────────────────
  setText(doc.querySelector('#catalogue .eyebrow'), ip.catalogue_eyebrow);
  setText(doc.querySelector('#catalogue h2'), ip.catalogue_title);
  setText(doc.querySelector('#catalogue .section-header p:not(.eyebrow)'), ip.catalogue_text);

  const productsGrid = doc.querySelector('.products-grid');
  if (productsGrid && Array.isArray(pd.items)) {
    productsGrid.innerHTML = renderProducts(pd.items);
  }

  // ── Problems ────────────────────────────────────────────────────────────
  setText(doc.querySelector('#why .eyebrow'), ip.problems_eyebrow);
  setText(doc.querySelector('#why h2'), ip.problems_title);
  setText(doc.querySelector('#why .section-header p:not(.eyebrow)'), ip.problems_text);

  const problemsGrid = doc.querySelector('.problems-grid');
  if (problemsGrid && c.problems && Array.isArray(c.problems.items)) {
    problemsGrid.innerHTML = renderProblems(c.problems.items);
  }

  // ── Contact CTA ─────────────────────────────────────────────────────────
  setText(doc.querySelector('#page-contact .eyebrow'), ip.contact_eyebrow);
  setText(doc.querySelector('#page-contact h2'), ip.contact_title);
  setText(doc.querySelector('#page-contact .section-header p:not(.eyebrow)'), ip.contact_text);

  const contactPrimaryBtn = doc.querySelector('#page-contact .btn.primary');
  if (contactPrimaryBtn) contactPrimaryBtn.textContent = ip.contact_cta_label;
  const backHomeBtn = doc.querySelector('#page-contact .btn.ghost');
  if (backHomeBtn) backHomeBtn.textContent = ip.back_to_home_label;

  setText(doc.querySelector('.footer p'), c.footer.copyright);
  setText(doc.querySelector('.footer a'), c.footer.back_to_top);

  fs.mkdirSync(path.dirname(htmlPath), { recursive: true });
  fs.writeFileSync(htmlPath, dom.serialize());
  console.log(`✓ ${lang}/products/index.html`);
}

buildPage('en');
buildPage('mn');
buildProductsIndex('en');
buildProductsIndex('mn');
buildProductPage('en');
buildProductPage('mn');
