// Base visual: botão de desligar. As operações de encerramento foram removidas.
window.AjaModular.register('simulacao-desligar', [], function () {
    function open() {
        alert('Pegadinha: este botão é uma simulação. Nenhuma conversa foi encerrada.');
    }
    return {open};
});
