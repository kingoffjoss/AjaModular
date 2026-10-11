window.AjaModular.register("links-uteis", [], function(ctx) {
return { mount(panel, USEFUL_LINKS) { // Populando Links Úteis
                        const linksList = panel.querySelector('#useful-links-list');
                        USEFUL_LINKS.forEach(link => {
                            const btn = document.createElement('button'); btn.className = 'purecloud-script-button';
                            btn.style.cssText = `text-align:center; padding: 10px; background:${link.color}; color:#fff; border:none; margin-bottom: 5px; font-weight: bold;`;
                            btn.textContent = link.title;
                            btn.onclick = () => window.open(link.url, '_blank');
                            linksList.appendChild(btn);
                        });

                         } };
});
