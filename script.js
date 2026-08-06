/* ============================================
   CONFIGURAÇÕES
   Altere aqui as dimensões e caminhos.
   ============================================ */
const CONFIG = {
    LARGURA_FINAL: 1080,
    ALTURA_FINAL: 1350,    // 4:5 (Instagram). Use 1080 para 1:1, ou 1920 para 9:16 (Stories).
    MOLDURA_SRC: 'assets/moldura.png',
    NOME_ARQUIVO: 'foto-aurelina-medeiros.png',
    TIPO_MIME: 'image/png',
    QUALIDADE: 1.0
};

/* ============================================
   ESTADO DA APLICAÇÃO
   ============================================ */
let stream = null;
let facingMode = 'user';       // 'user' = frontal, 'environment' = traseira
let imagemFinalBlob = null;
let molduraImg = null;

/* ============================================
   REFERÊNCIAS AOS ELEMENTOS
   ============================================ */
const telaInicial   = document.getElementById('tela-inicial');
const telaCamera    = document.getElementById('tela-camera');
const telaPreview   = document.getElementById('tela-preview');
const video         = document.getElementById('video-camera');
const molduraOverlay = document.getElementById('moldura-overlay');
const flashOverlay  = document.getElementById('flash-overlay');
const canvas        = document.getElementById('canvas-resultado');
const ctx           = canvas.getContext('2d');
const previewImg    = document.getElementById('preview-imagem');
const modalErro     = document.getElementById('modal-erro');
const textoErro     = document.getElementById('texto-erro');

const btnAcessarCamera  = document.getElementById('btn-acessar-camera');
const btnAbrirGaleria   = document.getElementById('btn-abrir-galeria');
const btnGaleriaCamera  = document.getElementById('btn-galeria-camera');
const inputGaleria      = document.getElementById('input-galeria');
const btnCapturar       = document.getElementById('btn-capturar');
const btnAlternarCamera = document.getElementById('btn-alternar-camera');
const btnVoltarCamera   = document.getElementById('btn-voltar-camera');
const btnBaixar         = document.getElementById('btn-baixar');
const btnCompartilhar   = document.getElementById('btn-compartilhar');
const btnNovaFoto       = document.getElementById('btn-nova-foto');
const btnVoltarInicio   = document.getElementById('btn-voltar-inicio');
const btnFecharErro     = document.getElementById('btn-fechar-erro');

/* ============================================
   EVENTOS
   ============================================ */
btnAcessarCamera.addEventListener('click', iniciarCamera);
if (btnAbrirGaleria) {
    btnAbrirGaleria.addEventListener('click', () => inputGaleria.click());
}
if (btnGaleriaCamera) {
    btnGaleriaCamera.addEventListener('click', () => inputGaleria.click());
}
inputGaleria.addEventListener('change', processarFotoGaleria);

btnCapturar.addEventListener('click', capturarFoto);
btnAlternarCamera.addEventListener('click', alternarCamera);
btnVoltarCamera.addEventListener('click', voltarInicio);
btnBaixar.addEventListener('click', baixarFoto);
btnCompartilhar.addEventListener('click', compartilharFoto);
btnNovaFoto.addEventListener('click', reiniciarCaptura);
btnVoltarInicio.addEventListener('click', voltarInicio);
btnFecharErro.addEventListener('click', fecharErro);

// Pré-carregar a moldura
preCarregarMoldura();

/* ============================================
   PRÉ-CARREGAMENTO DA MOLDURA
   ============================================ */
function preCarregarMoldura() {
    molduraImg = new Image();
    molduraImg.crossOrigin = 'anonymous';
    molduraImg.src = CONFIG.MOLDURA_SRC;
}

/* ============================================
   NAVEGAÇÃO ENTRE TELAS
   ============================================ */
function mostrarTela(tela) {
    [telaInicial, telaCamera, telaPreview].forEach(t => {
        t.classList.remove('tela-ativa');
    });
    tela.classList.add('tela-ativa');
}

/* ============================================
   INICIAR CÂMERA
   ============================================ */
async function iniciarCamera() {
    // Verificar suporte à API
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        mostrarMensagemErro(
            'Seu navegador não suporta acesso à câmera. ' +
            'Tente utilizar o Google Chrome ou Safari em uma versão mais recente.'
        );
        return;
    }

    try {
        const constraints = {
            video: {
                facingMode: facingMode,
                width: { ideal: 1920 },
                height: { ideal: 1920 }
            },
            audio: false
        };

        stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;

        // Esperar o vídeo estar pronto
        await new Promise((resolve, reject) => {
            video.onloadedmetadata = resolve;
            video.onerror = reject;
            setTimeout(() => reject(new Error('timeout')), 10000);
        });

        await video.play();

        // Aplicar espelhamento se câmera frontal
        atualizarEspelhamento();

        // Verificar se o dispositivo tem mais de uma câmera
        verificarMultiplasCameras();

        mostrarTela(telaCamera);

    } catch (erro) {
        tratarErroCam(erro);
    }
}

/* ============================================
   PARAR CÂMERA
   ============================================ */
function pararCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    video.srcObject = null;
}

/* ============================================
   ALTERNAR CÂMERA (frontal / traseira)
   ============================================ */
async function alternarCamera() {
    facingMode = facingMode === 'user' ? 'environment' : 'user';
    pararCamera();
    await iniciarCamera();
}

/* ============================================
   ESPELHAMENTO — frente espelha, traseira não
   ============================================ */
function atualizarEspelhamento() {
    if (facingMode === 'user') {
        video.classList.add('espelhado');
    } else {
        video.classList.remove('espelhado');
    }
}

/* ============================================
   VERIFICAR SE HÁ MAIS DE UMA CÂMERA
   ============================================ */
async function verificarMultiplasCameras() {
    try {
        const dispositivos = await navigator.mediaDevices.enumerateDevices();
        const cameras = dispositivos.filter(d => d.kind === 'videoinput');
        if (cameras.length <= 1) {
            btnAlternarCamera.classList.add('oculto');
        } else {
            btnAlternarCamera.classList.remove('oculto');
        }
    } catch {
        btnAlternarCamera.classList.add('oculto');
    }
}

/* ============================================
   CAPTURAR FOTO
   ============================================ */
async function capturarFoto() {
    // Efeito de flash
    flashOverlay.classList.add('ativo');
    setTimeout(() => flashOverlay.classList.remove('ativo'), 500);

    // Gerar imagem final
    await gerarImagemFinal();

    // Parar a câmera
    pararCamera();

    // Mostrar tela de preview
    mostrarTela(telaPreview);
}

/* ============================================
   GERAR IMAGEM FINAL (canvas)
   ============================================ */
function gerarImagemFinal() {
    return new Promise((resolve, reject) => {
        const largura = CONFIG.LARGURA_FINAL;
        const altura = CONFIG.ALTURA_FINAL;

        canvas.width = largura;
        canvas.height = altura;

        ctx.clearRect(0, 0, largura, altura);

        // --- Desenhar vídeo com recorte proporcional (object-fit: cover) ---
        const vw = video.videoWidth;
        const vh = video.videoHeight;

        const canvasRatio = largura / altura;
        const videoRatio = vw / vh;

        let sx, sy, sw, sh;

        if (videoRatio > canvasRatio) {
            // Vídeo mais largo: recortar laterais
            sh = vh;
            sw = vh * canvasRatio;
            sx = (vw - sw) / 2;
            sy = 0;
        } else {
            // Vídeo mais alto: recortar topo/base
            sw = vw;
            sh = vw / canvasRatio;
            sx = 0;
            sy = (vh - sh) / 2;
        }

        // Espelhar horizontalmente se câmera frontal
        if (facingMode === 'user') {
            ctx.save();
            ctx.translate(largura, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(video, sx, sy, sw, sh, 0, 0, largura, altura);
            ctx.restore();
        } else {
            ctx.drawImage(video, sx, sy, sw, sh, 0, 0, largura, altura);
        }

        // --- Desenhar moldura por cima ---
        if (molduraImg && molduraImg.complete && molduraImg.naturalWidth > 0) {
            ctx.drawImage(molduraImg, 0, 0, largura, altura);
        }

        // --- Converter para Blob ---
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    mostrarMensagemErro('Não foi possível gerar a imagem. Tente novamente.');
                    reject(new Error('Blob nulo'));
                    return;
                }
                imagemFinalBlob = blob;
                previewImg.src = URL.createObjectURL(blob);
                resolve();
            },
            CONFIG.TIPO_MIME,
            CONFIG.QUALIDADE
        );
    });
}

/* ============================================
   PROCESSAR FOTO DA GALERIA
   ============================================ */
function processarFotoGaleria(e) {
    const arquivo = e.target.files[0];
    if (!arquivo) return;

    if (!arquivo.type.startsWith('image/')) {
        mostrarMensagemErro('Por favor, selecione um arquivo de imagem válido.');
        return;
    }

    const leitor = new FileReader();
    leitor.onload = function(evento) {
        const img = new Image();
        img.onload = async function() {
            try {
                await gerarImagemFinalDaImagem(img);
                pararCamera();
                mostrarTela(telaPreview);
            } catch (erro) {
                mostrarMensagemErro('Erro ao processar a imagem da galeria.');
            } finally {
                inputGaleria.value = '';
            }
        };
        img.onerror = function() {
            mostrarMensagemErro('Erro ao carregar a imagem selecionada.');
            inputGaleria.value = '';
        };
        img.src = evento.target.result;
    };
    leitor.onerror = function() {
        mostrarMensagemErro('Não foi possível ler o arquivo selecionado.');
        inputGaleria.value = '';
    };
    leitor.readAsDataURL(arquivo);
}

function gerarImagemFinalDaImagem(imgCarregada) {
    return new Promise((resolve, reject) => {
        const largura = CONFIG.LARGURA_FINAL;
        const altura = CONFIG.ALTURA_FINAL;

        canvas.width = largura;
        canvas.height = altura;

        ctx.clearRect(0, 0, largura, altura);

        const iw = imgCarregada.naturalWidth || imgCarregada.width;
        const ih = imgCarregada.naturalHeight || imgCarregada.height;

        const canvasRatio = largura / altura;
        const imgRatio = iw / ih;

        let sx, sy, sw, sh;

        if (imgRatio > canvasRatio) {
            sh = ih;
            sw = ih * canvasRatio;
            sx = (iw - sw) / 2;
            sy = 0;
        } else {
            sw = iw;
            sh = iw / canvasRatio;
            sx = 0;
            sy = (ih - sh) / 2;
        }

        // Desenhar a foto enviada pelo usuário sem espelhar
        ctx.drawImage(imgCarregada, sx, sy, sw, sh, 0, 0, largura, altura);

        // Desenhar moldura por cima
        if (molduraImg && molduraImg.complete && molduraImg.naturalWidth > 0) {
            ctx.drawImage(molduraImg, 0, 0, largura, altura);
        }

        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    mostrarMensagemErro('Não foi possível gerar a imagem. Tente novamente.');
                    reject(new Error('Blob nulo'));
                    return;
                }
                imagemFinalBlob = blob;
                previewImg.src = URL.createObjectURL(blob);
                resolve();
            },
            CONFIG.TIPO_MIME,
            CONFIG.QUALIDADE
        );
    });
}

/* ============================================
   BAIXAR FOTO
   ============================================ */
function baixarFoto() {
    if (!imagemFinalBlob) return;

    const url = URL.createObjectURL(imagemFinalBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = CONFIG.NOME_ARQUIVO;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Liberar após um breve delay para garantir o download
    setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/* ============================================
   COMPARTILHAR FOTO (Web Share API)
   ============================================ */
async function compartilharFoto() {
    if (!imagemFinalBlob) return;

    const arquivo = new File([imagemFinalBlob], CONFIG.NOME_ARQUIVO, {
        type: CONFIG.TIPO_MIME
    });

    // Verificar suporte à Web Share API com arquivos
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [arquivo] })) {
        try {
            await navigator.share({
                title: 'Minha foto com a Deputada Aurelina Medeiros',
                text: 'Olha a minha foto com a moldura da Deputada Aurelina Medeiros!',
                files: [arquivo]
            });
        } catch (erro) {
            // Ignorar cancelamento pelo usuário
            if (erro.name !== 'AbortError') {
                mostrarMensagemErro(
                    'Não foi possível compartilhar a foto. ' +
                    'Tente baixar a imagem e compartilhar manualmente.'
                );
            }
        }
    } else {
        // Fallback: orientar a baixar
        mostrarMensagemErro(
            'O compartilhamento direto não está disponível neste navegador. ' +
            'Use o botão "Baixar foto" e compartilhe a imagem manualmente nas suas redes sociais.'
        );
    }
}

/* ============================================
   REINICIAR CAPTURA (tirar outra foto)
   ============================================ */
async function reiniciarCaptura() {
    liberarImagemAnterior();
    await iniciarCamera();
}

/* ============================================
   VOLTAR AO INÍCIO
   ============================================ */
function voltarInicio() {
    pararCamera();
    liberarImagemAnterior();
    mostrarTela(telaInicial);
}

/* ============================================
   LIBERAR MEMÓRIA DA IMAGEM ANTERIOR
   ============================================ */
function liberarImagemAnterior() {
    if (previewImg.src && previewImg.src.startsWith('blob:')) {
        URL.revokeObjectURL(previewImg.src);
    }
    previewImg.src = '';
    imagemFinalBlob = null;
}

/* ============================================
   TRATAMENTO DE ERROS DA CÂMERA
   ============================================ */
function tratarErroCam(erro) {
    let mensagem;

    if (erro.name === 'NotAllowedError' || erro.name === 'PermissionDeniedError') {
        mensagem =
            'Você não autorizou o acesso à câmera. ' +
            'Para tirar sua foto, permita o uso da câmera nas configurações do navegador e tente novamente.';
    } else if (erro.name === 'NotFoundError' || erro.name === 'DevicesNotFoundError') {
        mensagem =
            'Nenhuma câmera foi encontrada no seu dispositivo. ' +
            'Conecte uma câmera ou tente em outro aparelho.';
    } else if (erro.name === 'NotReadableError' || erro.name === 'TrackStartError') {
        mensagem =
            'Não foi possível acessar a câmera. ' +
            'Ela pode estar sendo usada por outro aplicativo. Feche outros apps e tente novamente.';
    } else if (erro.name === 'OverconstrainedError') {
        // Tentar sem especificar facingMode
        if (facingMode === 'user') {
            mensagem =
                'A câmera frontal não está disponível. ' +
                'Tente alternar para a câmera traseira.';
        } else {
            mensagem =
                'Não foi possível acessar a câmera com as configurações solicitadas. ' +
                'Tente novamente.';
        }
    } else {
        mensagem =
            'Não foi possível acessar a câmera. ' +
            'Verifique as permissões do navegador e tente novamente.';
    }

    mostrarMensagemErro(mensagem);
}

/* ============================================
   MODAL DE ERRO
   ============================================ */
function mostrarMensagemErro(mensagem) {
    textoErro.textContent = mensagem;
    modalErro.classList.add('ativo');
}

function fecharErro() {
    modalErro.classList.remove('ativo');
}

// Fechar modal clicando no backdrop
modalErro.querySelector('.modal-erro-backdrop').addEventListener('click', fecharErro);

// Fechar modal com Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalErro.classList.contains('ativo')) {
        fecharErro();
    }
});
