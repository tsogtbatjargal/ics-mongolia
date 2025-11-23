const navLinks = document.querySelectorAll('.nav-links a');
const sections = document.querySelectorAll('main section');
const navToggle = document.querySelector('.nav-toggle');
const navList = document.querySelector('.nav-links');
const stepDescriptions = {
  Discover:
    'Free assessments covering alarm floods, loop health, instrument reliability, and HMI usability to target quick wins.',
  Define:
    'Scope, P&IDs, risk controls, and phased plans that balance production windows with business-backed outcomes.',
  Deliver:
    'Co-develop, test, and commission upgrades with operators involved—no surprises for control room or field teams.',
  Review:
    'Compare before/after KPIs, lock in procedures, and transfer knowledge so crews own the improvement.'
};

navToggle.addEventListener('click', () => {
  navList.classList.toggle('open');
});

navLinks.forEach((link) => {
  link.addEventListener('click', () => {
    navList.classList.remove('open');
  });
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navLinks.forEach((link) => link.classList.remove('active'));
        const active = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
        if (active) {
          active.classList.add('active');
        }
      }
    });
  },
  { threshold: 0.35 }
);

sections.forEach((section) => observer.observe(section));

const approachButtons = document.querySelectorAll('.approach-step');
const approachDescription = document.getElementById('approach-description');

approachButtons.forEach((button) => {
  button.addEventListener('click', () => {
    approachButtons.forEach((btn) => btn.classList.remove('active'));
    button.classList.add('active');
    const key = button.dataset.step;
    approachDescription.textContent = stepDescriptions[key];
  });
});

const form = document.getElementById('contact-form');
const status = document.querySelector('.form-status');

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const name = formData.get('name');
  status.textContent = `Thanks, ${name || 'there'}! We will respond within one business day.`;
  form.reset();
});
