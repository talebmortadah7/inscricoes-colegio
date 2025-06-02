// Adiciona um listener para o evento de submit do formulário
document.getElementById('registrationForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Impede o envio padrão do formulário

    // Aqui você faria o envio dos dados para um servidor real.
    // Por enquanto, vamos apenas simular o envio e mostrar uma mensagem.

    // Coleta os dados do formulário (apenas para demonstração)
    const formData = new FormData(this);
    const data = {};
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    console.log("Dados do formulário:", data);

    // Exibe a mensagem de confirmação
    const confirmationMessage = document.getElementById('confirmationMessage');
    confirmationMessage.classList.remove('hidden'); // Mostra a div de mensagem

    // Opcional: Limpa o formulário após o envio
    this.reset();

    // Opcional: Esconde a mensagem após alguns segundos
    setTimeout(() => {
        confirmationMessage.classList.add('hidden');
    }, 5000); // Esconde após 5 segundos
});
