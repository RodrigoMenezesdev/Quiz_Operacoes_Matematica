let operacaoSelecionada = '';
let nivelSelecionado = 1; 
let numProblemasTotal = 0;
let problemasGerados = [];
let problemaAtualIndex = 0;
let pontuacao = 0;
let logRespostas = []; 

// Variáveis do Cronômetro
let tempoRestante = 0; 
let timer; 

// CONTROLE DE ÁUDIO
const musicaFundo = document.getElementById('musicaFundo');
let musicaIniciada = false; 
let volumeAtual = 0.10; // 📢 Nível inicial ajustado para 10%
let volumeLigado = true; // Estado inicial

// Mapeamento de elementos HTML
const operacaoSelecaoDiv = document.getElementById('operacao-selecao');
const nivelSelecaoDiv = document.getElementById('nivel-selecao');
const configFinalDiv = document.getElementById('config-final');
const areaJogoDiv = document.getElementById('area-jogo');
const feedbackDiv = document.getElementById('feedback');
const resultadoDiv = document.getElementById('resultado');

const instrucaoNivelH2 = document.getElementById('instrucao-nivel');
const jogoInstrucaoP = document.getElementById('jogo-instrucao');
const numProblemasInput = document.getElementById('num-problemas-input');
const contadorProblemasP = document.getElementById('contador-problemas');
const perguntaExpressaoH2 = document.getElementById('pergunta-expressao');
const opcoesRespostasDiv = document.getElementById('opcoes-respostas');
const feedbackTextoP = document.getElementById('feedback-texto');
const resultadoFinalTituloH2 = document.getElementById('resultado-final-titulo');
const pontuacaoFinalP = document.getElementById('pontuacao-final');
const detalhesProblemasDiv = document.getElementById('detalhes-problemas');
const cronometroDisplay = document.getElementById('cronometro-display'); 

// ====================================================================
// FUNÇÃO DE ÁUDIO
// ====================================================================

function tocarMusica() {
    if (!musicaIniciada && musicaFundo && volumeLigado) {
        musicaFundo.volume = volumeAtual;
        musicaFundo.play().then(() => {
            musicaIniciada = true;
        }).catch(error => {
            console.log("Falha ao iniciar a música automaticamente:", error);
        });
    }
}

// ====================================================================
// FUNÇÃO DE CONTROLE DE VOLUME (ATUALIZADA)
// ====================================================================

function alternarVolume() {
    const botaoVolume = document.getElementById('botao-volume');

    // Toca a música no primeiro clique (se ainda não tiver iniciado)
    tocarMusica(); 

    if (volumeLigado) {
        // Desligar volume
        musicaFundo.volume = 0;
        volumeLigado = false;
        if (botaoVolume) {
            botaoVolume.innerHTML = "🔇"; // Ícone de mudo
        }
    } else {
        // Ligar volume
        musicaFundo.volume = volumeAtual; 
        volumeLigado = true;
        if (botaoVolume) {
            botaoVolume.innerHTML = "🎶"; // Ícone de som
        }
    }
}

// ====================================================================
// FUNÇÕES DE CONTROLE DE FLUXO DA UI (Interface do Usuário)
// ====================================================================

/**
 * Função Segura para mostrar uma seção e esconder todas as outras.
 */
function mostrarSecao(secaoParaMostrar) {
    pararCronometro(); 
    
    // Esconde todas as seções (Com cheque de segurança)
    if (operacaoSelecaoDiv) operacaoSelecaoDiv.style.display = 'none';
    if (nivelSelecaoDiv) nivelSelecaoDiv.style.display = 'none';
    if (configFinalDiv) configFinalDiv.style.display = 'none';
    if (areaJogoDiv) areaJogoDiv.style.display = 'none';
    if (feedbackDiv) feedbackDiv.style.display = 'none';
    if (resultadoDiv) resultadoDiv.style.display = 'none';

    // Mostra a seção desejada (Com cheque de segurança)
    if (secaoParaMostrar) secaoParaMostrar.style.display = 'block';
}

function selecionarOperacao(operacao) {
    tocarMusica(); 
    
    operacaoSelecionada = operacao;
    const nomeOperacao = obterNomeOperacao(operacao);

    if (operacao === '5') {
        nivelSelecionado = 1; 
        mostrarSecao(configFinalDiv);
        if (jogoInstrucaoP) jogoInstrucaoP.innerHTML = `Operação escolhida: **${nomeOperacao}**. <br>Você responderá a um quiz de tabuada com Múltipla Escolha.`;
        if (numProblemasInput) numProblemasInput.value = 10;
        
        const tempo = obterTempoLimite();
        if (jogoInstrucaoP) jogoInstrucaoP.innerHTML += `<br>Tempo por problema: **${tempo} segundos**.`;
        
    } else {
        mostrarSecao(nivelSelecaoDiv);
        if (instrucaoNivelH2) instrucaoNivelH2.innerHTML = `Operação escolhida: **${nomeOperacao}**. Agora, escolha a dificuldade:`;
    }
}

function iniciarJogoConfig(nivel) {
    nivelSelecionado = parseInt(nivel); 
    const dificuldadeAtual = configurarDificuldade(nivel);
    
    mostrarSecao(configFinalDiv);
    
    let instrucao = `Nível ${nivel} (${obterDificuldadeNome(nivel)}) com números até **${dificuldadeAtual.maxNum}**.`;
    
    const tempo = obterTempoLimite();
    instrucao += `<br>Tempo por problema: **${tempo} segundos**.`;

    if (dificuldadeAtual.numOperandos > 2) {
        instrucao += `<br>As contas de adição/multiplicação terão **${dificuldadeAtual.numOperandos} números**.`;
    }

    if (jogoInstrucaoP) jogoInstrucaoP.innerHTML = instrucao;
    if (numProblemasInput) numProblemasInput.value = 5; 
}

function comecarPerguntas() {
    numProblemasTotal = parseInt(numProblemasInput.value); 

    if (isNaN(numProblemasTotal) || numProblemasTotal <= 0) {
        alert("Por favor, digite um número válido de problemas.");
        return;
    }
    
    problemaAtualIndex = 0;
    pontuacao = 0;
    logRespostas = [];
    problemasGerados = [];

    if (operacaoSelecionada === '5') {
        iniciarQuizTabuada();
    } else {
        const dificuldade = configurarDificuldade(nivelSelecionado);
        for (let i = 0; i < numProblemasTotal; i++) {
            problemasGerados.push(gerarProblema(operacaoSelecionada, dificuldade));
        }
        carregarProximoProblema();
    }
}

function carregarProximoProblema() {
    pararCronometro(); 
    if (problemaAtualIndex < numProblemasTotal) {
        const problema = problemasGerados[problemaAtualIndex];
        
        if (contadorProblemasP) contadorProblemasP.textContent = `Problema ${problemaAtualIndex + 1} de ${numProblemasTotal}`;
        if (perguntaExpressaoH2) perguntaExpressaoH2.textContent = `${problema.expressao} = ?`;
        
        if (opcoesRespostasDiv) opcoesRespostasDiv.innerHTML = '';
        problema.opcoes.forEach((opcao, index) => {
            const letraOpcao = String.fromCharCode(65 + index); 
            const button = document.createElement('button');
            button.className = 'choice-button';
            button.innerHTML = `<span>${letraOpcao})</span> ${opcao}`;
            button.onclick = () => verificarResposta(opcao, problema.respostaCorreta, button); 
            if (opcoesRespostasDiv) opcoesRespostasDiv.appendChild(button);
        });
        mostrarSecao(areaJogoDiv);
        iniciarCronometro(); 
    } else {
        mostrarResultadoFinal();
    }
}

function verificarResposta(respostaUsuarioValor, respostaCorretaValor, botaoClicado) {
    pararCronometro(); 
    
    const problema = problemasGerados[problemaAtualIndex];
    let ehCorreto = false;

    Array.from(opcoesRespostasDiv.children).forEach(button => {
        button.disabled = true;
    });

    if (respostaUsuarioValor === respostaCorretaValor) {
        pontuacao++;
        ehCorreto = true;
        botaoClicado.classList.add('correta-visual');
    } else {
        botaoClicado.classList.add('errada-visual');
        Array.from(opcoesRespostasDiv.children).forEach(button => {
             const respostaNaOpcao = parseInt(button.textContent.replace(/[A-Za-z\)\s]/g, '').trim());
            if (respostaNaOpcao === respostaCorretaValor) {
                button.classList.add('correta-visual');
            }
        });
    }

    logRespostas.push({
        expressao: problema.expressao,
        respostaUsuario: respostaUsuarioValor,
        respostaCorreta: respostaCorretaValor,
        ehCorreto: ehCorreto
    });
    
    setTimeout(() => {
        Array.from(opcoesRespostasDiv.children).forEach(button => {
            button.classList.remove('correta-visual', 'errada-visual');
        });
        proximoProblema();
    }, 1500); 
}

function proximoProblema() {
    problemaAtualIndex++;
    if (problemaAtualIndex < numProblemasTotal) {
        carregarProximoProblema();
    } else {
        mostrarResultadoFinal();
    }
}

function mostrarResultadoFinal() {
    pararCronometro(); 
    mostrarSecao(resultadoDiv);
    if (resultadoFinalTituloH2) resultadoFinalTituloH2.textContent = `🎯 Fim do Jogo!`;
    if (pontuacaoFinalP) pontuacaoFinalP.innerHTML = `Sua pontuação final é: <strong>${pontuacao} de ${numProblemasTotal}</strong>`;
    
    if (detalhesProblemasDiv) detalhesProblemasDiv.innerHTML = '<h3>Detalhes dos Problemas:</h3>';
    logRespostas.forEach(log => {
        const p = document.createElement('p');
        p.innerHTML = `<strong>${log.expressao} = ?</strong> <br>Sua resposta: ${log.respostaUsuario}. Correta: ${log.respostaCorreta}. `;
        if (log.ehCorreto) {
            p.innerHTML += `✅ <span style="color: green;">Correto!</span>`;
        } else {
            p.innerHTML += `❌ <span style="color: red;">Errado.</span>`;
        }
        if (detalhesProblemasDiv) detalhesProblemasDiv.appendChild(p);
    });
}

function voltarDaConfigFinal() {
    if (operacaoSelecionada === '5') {
        mostrarSecao(operacaoSelecaoDiv);
    } else {
        mostrarSecao(nivelSelecaoDiv);
    }
}

/**
 * Reinicia o jogo e volta para a tela de seleção de operação.
 */
function reiniciarJogo() {
    pararCronometro(); 
    
    if (musicaFundo) musicaFundo.pause(); 
    musicaIniciada = false;
    
    operacaoSelecionada = '';
    nivelSelecionado = 1;
    numProblemasTotal = 0;
    problemasGerados = [];
    problemaAtualIndex = 0;
    pontuacao = 0;
    logRespostas = [];
    
    mostrarSecao(operacaoSelecaoDiv);
    
    if (detalhesProblemasDiv) detalhesProblemasDiv.innerHTML = '';
    if (opcoesRespostasDiv) opcoesRespostasDiv.innerHTML = '';

    // Garante que o ícone de volume volte ao estado inicial (ligado)
    const botaoVolume = document.getElementById('botao-volume');
    if (botaoVolume) {
        volumeLigado = true;
        volumeAtual = 0.10; // Volume inicial ajustado
        botaoVolume.innerHTML = "🎶";
    }
}


document.addEventListener('DOMContentLoaded', () => {
    reiniciarJogo();
});

// ====================================================================
// FUNÇÕES DE CRONÔMETRO
// ====================================================================

function pararCronometro() {
    clearInterval(timer);
}

function iniciarCronometro() {
    pararCronometro(); 
    
    const tempoLimite = obterTempoLimite(); 
    tempoRestante = tempoLimite;
    
    if (cronometroDisplay) {
        cronometroDisplay.textContent = tempoRestante;
        cronometroDisplay.classList.remove('alerta-tempo'); 
    }

    timer = setInterval(() => {
        tempoRestante--;
        if (cronometroDisplay) {
            cronometroDisplay.textContent = tempoRestante;
            if (tempoRestante <= 10) { 
                cronometroDisplay.classList.add('alerta-tempo'); 
            } else {
                 cronometroDisplay.classList.remove('alerta-tempo'); 
            }
        }

        if (tempoRestante <= 0) {
            pararCronometro();
            timeUp(); 
        }
    }, 1000); 
}

function timeUp() {
    pararCronometro();

    const problema = problemasGerados[problemaAtualIndex];
    const respostaCorretaValor = problema.respostaCorreta;
    
    if (opcoesRespostasDiv) {
        Array.from(opcoesRespostasDiv.children).forEach(button => {
            button.disabled = true;
            const respostaNaOpcao = parseInt(button.textContent.replace(/[A-Za-z\)\s]/g, '').trim());
            if (respostaNaOpcao === respostaCorretaValor) {
                 button.classList.add('correta-visual');
            }
        });
    }

    logRespostas.push({
        expressao: problema.expressao,
        respostaUsuario: 'TEMPO ESGOTADO',
        respostaCorreta: respostaCorretaValor,
        ehCorreto: false
    });

    setTimeout(() => {
        problemaAtualIndex++; 
        if (opcoesRespostasDiv) {
            Array.from(opcoesRespostasDiv.children).forEach(button => {
                button.classList.remove('correta-visual', 'errada-visual');
            });
        }
        
        if (problemaAtualIndex < numProblemasTotal) {
            carregarProximoProblema();
        } else {
            mostrarResultadoFinal();
        }
    }, 1500); 
}

// ====================================================================
// FUNÇÕES DE LÓGICA DO JOGO
// ====================================================================

function obterNomeOperacao(codigo) {
    const nomes = {
        '1': 'Adição',
        '2': 'Subtração',
        '3': 'Multiplicação',
        '4': 'Divisão',
        '5': 'Tabuada'
    };
    return nomes[codigo] || 'Inválida';
}

function obterTempoLimite() {
    if ((operacaoSelecionada === '3' || operacaoSelecionada === '4') && nivelSelecionado >= 8) {
        return 60;
    }
    if (operacaoSelecionada === '5') {
        return 20; 
    }
    return 30;
}

function configurarDificuldade(nivel) {
    nivelSelecionado = parseInt(nivel); 
    
    if (nivel >= 8) { 
        const numOps = nivelSelecionado >= 9 && operacaoSelecionada !== '2' && operacaoSelecionada !== '4' ? 3 : 2;
        return { maxNum: 50, minNum: 10, numOperandos: numOps };
    } else if (nivel >= 4) { 
        return { maxNum: 20, minNum: 5, numOperandos: 2 };
    } else { 
        return { maxNum: 10, minNum: 1, numOperandos: 2 };
    }
}

function gerarOpcoes(respostaCorreta) {
    const opcoesIncorretas = new Set();
    const range = Math.max(5, Math.floor(Math.abs(respostaCorreta) * 0.3) + 2); 

    while (opcoesIncorretas.size < 3) {
        let erro = Math.floor(Math.random() * range) + 1;
        let opcaoFalsa = (opcoesIncorretas.size % 2 === 0) 
            ? respostaCorreta + erro 
            : respostaCorreta - erro;
        
        if (opcaoFalsa !== respostaCorreta && !opcoesIncorretas.has(opcaoFalsa) && opcaoFalsa >= 0) {
            opcoesIncorretas.add(opcaoFalsa);
        }
    }

    let todasOpcoes = [respostaCorreta, ...Array.from(opcoesIncorretas)];

    for (let i = todasOpcoes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [todasOpcoes[i], todasOpcoes[j]] = [todasOpcoes[j], todasOpcoes[i]];
    }

    return todasOpcoes;
}

function gerarProblema(operacao, dificuldade) {
    let respostaCorreta;
    let operador;
    let expressao;
    let { maxNum, minNum, numOperandos } = dificuldade;
    
    let numBase = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
    let numeros = [numBase];

    switch (operacao) {
        case '1': // Adição
            operador = '+';
            respostaCorreta = numBase;
            for (let i = 1; i < numOperandos; i++) {
                const num = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
                numeros.push(num);
                respostaCorreta += num;
            }
            break;

        case '2': // Subtração
            operador = '-';
            numOperandos = 2; 
            let num2 = Math.floor(Math.random() * (numBase - minNum + 1)) + minNum;
            
            if (num2 > numBase) {
                 [numBase, num2] = [num2, numBase];
            }
            if (numBase === num2) {
                numBase += 1; 
            }
            
            numeros = [numBase, num2];
            respostaCorreta = numBase - num2;
            break;

        case '3': // Multiplicação
            operador = 'x'; 
            respostaCorreta = numBase;
            for (let i = 1; i < numOperandos; i++) {
                
                const limiteMultiplicador = (nivelSelecionado >= 8) ? maxNum : Math.min(10, maxNum);
                const limiteMinimo = Math.max(2, minNum); 
                
                const num = Math.floor(Math.random() * (limiteMultiplicador - limiteMinimo + 1)) + limiteMinimo; 
                
                numeros.push(num);
                respostaCorreta *= num;
            }
            break;

        case '4': // Divisão
            operador = '÷';
            numOperandos = 2; 
            
            let quociente;
            let divisor;
            let dividendo;
            
            divisor = Math.floor(Math.random() * (Math.min(10, maxNum) - 2 + 1)) + 2; 
            quociente = Math.floor(Math.random() * (Math.max(5, Math.floor(maxNum / divisor)) - 2 + 1)) + 2; 
            
            dividendo = divisor * quociente;
            
            while (dividendo > 100 && maxNum <= 100) { 
                divisor = Math.floor(Math.random() * (10 - 2 + 1)) + 2; 
                quociente = Math.floor(Math.random() * (10 - 2 + 1)) + 2; 
                dividendo = divisor * quociente;
            }

            numeros = [dividendo, divisor];
            respostaCorreta = quociente;
            break;
    }

    expressao = numeros.join(` ${operador} `);
    const opcoes = gerarOpcoes(respostaCorreta);

    return {
        expressao: expressao,
        respostaCorreta: respostaCorreta,
        opcoes: opcoes
    };
}

function obterDificuldadeNome(nivel) {
    if (nivel >= 8) return 'Difícil';
    if (nivel >= 4) return 'Intermediário';
    return 'Leve';
}

function iniciarQuizTabuada() {
    let tabuadaEscolhida;
    while (true) {
        const escolha = prompt("🔢 Qual tabuada você quer praticar (2 a 15)?\nDigite o número OU digite '0' para MODO ALEATÓRIO.");
        
        if (escolha === null) {
            reiniciarJogo();
            return; 
        }
        
        tabuadaEscolhida = parseInt(escolha);
        
        if (!isNaN(tabuadaEscolhida) && (tabuadaEscolhida === 0 || (tabuadaEscolhida >= 2 && tabuadaEscolhida <= 15))) {
            break;
        } else {
            alert("⚠️ Entrada inválida. Por favor, escolha um número entre 2 e 15, ou 0 para Aleatório.");
        }
    }
    
    for (let i = 0; i < numProblemasTotal; i++) {
        problemasGerados.push(gerarProblemaTabuada(tabuadaEscolhida));
    }
    
    carregarProximoProblema();
}

function gerarProblemaTabuada(tabuadaEscolhida) {
    let tabuada, multiplicador;
    
    if (tabuadaEscolhida === 0) {
        tabuada = Math.floor(Math.random() * (15 - 2 + 1)) + 2; 
        multiplicador = Math.floor(Math.random() * 10) + 1;
    } else {
        tabuada = tabuadaEscolhida;
        multiplicador = Math.floor(Math.random() * 10) + 1; 
    }

    const respostaCorreta = tabuada * multiplicador;
    const expressao = `${tabuada} x ${multiplicador}`;
    
    const opcoes = gerarOpcoes(respostaCorreta); 

    return {
        expressao: expressao,
        respostaCorreta: respostaCorreta,
        opcoes: opcoes
    };
}
