const modal = document.getElementById('modal');
const trailerBtn = document.getElementById('trailerBtn');
const closeModal = document.getElementById('closeModal');

trailerBtn.addEventListener('click', () => {
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
});

const hideModal = () => {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
};

closeModal.addEventListener('click', hideModal);

modal.addEventListener('click', (event) => {
  if (event.target === modal) {
    hideModal();
  }
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    hideModal();
  }
});
