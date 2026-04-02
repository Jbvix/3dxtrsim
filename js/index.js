/*
  Título: index.js
  Autor: Charlie Bravo
  Data da última modificação: 02/04/2026 09:25
  Versão: 1.0
  Descrição: Lógica de abas da Landing Page
*/

document.addEventListener('DOMContentLoaded', () => {
    // Lógica de navegação por abas
    const tabButtons = document.querySelectorAll('.tab-button');
    const contentPanels = document.querySelectorAll('.content-panel');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            contentPanels.forEach(panel => panel.classList.remove('active'));
            button.classList.add('active');
            const targetPanelId = button.getAttribute('data-target');
            document.getElementById(targetPanelId).classList.add('active');
        });
    });
});
