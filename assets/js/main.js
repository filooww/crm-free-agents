import { randomize } from './demo.js';
import { tryDemo } from './panel.js';

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

document.getElementById('try-btn').onclick = tryDemo;
document.getElementById('demo-btn').onclick = () => {
  document.getElementById('demo').scrollIntoView({ behavior: 'smooth' });
};
document.getElementById('randomize-btn').onclick = randomize;

const copyBtn = document.getElementById('copy-btn');
if (copyBtn) {
  copyBtn.onclick = async () => {
    try {
      const res = await fetch('bookmarklet.js');
      const code = await res.text();
      await navigator.clipboard.writeText(code);
      copyBtn.textContent = '✓ Copied!';
      copyBtn.classList.add('copied');
      setTimeout(() => {
        copyBtn.textContent = 'Copy bookmarklet';
        copyBtn.classList.remove('copied');
      }, 2000);
    } catch (err) {
      console.error(err);
    }
  };
}

randomize();
