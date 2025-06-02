// Importa as funções necessárias do Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, onSnapshot, query } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Variáveis globais do ambiente (fornecidas pelo Canvas)
// '__app_id', '__firebase_config' e '__initial_auth_token' são injetadas pelo ambiente Canvas.
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

let db;
let auth;
let userId = null; // Para armazenar o UID do usuário autenticado

// Elementos do DOM
const studentsTableBody = document.getElementById('studentsTableBody');
const loadingMessage = document.getElementById('loadingMessage');
const noStudentsMessage = document.getElementById('noStudentsMessage');

// Função para formatar a data para exibição
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Formata a data para o padrão local (ex: DD/MM/AAAA)
    return date.toLocaleDateString('pt-BR');
}

// Função principal para inicializar o Firebase e carregar os dados
async function initializeFirebaseAndLoadData() {
    console.log("Iniciando initializeFirebaseAndLoadData em inscritos.js...");
    try {
        // 1. Inicializa o aplicativo Firebase
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        console.log("Firebase app, db, auth inicializados com sucesso.");

        // 2. Autentica o usuário
        // Usamos onAuthStateChanged para garantir que a autenticação esteja completa
        // antes de tentar acessar o Firestore.
        await new Promise((resolve) => {
            onAuthStateChanged(auth, async (user) => {
                if (!user) {
                    console.log("Usuário não autenticado. Tentando autenticar (anonimamente ou com token)...");
                    try {
                        if (initialAuthToken) {
                            // Tenta autenticar com o token personalizado fornecido pelo ambiente
                            await signInWithCustomToken(auth, initialAuthToken);
                            console.log("Autenticado com token personalizado.");
                        } else {
                            // Se não houver token, autentica anonimamente
                            await signInAnonymously(auth);
                            console.log("Autenticado anonimamente.");
                        }
                    } catch (error) {
                        console.error("Erro na autenticação Firebase:", error);
                        // Exibir uma mensagem de erro na UI para o usuário seria ideal aqui
                    }
                }
                // Garante que userId tenha um valor, seja o UID do usuário ou um UUID aleatório
                userId = auth.currentUser?.uid || crypto.randomUUID();
                console.log("UserID atual após autenticação:", userId);
                resolve(); // Resolve a Promise para que o código continue
            });
        });

        // 3. Define o caminho da coleção no Firestore
        // Seguindo as diretrizes de armazenamento público no Canvas
        const collectionPath = `artifacts/${appId}/public/data/inscricoes`;
        console.log("Caminho da coleção Firestore a ser observada:", collectionPath);
        const q = query(collection(db, collectionPath));

        // 4. Configura o listener onSnapshot para atualizações em tempo real
        console.log("Configurando listener onSnapshot para a coleção...");
        onSnapshot(q, (snapshot) => {
            console.log("Dados do Firestore recebidos (onSnapshot). Número de documentos:", snapshot.size);
            studentsTableBody.innerHTML = ''; // Limpa o conteúdo atual da tabela

            // Esconde a mensagem de carregamento
            loadingMessage.classList.add('hidden');

            // Verifica se a coleção está vazia
            if (snapshot.empty) {
                noStudentsMessage.classList.remove('hidden'); // Mostra a mensagem "Nenhum inscrito ainda."
                console.log("Nenhum documento encontrado na coleção 'inscricoes'.");
                return; // Sai da função se não houver dados
            }

            // Se houver dados, esconde a mensagem de "nenhum inscrito"
            noStudentsMessage.classList.add('hidden');

            // Itera sobre cada documento (inscrito) e adiciona à tabela
            snapshot.forEach((doc) => {
                const student = doc.data(); // Obtém os dados do documento
                console.log("Processando documento do inscrito:", student);

                const row = document.createElement('tr');
                row.className = 'border-b border-gray-200 hover:bg-gray-100';

                // Preenche a linha da tabela com os dados do inscrito
                // 'student.nome' é o campo que contém o nome completo do aluno
                // 'student.nivelCurso' é o campo que contém o nível do curso
                row.innerHTML = `
                    <td class="py-3 px-6 text-left whitespace-nowrap">${student.nome || 'N/A'}</td>
                    <td class="py-3 px-6 text-left">${formatDate(student.dataNascimento) || 'N/A'}</td>
                    <td class="py-3 px-6 text-left">${student.nivelCurso || 'N/A'}</td>
                    <td class="py-3 px-6 text-left">${student.email || 'N/A'}</td>
                    <td class="py-3 px-6 text-left">${student.telefone || 'N/A'}</td>
                    <td class="py-3 px-6 text-left text-xs break-all">${student.userId || 'N/A'}</td>
                `;
                studentsTableBody.appendChild(row); // Adiciona a linha à tabela
            });
        }, (error) => {
            // Lida com erros que ocorrem durante a escuta do Firestore
            console.error("Erro ao carregar inscritos do Firestore (onSnapshot callback):", error);
            loadingMessage.classList.add('hidden');
            noStudentsMessage.classList.remove('hidden');
            noStudentsMessage.textContent = "Erro ao carregar dados. Por favor, tente novamente.";
        });

    } catch (error) {
        // Lida com erros que ocorrem durante a inicialização geral do Firebase
        console.error("Erro crítico na inicialização do Firebase ou carregamento de dados:", error);
        loadingMessage.classList.add('hidden');
        noStudentsMessage.classList.remove('hidden');
        noStudentsMessage.textContent = "Erro crítico. Não foi possível carregar os dados. Verifique o console.";
    }
}

// Inicia o carregamento de dados quando a página é completamente carregada
window.onload = initializeFirebaseAndLoadData;