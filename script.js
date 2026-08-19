/* ============================================
   CONFIGURAÇÕES
   Altere aqui as dimensões e caminhos.
   ============================================ */
const CONFIG = {
    LARGURA_FINAL: 1080,
    ALTURA_FINAL: 1350,    // 4:5 (Instagram). Use 1080 para 1:1, ou 1920 para 9:16 (Stories).
    MOLDURA_SRC: 'assets/moldura-1.png',
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

/* Estado de Ajuste Interativo Dual (Foto e Moldura) */
let fotoOriginal = null;
let modoAjuste = 'foto'; // 'foto' ou 'moldura'
let ajusteFoto = { x: 0, y: 0, scale: 1.0 };
let ajusteMoldura = { x: 0, y: 0, scale: 1.0 };

let isDragging = false;
let startX = 0, startY = 0;
let initialPinchDist = 0;
let initialPinchScale = 1.0;

/* ============================================
   REFERÊNCIAS AOS ELEMENTOS
   ============================================ */
const telaInicial    = document.getElementById('tela-inicial');
const telaEscolherMoldura = document.getElementById('tela-escolher-moldura');
const telaCamera     = document.getElementById('tela-camera');
const telaPreview    = document.getElementById('tela-preview');
const video          = document.getElementById('video-camera');
const molduraOverlay = document.getElementById('moldura-overlay');
const flashOverlay   = document.getElementById('flash-overlay');
const canvasPreview  = document.getElementById('canvas-preview');
const modalErro      = document.getElementById('modal-erro');
const textoErro      = document.getElementById('texto-erro');

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

/* Controles de Seleção de Moldura */
const molduraOpcoes       = document.querySelectorAll('.moldura-opcao');
const btnConfirmarMoldura = document.getElementById('btn-confirmar-moldura');
const btnVoltarMoldura    = document.getElementById('btn-voltar-moldura');
let acaoAposMoldura = null; // 'camera' ou 'galeria'

/* Controles de Modo, Zoom e Reset */
const tabAjusteFoto    = document.getElementById('tab-ajuste-foto');
const tabAjusteMoldura = document.getElementById('tab-ajuste-moldura');
const textoDicaAjuste  = document.getElementById('texto-dica-ajuste');
const sliderZoom       = document.getElementById('slider-zoom');
const btnZoomIn        = document.getElementById('btn-zoom-in');
const btnZoomOut       = document.getElementById('btn-zoom-out');
const btnResetAjuste   = document.getElementById('btn-reset-ajuste');

/* ============================================
   EVENTOS
   ============================================ */

// Em vez de iniciar a câmera direto, abrimos a tela de escolha de moldura
btnAcessarCamera.addEventListener('click', () => {
    acaoAposMoldura = 'camera';
    mostrarTela(telaEscolherMoldura);
});

if (btnAbrirGaleria) {
    btnAbrirGaleria.addEventListener('click', () => {
        acaoAposMoldura = 'galeria';
        mostrarTela(telaEscolherMoldura);
    });
}

// Eventos da Tela de Escolha de Moldura
molduraOpcoes.forEach(opcao => {
    opcao.addEventListener('click', () => {
        molduraOpcoes.forEach(opt => opt.classList.remove('moldura-selecionada'));
        opcao.classList.add('moldura-selecionada');
        CONFIG.MOLDURA_SRC = opcao.getAttribute('data-moldura');
    });
});

if (btnConfirmarMoldura) {
    btnConfirmarMoldura.addEventListener('click', () => {
        preCarregarMoldura(); // Carrega a imagem da moldura escolhida
        if (acaoAposMoldura === 'camera') {
            iniciarCamera();
        } else if (acaoAposMoldura === 'galeria') {
            inputGaleria.click();
        }
    });
}

if (btnVoltarMoldura) {
    btnVoltarMoldura.addEventListener('click', voltarInicio);
}

// O botão da galeria dentro da tela da câmera vai direto pro seletor, mantendo a moldura atual
if (btnGaleriaCamera) {
    btnGaleriaCamera.addEventListener('click', () => inputGaleria.click());
}
inputGaleria.addEventListener('change', processarFotoGaleria);

btnCapturar.addEventListener('click', capturarFoto);
btnAlternarCamera.addEventListener('click', alternarCamera);
btnVoltarCamera.addEventListener('click', voltarInicio);
btnBaixar.addEventListener('click', baixarFoto);
btnCompartilhar.addEventListener('click', compartilharFoto);
btnNovaFoto.addEventListener('click', () => {
    acaoAposMoldura = 'camera';
    mostrarTela(telaEscolherMoldura);
});
btnVoltarInicio.addEventListener('click', voltarInicio);
btnFecharErro.addEventListener('click', fecharErro);

// Alternar Modo de Ajuste (Foto vs Moldura)
if (tabAjusteFoto) {
    tabAjusteFoto.addEventListener('click', () => {
        modoAjuste = 'foto';
        tabAjusteFoto.classList.add('ativo');
        if (tabAjusteMoldura) tabAjusteMoldura.classList.remove('ativo');
        if (sliderZoom) sliderZoom.value = ajusteFoto.scale;
        if (textoDicaAjuste) textoDicaAjuste.textContent = 'Arraste ou use o zoom para ajustar a foto';
    });
}
if (tabAjusteMoldura) {
    tabAjusteMoldura.addEventListener('click', () => {
        modoAjuste = 'moldura';
        tabAjusteMoldura.classList.add('ativo');
        if (tabAjusteFoto) tabAjusteFoto.classList.remove('ativo');
        if (sliderZoom) sliderZoom.value = ajusteMoldura.scale;
        if (textoDicaAjuste) textoDicaAjuste.textContent = 'Arraste ou use o zoom para ajustar a moldura';
    });
}

function getTargetAjuste() {
    return modoAjuste === 'foto' ? ajusteFoto : ajusteMoldura;
}

// Eventos de Zoom e Reset
if (sliderZoom) {
    sliderZoom.addEventListener('input', (e) => {
        const target = getTargetAjuste();
        target.scale = parseFloat(e.target.value);
        renderizarPreviewAjustado();
    });
}
if (btnZoomIn) {
    btnZoomIn.addEventListener('click', () => {
        const target = getTargetAjuste();
        target.scale = Math.min(3.0, Math.round((target.scale + 0.15) * 100) / 100);
        if (sliderZoom) sliderZoom.value = target.scale;
        renderizarPreviewAjustado();
    });
}
if (btnZoomOut) {
    btnZoomOut.addEventListener('click', () => {
        const target = getTargetAjuste();
        target.scale = Math.max(0.5, Math.round((target.scale - 0.15) * 100) / 100);
        if (sliderZoom) sliderZoom.value = target.scale;
        renderizarPreviewAjustado();
    });
}
if (btnResetAjuste) {
    btnResetAjuste.addEventListener('click', resetarAjustes);
}

// Eventos de Interação no Canvas Preview (Arrastar, Pinça, Wheel)
if (canvasPreview) {
    canvasPreview.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    canvasPreview.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);

    canvasPreview.addEventListener('wheel', onWheel, { passive: false });
}

// Pré-carregar a moldura
preCarregarMoldura();

/* ============================================
   PRÉ-CARREGAMENTO DA MOLDURA
   ============================================ */
function preCarregarMoldura() {
    molduraImg = new Image();
    molduraImg.crossOrigin = 'anonymous';
    molduraImg.src = CONFIG.MOLDURA_SRC;
    
    // Atualiza a imagem da moldura sobreposta na tela da câmera
    if (molduraOverlay) {
        molduraOverlay.src = CONFIG.MOLDURA_SRC;
    }
}

/* ============================================
   NAVEGAÇÃO ENTRE TELAS
   ============================================ */
function mostrarTela(tela) {
    [telaInicial, telaEscolherMoldura, telaCamera, telaPreview].forEach(t => {
        if (t) t.classList.remove('tela-ativa');
    });
    if (tela) tela.classList.add('tela-ativa');
}

/* ============================================
   INICIAR CÂMERA
   ============================================ */
async function iniciarCamera() {
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

        await new Promise((resolve, reject) => {
            video.onloadedmetadata = resolve;
            video.onerror = reject;
            setTimeout(() => reject(new Error('timeout')), 10000);
        });

        await video.play();

        atualizarEspelhamento();
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
   ALTERNAR CÂMERA
   ============================================ */
async function alternarCamera() {
    facingMode = facingMode === 'user' ? 'environment' : 'user';
    pararCamera();
    await iniciarCamera();
}

function atualizarEspelhamento() {
    if (facingMode === 'user') {
        video.classList.add('espelhado');
    } else {
        video.classList.remove('espelhado');
    }
}

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
   CAPTURAR FOTO DA CÂMERA
   ============================================ */
async function capturarFoto() {
    flashOverlay.classList.add('ativo');
    setTimeout(() => flashOverlay.classList.remove('ativo'), 500);

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    const tCtx = tempCanvas.getContext('2d');

    if (facingMode === 'user') {
        tCtx.translate(video.videoWidth, 0);
        tCtx.scale(-1, 1);
    }
    tCtx.drawImage(video, 0, 0);

    const tempImg = new Image();
    tempImg.src = tempCanvas.toDataURL('image/png');
    await new Promise((resolve) => { tempImg.onload = resolve; });

    fotoOriginal = tempImg;
    resetarAjustes();

    pararCamera();
    mostrarTela(telaPreview);
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
        img.onload = function() {
            fotoOriginal = img;
            resetarAjustes();
            pararCamera();
            mostrarTela(telaPreview);
            inputGaleria.value = '';
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

/* ============================================
   AJUSTE E RENDERIZAÇÃO INTERATIVA DUAL
   ============================================ */
function resetarAjustes() {
    ajusteFoto = { x: 0, y: 0, scale: 1.0 };
    ajusteMoldura = { x: 0, y: 0, scale: 1.0 };
    const target = getTargetAjuste();
    if (sliderZoom) sliderZoom.value = target.scale;
    renderizarPreviewAjustado();
}

function getCanvasScaleFactor() {
    if (!canvasPreview) return 1;
    const rect = canvasPreview.getBoundingClientRect();
    if (!rect.width) return 1;
    return CONFIG.LARGURA_FINAL / rect.width;
}

function renderizarPreviewAjustado() {
    if (!fotoOriginal || !canvasPreview) return;

    const W = CONFIG.LARGURA_FINAL;
    const H = CONFIG.ALTURA_FINAL;

    canvasPreview.width = W;
    canvasPreview.height = H;
    const pCtx = canvasPreview.getContext('2d');

    pCtx.clearRect(0, 0, W, H);

    // 1. Desenhar a FOTO do usuário (com posição e zoom de ajusteFoto)
    const iw = fotoOriginal.naturalWidth || fotoOriginal.width;
    const ih = fotoOriginal.naturalHeight || fotoOriginal.height;

    const canvasRatio = W / H;
    const imgRatio = iw / ih;

    let baseFotoW, baseFotoH;
    if (imgRatio > canvasRatio) {
        baseFotoH = H;
        baseFotoW = H * imgRatio;
    } else {
        baseFotoW = W;
        baseFotoH = W / imgRatio;
    }

    const finalFotoW = baseFotoW * ajusteFoto.scale;
    const finalFotoH = baseFotoH * ajusteFoto.scale;

    const drawFotoX = (W - finalFotoW) / 2 + ajusteFoto.x;
    const drawFotoY = (H - finalFotoH) / 2 + ajusteFoto.y;

    pCtx.drawImage(fotoOriginal, drawFotoX, drawFotoY, finalFotoW, finalFotoH);

    // 2. Desenhar a MOLDURA por cima (com posição e zoom de ajusteMoldura)
    // A moldura é quadrada (1350x1350), então usamos o maior lado do canvas
    // para manter a proporção 1:1 e o formato CIRCULAR perfeito
    if (molduraImg && molduraImg.complete && molduraImg.naturalWidth > 0) {
        const molduraRatio = molduraImg.naturalWidth / molduraImg.naturalHeight;
        const baseMolduraSize = Math.max(W, H);
        const baseMolduraW = baseMolduraSize * molduraRatio;
        const baseMolduraH = baseMolduraSize;

        const finalMolduraW = baseMolduraW * ajusteMoldura.scale;
        const finalMolduraH = baseMolduraH * ajusteMoldura.scale;

        const drawMolduraX = (W - finalMolduraW) / 2 + ajusteMoldura.x;
        const drawMolduraY = (H - finalMolduraH) / 2 + ajusteMoldura.y;

        pCtx.drawImage(molduraImg, drawMolduraX, drawMolduraY, finalMolduraW, finalMolduraH);
    }

    // 3. Atualizar o Blob para download e compartilhamento
    canvasPreview.toBlob(
        (blob) => {
            imagemFinalBlob = blob;
        },
        CONFIG.TIPO_MIME,
        CONFIG.QUALIDADE
    );
}

/* ============================================
   CONTROLES DE ARRASTAR E PINÇA (TOUCH & MOUSE)
   ============================================ */
function onMouseDown(e) {
    isDragging = true;
    const factor = getCanvasScaleFactor();
    const target = getTargetAjuste();
    startX = e.clientX * factor - target.x;
    startY = e.clientY * factor - target.y;
}

function onMouseMove(e) {
    if (!isDragging) return;
    const factor = getCanvasScaleFactor();
    const target = getTargetAjuste();
    target.x = e.clientX * factor - startX;
    target.y = e.clientY * factor - startY;
    renderizarPreviewAjustado();
}

function onMouseUp() {
    isDragging = false;
}

function onTouchStart(e) {
    const target = getTargetAjuste();
    if (e.touches.length === 1) {
        isDragging = true;
        const factor = getCanvasScaleFactor();
        const touch = e.touches[0];
        startX = touch.clientX * factor - target.x;
        startY = touch.clientY * factor - target.y;
    } else if (e.touches.length === 2) {
        isDragging = false;
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        initialPinchDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        initialPinchScale = target.scale;
    }
}

function onTouchMove(e) {
    const target = getTargetAjuste();
    if (e.touches.length === 1 && isDragging) {
        e.preventDefault();
        const factor = getCanvasScaleFactor();
        const touch = e.touches[0];
        target.x = touch.clientX * factor - startX;
        target.y = touch.clientY * factor - startY;
        renderizarPreviewAjustado();
    } else if (e.touches.length === 2 && initialPinchDist > 0) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        const newScale = Math.min(3.0, Math.max(0.5, initialPinchScale * (dist / initialPinchDist)));
        target.scale = Math.round(newScale * 100) / 100;
        if (sliderZoom) sliderZoom.value = target.scale;
        renderizarPreviewAjustado();
    }
}

function onTouchEnd(e) {
    if (e.touches.length < 2) {
        initialPinchDist = 0;
    }
    if (e.touches.length === 0) {
        isDragging = false;
    }
}

function onWheel(e) {
    e.preventDefault();
    const target = getTargetAjuste();
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    const newScale = Math.min(3.0, Math.max(0.5, target.scale + delta));
    target.scale = Math.round(newScale * 100) / 100;
    if (sliderZoom) sliderZoom.value = target.scale;
    renderizarPreviewAjustado();
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

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [arquivo] })) {
        try {
            await navigator.share({
                title: 'Minha foto com a Deputada Aurelina Medeiros',
                text: 'Olha a minha foto com a moldura da Deputada Aurelina Medeiros!',
                files: [arquivo]
            });
        } catch (erro) {
            if (erro.name !== 'AbortError') {
                mostrarMensagemErro(
                    'Não foi possível compartilhar a foto. ' +
                    'Tente baixar a imagem e compartilhar manualmente.'
                );
            }
        }
    } else {
        mostrarMensagemErro(
            'O compartilhamento direto não está disponível neste navegador. ' +
            'Use o botão "Baixar foto" e compartilhe a imagem manualmente nas suas redes sociais.'
        );
    }
}

/* ============================================
   REINICIAR CAPTURA / VOLTAR
   ============================================ */
async function reiniciarCaptura() {
    liberarImagemAnterior();
    await iniciarCamera();
}

function voltarInicio() {
    pararCamera();
    liberarImagemAnterior();
    mostrarTela(telaInicial);
}

function liberarImagemAnterior() {
    fotoOriginal = null;
    imagemFinalBlob = null;
    ajusteFoto = { x: 0, y: 0, scale: 1.0 };
    ajusteMoldura = { x: 0, y: 0, scale: 1.0 };
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

modalErro.querySelector('.modal-erro-backdrop').addEventListener('click', fecharErro);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalErro.classList.contains('ativo')) {
        fecharErro();
    }
});
