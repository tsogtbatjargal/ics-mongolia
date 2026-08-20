const navLinks = document.querySelectorAll('.nav-links a');
const sections = document.querySelectorAll('main section');
const navToggle = document.querySelector('.nav-toggle');
const navList = document.querySelector('.nav-links');

if (navToggle && navList) {
  navToggle.addEventListener('click', () => {
    navList.classList.toggle('open');
  });
}

navLinks.forEach((link) => {
  link.addEventListener('click', () => {
    if (navList) {
      navList.classList.remove('open');
    }
  });
});

if (sections.length && 'IntersectionObserver' in window) {
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
}

const contactForms = document.querySelectorAll('.contact-form');

contactForms.forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const recipients = form.dataset.recipients || '';
    const data = new FormData(form);
    const name = (data.get('name') || '').toString();
    const email = (data.get('email') || '').toString();
    const company = (data.get('company') || '').toString();
    const message = (data.get('message') || '').toString();

    const subject = `Website inquiry from ${name || 'website visitor'}`;
    const bodyLines = [
      `Name: ${name}`,
      `Email: ${email}`,
      company ? `Company: ${company}` : null,
      '',
      message,
    ].filter((line) => line !== null);

    const mailto = `mailto:${recipients}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;
    window.location.href = mailto;
  });
});

const approachButtons = document.querySelectorAll('.approach-step');
const approachDescription = document.getElementById('approach-description');

approachButtons.forEach((button) => {
  button.addEventListener('click', () => {
    approachButtons.forEach((btn) => btn.classList.remove('active'));
    button.classList.add('active');
    if (approachDescription && button.dataset.description) {
      approachDescription.textContent = button.dataset.description;
    }
  });
});
