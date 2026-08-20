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

    const productImg = doc.querySelector('.ai-product-image');
    if (productImg && p.image) {
      productImg.setAttribute('src', imgSrc(p.image));
      productImg.setAttribute('alt', p.image_alt || '');
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

  // ── Results (case studies + testimonials) ────────────────────────────────
  const rs = c.results;
  if (rs) {
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

buildPage('en');
buildPage('mn');
buildProductPage('en');
buildProductPage('mn');
