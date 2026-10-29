// The native disclosure handles pointer, Enter, and Space activation.
const toolsMenu = document.querySelector('.tools-menu');
if (toolsMenu) {
  const summary = toolsMenu.querySelector('summary');
  document.addEventListener('pointerdown', event => {
    if (!toolsMenu.contains(event.target)) toolsMenu.open = false;
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toolsMenu.open) {
      event.preventDefault();
      toolsMenu.open = false;
      summary.focus();
    }
  });
  toolsMenu.addEventListener('focusout', event => {
    if (event.relatedTarget && !toolsMenu.contains(event.relatedTarget)) toolsMenu.open = false;
  });
  toolsMenu.querySelector('a').addEventListener('click', () => { toolsMenu.open = false; });
}
