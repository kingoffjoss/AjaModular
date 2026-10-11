// Shared dependencies: ajaStorage
window.AjaModular.register("notepad", [], function(ctx) {
return { mount(panel, notify) { // Notepad
                        const notepad = panel.querySelector('#tools-notepad');
                        notepad.value = ctx.ajaStorage.getItem('purecloudScript_notepad') || '';
                        notepad.addEventListener('input', (e) => { ctx.ajaStorage.setItem('purecloudScript_notepad', e.target.value); });

                        panel.querySelector('#btn-notepad-clear').onclick = () => { notepad.value = ''; notepad.dispatchEvent(new Event('input')); };
                        panel.querySelector('#btn-notepad-copy').onclick = async () => {
                            try {
                                await navigator.clipboard.writeText(notepad.value);
                                const btn = panel.querySelector('#btn-notepad-copy');
                                btn.innerText = '✅ Copiado';
                                setTimeout(() => btn.innerText = '📋 Copiar', 2000);
                            } catch (e) { notify("Erro ao copiar", "error"); }
                        };

                        panel.querySelector('#btn-notepad-fetch').onclick = () => {
                            let rawText = document.body.innerText + " ";
                            document.querySelectorAll('iframe').forEach(ifr => {
                                try { rawText += " " + (ifr.contentDocument || ifr.contentWindow.document).body.innerText + " "; } catch (e) { }
                            });

                            let nome = "Cliente", cpf = "Não encontrado", prot = "Não encontrado", tel = "Não encontrado";

                            const cpfMatch = rawText.match(/(?:CPF|CNPJ)[\s:]*([\d\.\-\/]+)/i) || rawText.match(/\d{3}\.\d{3}\.\d{3}\-\d{2}/);
                            if (cpfMatch) cpf = (cpfMatch[1] || cpfMatch[0]).replace(/[^\d\.\-\/]/g, '');

                            const protMatch = rawText.match(/(?:Protocolo)[\s:]*(\d{10,})/i) || rawText.match(/202[456]\d{8,}/);
                            if (protMatch) prot = protMatch[1] || protMatch[0];

                            const telMatch = rawText.match(/(?:Telefone|Celular|Contato)[\s:]*(\(?\d{2}\)?\s?\d{4,5}-?\d{4})/i);
                            if (telMatch) tel = (telMatch[1] || telMatch[0]).trim();

                            const nameMatch = rawText.match(/(?:Nome|Cliente|Titular)[\s:]*([A-ZÀ-Ú][a-zà-ú]+(?:[ ]+[A-ZÀ-Úa-zà-ú]+)+)/i);
                            if (nameMatch) nome = nameMatch[1].trim();

                            const contentToAppend = `👤 Nome: ${nome}\n🆔 CPF/CNPJ: ${cpf}\n📱 Tel: ${tel}\n🎫 Prot: ${prot}\n\n`;
                            notepad.value = contentToAppend + notepad.value;
                            notepad.dispatchEvent(new Event('input'));

                            const btn = panel.querySelector('#btn-notepad-fetch');
                            btn.innerText = '✅ Feito';
                            setTimeout(() => btn.innerText = '📎 Puxar', 2000);
                        };

                         } };
});
