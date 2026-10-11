// Shared dependencies: none
window.AjaModular.register("ui-createNotification", [], function(ctx) {
const implementation = {createNotification(message, type = 'info', duration = 3000) {
            let c = document.getElementById('purecloud-script-notification-container');
            if (!c) { c = document.createElement('div'); c.id = 'purecloud-script-notification-container'; document.body.appendChild(c); }
            const n = document.createElement("div"); n.textContent = message; n.className = `purecloud-script-notification purecloud-script-notification-${type}`; c.prepend(n); const v = document.querySelectorAll('#purecloud-script-notification-container .purecloud-script-notification'); if (v.length > 5) { v[v.length - 1].remove(); } setTimeout(() => { n.style.opacity = '0'; n.style.transform = 'translateX(100%)'; setTimeout(() => n.remove(), 300); }, duration);
        }};
ctx.UI.createNotification = implementation.createNotification;
});
