const toggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  toggle.setAttribute('aria-expanded', 'false');
  navigation.classList.remove('open');
}
toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('open', open);
});
navigation.addEventListener('click', event => {
  if (event.target.closest('a')) closeMenu();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    toggle.focus();
  }
});
document.addEventListener('click', event => {
  if (!event.target.closest('.header')) closeMenu();
});
window.matchMedia('(min-width: 761px)').addEventListener('change', closeMenu);
const filters = document.querySelectorAll('[data-filter]');
const projects = document.querySelectorAll('[data-category]');
filters.forEach(button => button.addEventListener('click', () => {
  filters.forEach(filter => {
    filter.classList.toggle('active', filter === button);
    filter.setAttribute('aria-pressed', String(filter === button));
  });
  let count = 0;
  projects.forEach(project => {
    project.hidden = button.dataset.filter !== 'all' && !project.dataset.category.split(' ').includes(button.dataset.filter);
    if (!project.hidden) count++;
  });
  document.querySelector('#filter-status').textContent = `${count} projets affichés`;
}));
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navigation.querySelectorAll('a').forEach(link => {
          if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      }
    });
  }, { rootMargin: '-15% 0px -65% 0px' });
  document.querySelectorAll('main section[id]').forEach(section => observer.observe(section));
}

// Le portrait publié est assets/portrait.jpg. L’éditeur reste local.
const portrait = document.querySelector('#portrait');
const photoEditor = document.querySelector('.portrait-editor');
const photoInput = document.querySelector('#photo-input');
const photoStatus = document.querySelector('#photo-status');
const photoExport = document.querySelector('#photo-export');
const photoReset = document.querySelector('#photo-reset');
const photoKey = 'cherif-portrait-preview';
const canEditPhoto = ['localhost', '127.0.0.1', ''].includes(location.hostname) || new URLSearchParams(location.search).get('edit') === 'photo';
const updatePortrait = () => { portrait.hidden = !portrait.naturalWidth; };
portrait.addEventListener('load', updatePortrait);
portrait.addEventListener('error', () => { portrait.hidden = true; });
if (portrait.complete) updatePortrait();
function showPhotoPreview(data) {
  portrait.src = data;
  photoExport.href = data;
  photoExport.hidden = false;
  photoReset.hidden = false;
  photoStatus.textContent = 'Aperçu dans ce navigateur. Pour l’afficher pour tous, enregistre portrait.jpg dans le dossier assets du site.';
}
if (canEditPhoto) {
  photoEditor.hidden = false;
  try {
    const saved = localStorage.getItem(photoKey);
    if (saved && saved.startsWith('data:image/jpeg;base64,')) showPhotoPreview(saved);
  } catch { /* L’éditeur fonctionne aussi sans stockage navigateur. */ }
}
let photoVersion = 0;
photoInput.addEventListener('change', async () => {
  const file = photoInput.files[0];
  if (!file) return;
  const version = ++photoVersion;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 15 * 1024 * 1024) {
    photoStatus.textContent = 'Choisis une image JPG, PNG ou WebP de moins de 15 Mo.';
    photoInput.value = '';
    return;
  }
  const url = URL.createObjectURL(file);
  try {
    const source = new Image();
    source.src = url;
    await source.decode();
    if (version !== photoVersion) return;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 640;
    const context = canvas.getContext('2d');
    context.fillStyle = '#fafaf6';
    context.fillRect(0, 0, 640, 640);
    const side = Math.min(source.naturalWidth, source.naturalHeight);
    context.drawImage(source, (source.naturalWidth - side) / 2, (source.naturalHeight - side) / 2, side, side, 0, 0, 640, 640);
    const data = canvas.toDataURL('image/jpeg', 0.9);
    showPhotoPreview(data);
    try { localStorage.setItem(photoKey, data); }
    catch { photoStatus.textContent += ' Cet aperçu ne pourra pas être conservé après fermeture.'; }
  } catch {
    photoStatus.textContent = 'Cette image ne peut pas être lue. Essaie un autre fichier.';
  } finally {
    URL.revokeObjectURL(url);
    photoInput.value = '';
  }
});
photoReset.addEventListener('click', () => {
  photoVersion++;
  try { localStorage.removeItem(photoKey); } catch { /* Stockage indisponible. */ }
  portrait.hidden = true;
  portrait.src = 'assets/portrait.jpg';
  photoExport.hidden = true;
  photoExport.removeAttribute('href');
  photoReset.hidden = true;
  photoStatus.textContent = 'Choisis une photo JPG, PNG ou WebP.';
});
