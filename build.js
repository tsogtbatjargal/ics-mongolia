#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { JSDOM } = require('jsdom');

function imgSrc(p) {
  return String(p).startsWith('/') ? '..' + p : p;
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

  // ── Footer ────────────────────────────────────────────────────────────────
  setText(doc.querySelector('.footer p'), c.footer.copyright);
  setText(doc.querySelector('.footer a'), c.footer.back_to_top);

  fs.writeFileSync(htmlPath, dom.serialize());
  console.log(`✓ ${lang}/index.html`);
}

buildPage('en');
buildPage('mn');
