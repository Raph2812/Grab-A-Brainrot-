const toast = document.querySelector('#toast');
const showToast = (message) => { toast.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2600); };

document.querySelectorAll('.feed-tab').forEach((tab) => tab.addEventListener('click', () => {
  document.querySelector('.feed-tab.active').classList.remove('active');
  tab.classList.add('active');
  const copy = { foryou: 'Une sélection adaptée à votre rythme.', following: 'Tous vos calendriers sont affichés.', upcoming: 'Vos prochains rendez-vous sont mis en avant.' };
  showToast(copy[tab.dataset.feed]);
}));
document.querySelectorAll('.nav-link').forEach((link) => link.addEventListener('click', () => {
  document.querySelector('.nav-link.active').classList.remove('active'); link.classList.add('active');
}));
document.querySelector('#createButton').addEventListener('click', () => showToast('Nouveau rendez-vous créé — choisissez un créneau.'));
document.querySelector('#focusButton').addEventListener('click', (event) => { event.currentTarget.textContent = 'Session en cours · 25 min'; showToast('Mode focus activé. Bonne concentration !'); });
document.querySelector('#tasksButton').addEventListener('click', () => showToast('4 tâches à finaliser cette semaine.'));
