/* ============================================================
   ProyectoFinalTICS_Gonzalez_Rodas_Duarte_Valenzuela_11A_CentroDeMando
   BLACKMARKET CYBERPUNK - APPLICATION LOGIC
   ============================================================ */

(function () {
  'use strict';

  // ==================== AUDIO ENGINE (Web Audio API) ====================
  var audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        console.warn('Web Audio API not supported');
      }
    }
  }

  function playBeep(freq, duration, type, volume) {
    if (!audioCtx) return;
    try {
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.type = type || 'square';
      osc.frequency.setValueAtTime(freq || 440, audioCtx.currentTime);
      gain.gain.setValueAtTime(volume || 0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + (duration || 0.1));
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + (duration || 0.1));
    } catch (e) { /* silent fail */ }
  }

  function playKeyClick() {
    var freqs = [800, 1000, 1200, 900, 1100];
    playBeep(freqs[Math.floor(Math.random() * freqs.length)], 0.04, 'square', 0.04);
  }

  function playEnterSound() {
    playBeep(200, 0.08, 'sawtooth', 0.06);
    setTimeout(function () { playBeep(400, 0.06, 'square', 0.05); }, 80);
  }

  function playAlertSound() {
    playBeep(300, 0.3, 'sawtooth', 0.12);
    setTimeout(function () { playBeep(200, 0.3, 'sawtooth', 0.12); }, 300);
    setTimeout(function () { playBeep(300, 0.3, 'sawtooth', 0.12); }, 600);
  }

  function playGlitchSound() {
    for (var i = 0; i < 8; i++) {
      (function (idx) {
        setTimeout(function () {
          playBeep(
            100 + Math.random() * 2000,
            0.05 + Math.random() * 0.1,
            ['square', 'sawtooth', 'triangle'][Math.floor(Math.random() * 3)],
            0.06
          );
        }, idx * 50);
      })(i);
    }
  }

  function playBootBeep() {
    playBeep(1200, 0.06, 'sine', 0.05);
  }

  function playMapPing() {
    playBeep(1800, 0.15, 'sine', 0.06);
    setTimeout(function () { playBeep(2200, 0.1, 'sine', 0.04); }, 100);
  }

  function playRadioStatic() {
    if (!audioCtx) return;
    try {
      var bufferSize = audioCtx.sampleRate * 0.3;
      var buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      var data = buffer.getChannelData(0);
      for (var i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.03;
      }
      var source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.start();
    } catch (e) { /* silent fail */ }
  }

  // ==================== PHASE 1: BOOT CINEMATIC ====================
  var bootLines = document.querySelectorAll('#boot-terminal .boot-line');
  var progressContainer = document.getElementById('progress-container');
  var progressBarInner = document.getElementById('progress-bar-inner');
  var progressPercent = document.getElementById('progress-percent');
  var enterBtn = document.getElementById('enter-btn');
  var phaseBoot = document.getElementById('phase-boot');
  var glitchOverlay = document.getElementById('glitch-overlay');
  var phaseOS = document.getElementById('phase-os');

  function runBootSequence() {
    bootLines.forEach(function (line) {
      var delay = parseInt(line.getAttribute('data-delay'), 10) || 0;
      setTimeout(function () {
        line.classList.add('visible');
        playBootBeep();
      }, delay);
    });

    var lastDelay = 0;
    bootLines.forEach(function (line) {
      var d = parseInt(line.getAttribute('data-delay'), 10) || 0;
      if (d > lastDelay) lastDelay = d;
    });

    setTimeout(function () {
      progressContainer.classList.add('visible');
      animateProgress();
    }, lastDelay + 600);
  }

  function animateProgress() {
    var progress = 0;
    var interval = setInterval(function () {
      progress += Math.random() * 3 + 0.5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        progressBarInner.style.width = '100%';
        progressPercent.textContent = '100%';
        playRadioStatic();
        setTimeout(showEnterButton, 500);
        return;
      }
      progressBarInner.style.width = progress.toFixed(1) + '%';
      progressPercent.textContent = Math.floor(progress) + '%';
    }, 60);
  }

  function showEnterButton() {
    enterBtn.style.display = 'inline-block';
    enterBtn.style.animation = 'btnPulse 1.5s ease-in-out infinite, fadeIn 0.5s ease';
    playBeep(600, 0.2, 'sine', 0.08);
  }

  enterBtn.addEventListener('click', function () {
    initAudio();
    playGlitchSound();
    glitchOverlay.classList.add('active');
    setTimeout(function () {
      phaseBoot.style.display = 'none';
      glitchOverlay.classList.remove('active');
      glitchOverlay.style.display = 'none';
      phaseOS.classList.add('active');
      initOS();
    }, 1200);
  });

  // ==================== PHASE 2: OS INITIALIZATION ====================
  var consoleOutput = document.getElementById('console-output');
  var cmdInput = document.getElementById('cmd-input');
  var clockEl = document.getElementById('clock');
  var packetCount = document.getElementById('packet-count');
  var proxyBar = document.getElementById('proxy-bar');
  var latencyVal = document.getElementById('latency-val');
  var nodeCount = document.getElementById('node-count');
  var threatLevel = document.getElementById('threat-level');
  var sessionId = document.getElementById('session-id');
  var hudCursor = document.getElementById('hud-cursor');

  var fbiTimer = null;
  var packets = 0;
  var osActive = false;

  function initOS() {
    osActive = true;
    generateSessionId();
    printSystemLine('BLACKMARKET OS v4.7.1 // CENTRO DE MANDO');
    printSystemLine('═══════════════════════════════════════════════');
    printDimLine('  Secure session established. All traffic routed through TOR.');
    printDimLine('  Type "help" for available commands.');
    printSystemLine('═══════════════════════════════════════════════');
    printLine('');

    cmdInput.focus();
    startClock();
    startPacketCounter();
    startTelemetryUpdates();
    enableHUDCursor();

    // FBI trace at 45 seconds
    fbiTimer = setTimeout(triggerFBIAlert, 45000);
  }

  function generateSessionId() {
    var hex = '0123456789ABCDEF';
    var id = '0x';
    for (var i = 0; i < 8; i++) {
      id += hex[Math.floor(Math.random() * 16)];
    }
    sessionId.textContent = id;
  }

  // ==================== CONSOLE OUTPUT ====================
  function printLine(text, className) {
    var div = document.createElement('div');
    div.className = 'line' + (className ? ' ' + className : '');
    div.innerHTML = text;
    consoleOutput.appendChild(div);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
  }

  function printSystemLine(text) {
    printLine(text, 'system');
  }

  function printDimLine(text) {
    printLine(text, 'dim');
  }

  function printErrorLine(text) {
    printLine(text, 'error');
  }

  function printOutputLine(text) {
    printLine(text, 'cmd-output');
  }

  function typewriterPrint(text, className, callback) {
    var div = document.createElement('div');
    div.className = 'line' + (className ? ' ' + className : '');
    consoleOutput.appendChild(div);

    var idx = 0;
    var interval = setInterval(function () {
      if (idx < text.length) {
        div.textContent += text[idx];
        idx++;
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
      } else {
        clearInterval(interval);
        if (callback) callback();
      }
    }, 20);
  }

  // ==================== COMMAND PROCESSING ====================
  cmdInput.addEventListener('keydown', function (e) {
    playKeyClick();
    if (e.key === 'Enter') {
      var val = cmdInput.value.trim().toLowerCase();
      cmdInput.value = '';

      if (!val) return;

      playEnterSound();
      printLine('<span style="color:var(--magenta-neon);">▶</span> ' + escapeHTML(val), 'cmd-input');
      processCommand(val);
    }
  });

  // Click sound on any click
  document.addEventListener('click', function () {
    initAudio();
    playBeep(1500, 0.03, 'sine', 0.03);
  });

  function escapeHTML(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function processCommand(cmd) {
    switch (cmd) {
      case 'help':
        cmdHelp();
        break;
      case 'clear':
        cmdClear();
        break;
      case 'track':
        cmdTrack();
        break;
      case 'team':
      case 'whoami':
        cmdTeam();
        break;
      case 'declassify':
        cmdDeclassify();
        break;
      case 'market':
        cmdMarket();
        break;
      default:
        printErrorLine('[ERROR] Comando no reconocido: "' + escapeHTML(cmd) + '"');
        printDimLine('  Escribe "help" para ver la lista de comandos.');
        break;
    }
  }

  // --- HELP ---
  function cmdHelp() {
    printSystemLine('╔══════════════════════════════════════════════╗');
    printSystemLine('║       BLACKMARKET OS // COMMAND REFERENCE    ║');
    printSystemLine('╚══════════════════════════════════════════════╝');
    printLine('');
    var commands = [
      ['help', 'Muestra esta lista de comandos'],
      ['clear', 'Limpia la consola'],
      ['market', 'Abre el mercado de contrabando digital'],
      ['team', 'Muestra los operativos / vendedores'],
      ['whoami', 'Alias de "team"'],
      ['track', 'Inicia rastreo satelital inverso'],
      ['declassify', 'Desclasifica archivos (Light Mode)']
    ];
    commands.forEach(function (c) {
      printOutputLine('  <span style="color:var(--magenta-neon);font-weight:bold;">' + c[0].padEnd(14) + '</span>' + c[1]);
    });
    printLine('');
    printDimLine('  ████ Algunos comandos pueden activar protocolos ocultos ████');
  }

  // --- CLEAR ---
  function cmdClear() {
    consoleOutput.innerHTML = '';
    printSystemLine('Console cleared. Ready.');
  }

  // --- TEAM / WHOAMI ---
  function cmdTeam() {
    printSystemLine('╔══════════════════════════════════════════════╗');
    printSystemLine('║       OPERATIVOS // VENDOR ROSTER            ║');
    printSystemLine('╚══════════════════════════════════════════════╝');
    printLine('');

    var team = [
      { name: 'Manuel González', alias: 'PHANTOM', role: 'Lead Infiltrator', status: 'ACTIVE' },
      { name: 'José Rodas', alias: 'CIPHER', role: 'Crypto Analyst', status: 'ACTIVE' },
      { name: 'Pablo Duarte', alias: 'SPECTER', role: 'Network Architect', status: 'ACTIVE' },
      { name: 'Adrián Valenzuela', alias: 'VORTEX', role: 'Data Extractor', status: 'ACTIVE' }
    ];

    team.forEach(function (t, i) {
      printOutputLine(
        '  <span style="color:var(--magenta-neon);">[' + (i + 1) + ']</span> ' +
        '<span style="color:var(--green-phosphor);font-weight:bold;">' + t.name + '</span>'
      );
      printDimLine('      ALIAS: ' + t.alias + ' | ROLE: ' + t.role + ' | STATUS: ' + t.status);
    });

    printLine('');
    printDimLine('  Clase 11A - Colegio Capouilliez');
    printDimLine('  ████ IDENTIDADES VERIFICADAS POR EL SISTEMA ████');
  }

  // --- MARKET ---
  function cmdMarket() {
    printSystemLine('[MARKET] Abriendo mercado de contrabando digital...');
    playRadioStatic();
    setTimeout(function () {
      openModal('market-modal');
    }, 400);
  }

  // --- DECLASSIFY ---
  function cmdDeclassify() {
    var isDeclassified = document.body.classList.contains('declassified');
    if (isDeclassified) {
      document.body.classList.remove('declassified');
      printSystemLine('[CLASSIFY] Documentos RE-CLASIFICADOS. Modo oscuro restaurado.');
      playBeep(400, 0.15, 'square', 0.06);
    } else {
      printSystemLine('[DECLASSIFY] Desclasificando todos los archivos...');
      printOutputLine('  Nivel de seguridad: ████ → PÚBLICO');
      playBeep(1000, 0.2, 'sine', 0.08);
      setTimeout(function () {
        document.body.classList.add('declassified');
        printSystemLine('[DECLASSIFY] Modo DECLASSIFIED activado. Escribe "declassify" de nuevo para revertir.');
      }, 600);
    }
  }

  // --- TRACK ---
  function cmdTrack() {
    printSystemLine('[TRACK] Iniciando rastreo satelital inverso...');
    printDimLine('  Conectando con nodos de espionaje...');
    playRadioStatic();
    setTimeout(function () {
      openMap();
    }, 800);
  }

  // ==================== MODALS ====================
  function openModal(id) {
    var modal = document.getElementById(id);
    if (modal) {
      modal.classList.add('active');
      playBeep(600, 0.1, 'sine', 0.05);
    }
  }

  function closeModal(id) {
    var modal = document.getElementById(id);
    if (modal) {
      modal.classList.remove('active');
      playBeep(300, 0.08, 'sine', 0.04);
    }
    cmdInput.focus();
  }

  // Make closeModal globally accessible
  window.closeModal = closeModal;

  // ==================== MEDIA VIEWER ====================
  function openMedia(type) {
    var mediaContent = document.getElementById('media-content');
    var mediaTitle = document.getElementById('media-title');

    mediaContent.innerHTML = '';
    playBeep(800, 0.1, 'sine', 0.05);

    switch (type) {
      case 'pdf':
        mediaTitle.textContent = '◈ DOCUMENTO CLASIFICADO // PDF VIEWER';
        mediaContent.innerHTML =
          '<div style="width:100%;">' +
          '<embed src="documento.pdf" type="application/pdf" width="100%" height="500px" ' +
          'style="border:1px solid var(--border-green);background:#111;">' +
          '<p style="margin-top:12px;font-size:12px;color:var(--text-dim);text-align:center;">' +
          '[!] Si el PDF no carga, coloca el archivo <span style="color:var(--magenta-neon);">documento.pdf</span> en el directorio raíz del proyecto.</p>' +
          '</div>';
        break;

      case 'video':
        mediaTitle.textContent = '◈ GRABACIÓN DE VIGILANCIA // VIDEO PLAYER';
        mediaContent.innerHTML =
          '<div style="width:100%;">' +
          '<video controls preload="metadata" style="width:100%;max-height:450px;background:#000;border:1px solid var(--border-green);outline:none;">' +
          '<source src="video.mp4" type="video/mp4">' +
          'Tu navegador no soporta la reproducción de video HTML5.' +
          '</video>' +
          '<p style="margin-top:12px;font-size:12px;color:var(--text-dim);text-align:center;">' +
          '[!] Coloca el archivo <span style="color:var(--magenta-neon);">video.mp4</span> en el directorio raíz del proyecto.</p>' +
          '</div>';
        break;

      case 'audio':
        mediaTitle.textContent = '◈ RADIO INTERCEPTADA // AUDIO PLAYER';
        mediaContent.innerHTML =
          '<div style="width:100%;text-align:center;padding:40px 0;">' +
          '<div style="font-size:60px;margin-bottom:20px;">📻</div>' +
          '<div style="color:var(--magenta-neon);font-size:14px;letter-spacing:2px;margin-bottom:20px;">FRECUENCIA INTERCEPTADA</div>' +
          '<audio controls preload="metadata" style="width:100%;outline:none;filter:hue-rotate(120deg) brightness(1.5);">' +
          '<source src="podcast.mp3" type="audio/mpeg">' +
          'Tu navegador no soporta la reproducción de audio HTML5.' +
          '</audio>' +
          '<p style="margin-top:12px;font-size:12px;color:var(--text-dim);">' +
          '[!] Coloca el archivo <span style="color:var(--magenta-neon);">podcast.mp3</span> en el directorio raíz del proyecto.</p>' +
          '</div>';
        break;
    }

    closeModal('market-modal');
    setTimeout(function () {
      openModal('media-viewer');
    }, 200);
  }

  window.openMedia = openMedia;

  // ==================== PHASE 3: HUD CURSOR & TELEMETRY ====================
  function enableHUDCursor() {
    document.body.classList.add('hud-active');
    hudCursor.style.display = 'block';

    document.addEventListener('mousemove', function (e) {
      hudCursor.style.left = e.clientX + 'px';
      hudCursor.style.top = e.clientY + 'px';
    });
  }

  function startTelemetryUpdates() {
    setInterval(function () {
      // Update proxy bar
      var proxyCount = Math.floor(Math.random() * 5) + 4;
      var filled = '';
      var empty = '';
      for (var i = 0; i < proxyCount; i++) filled += '█';
      for (var j = proxyCount; j < 8; j++) empty += '░';
      proxyBar.textContent = '[' + filled + empty + '] ' + proxyCount;

      // Update latency
      var lat = Math.floor(Math.random() * 400) + 80;
      latencyVal.textContent = lat + 'ms';
      latencyVal.style.color = lat > 300 ? 'var(--red-alert)' : 'var(--green-phosphor)';

      // Update node count
      var onlineNodes = Math.floor(Math.random() * 5) + 8;
      nodeCount.textContent = onlineNodes + ' / 12 online';
    }, 2500);
  }

  function startClock() {
    function updateClock() {
      var now = new Date();
      var h = String(now.getHours()).padStart(2, '0');
      var m = String(now.getMinutes()).padStart(2, '0');
      var s = String(now.getSeconds()).padStart(2, '0');
      clockEl.textContent = h + ':' + m + ':' + s;
    }
    updateClock();
    setInterval(updateClock, 1000);
  }

  function startPacketCounter() {
    setInterval(function () {
      packets += Math.floor(Math.random() * 50) + 10;
      packetCount.textContent = packets.toLocaleString();
    }, 800);
  }

  // ==================== PHASE 4: SATELLITE MAP ====================
  var mapOverlay = document.getElementById('map-overlay');
  var mapCanvas = document.getElementById('map-canvas');
  var mapStatus = document.getElementById('map-status');
  var mapCloseBtn = document.getElementById('map-close-btn');
  var mapCtx = mapCanvas.getContext('2d');

  // Simplified world map coordinates (continental outlines)
  var continents = [
    // North America
    [
      [150, 80], [130, 100], [110, 130], [100, 160], [120, 180],
      [140, 200], [160, 210], [180, 200], [210, 220], [230, 240],
      [240, 250], [230, 260], [220, 250], [200, 230], [180, 220],
      [160, 230], [150, 250], [160, 260], [200, 270], [220, 280],
      [250, 280], [260, 260], [250, 240], [260, 220], [280, 200],
      [290, 180], [280, 160], [260, 140], [240, 120], [220, 100],
      [200, 90], [180, 80], [160, 75]
    ],
    // South America
    [
      [240, 280], [230, 300], [220, 320], [230, 340], [240, 360],
      [250, 380], [260, 400], [270, 410], [280, 400], [290, 380],
      [300, 360], [310, 340], [310, 320], [300, 300], [280, 290],
      [260, 280]
    ],
    // Europe
    [
      [420, 80], [400, 100], [410, 120], [430, 140], [440, 160],
      [460, 160], [480, 150], [500, 140], [510, 130], [500, 110],
      [490, 100], [470, 90], [450, 80]
    ],
    // Africa
    [
      [420, 180], [400, 200], [410, 230], [420, 260], [430, 290],
      [440, 320], [460, 350], [480, 370], [500, 360], [520, 340],
      [530, 310], [530, 280], [520, 250], [510, 220], [500, 200],
      [480, 180], [450, 170]
    ],
    // Asia
    [
      [510, 80], [530, 70], [560, 60], [600, 55], [640, 60],
      [680, 70], [720, 80], [760, 100], [780, 120], [790, 150],
      [780, 180], [760, 200], [730, 210], [700, 220], [670, 210],
      [640, 200], [610, 190], [580, 180], [550, 170], [530, 160],
      [520, 140], [510, 120], [505, 100]
    ],
    // Australia
    [
      [720, 320], [700, 340], [710, 360], [730, 380], [760, 390],
      [790, 380], [800, 360], [790, 340], [770, 320], [750, 310]
    ]
  ];

  // City nodes
  var cities = [
    { name: 'TOKIO', x: 770, y: 155, color: '#00ff41' },
    { name: 'MOSCÚ', x: 570, y: 90, color: '#00ff41' },
    { name: 'BERLÍN', x: 465, y: 110, color: '#00ff41' },
    { name: 'NEW YORK', x: 245, y: 150, color: '#ffaa00' },
    { name: 'LONDON', x: 430, y: 105, color: '#ffaa00' },
    { name: 'GUATEMALA', x: 200, y: 245, color: '#ff00ff' }
  ];

  function openMap() {
    mapOverlay.classList.add('active');
    mapCloseBtn.style.display = 'none';
    mapStatus.innerHTML = '<span style="color:var(--magenta-neon);">Cargando datos satelitales...</span>';
    playMapPing();
    drawMap();
  }

  function closeMap() {
    mapOverlay.classList.remove('active');
    cmdInput.focus();
  }

  window.closeMap = closeMap;

  function drawMap() {
    var w = mapCanvas.width;
    var h = mapCanvas.height;

    // Clear
    mapCtx.fillStyle = '#050505';
    mapCtx.fillRect(0, 0, w, h);

    // Grid
    mapCtx.strokeStyle = 'rgba(0, 255, 65, 0.06)';
    mapCtx.lineWidth = 0.5;
    for (var gx = 0; gx < w; gx += 30) {
      mapCtx.beginPath();
      mapCtx.moveTo(gx, 0);
      mapCtx.lineTo(gx, h);
      mapCtx.stroke();
    }
    for (var gy = 0; gy < h; gy += 30) {
      mapCtx.beginPath();
      mapCtx.moveTo(0, gy);
      mapCtx.lineTo(w, gy);
      mapCtx.stroke();
    }

    // Draw continents
    continents.forEach(function (points) {
      mapCtx.beginPath();
      mapCtx.moveTo(points[0][0], points[0][1]);
      for (var i = 1; i < points.length; i++) {
        mapCtx.lineTo(points[i][0], points[i][1]);
      }
      mapCtx.closePath();
      mapCtx.fillStyle = 'rgba(0, 255, 65, 0.08)';
      mapCtx.fill();
      mapCtx.strokeStyle = 'rgba(0, 255, 65, 0.3)';
      mapCtx.lineWidth = 1;
      mapCtx.stroke();
    });

    // Animate nodes sequentially
    animateNodes(0);
  }

  function animateNodes(index) {
    if (index >= cities.length) {
      // All nodes drawn, now draw convergence lines
      setTimeout(function () {
        drawConvergenceLines();
      }, 500);
      return;
    }

    var city = cities[index];

    // Flash effect
    var flashCount = 0;
    var flashInterval = setInterval(function () {
      drawCityNode(city, flashCount % 2 === 0);
      flashCount++;
      if (flashCount >= 6) {
        clearInterval(flashInterval);
        drawCityNode(city, true);
        playMapPing();

        mapStatus.innerHTML = '<span style="color:' + city.color + ';">NODE DETECTED: ' + city.name +
          ' [' + city.x + ', ' + city.y + ']</span>';

        setTimeout(function () {
          animateNodes(index + 1);
        }, 400);
      }
    }, 100);
  }

  function drawCityNode(city, visible) {
    if (!visible) return;

    // Outer glow
    mapCtx.beginPath();
    mapCtx.arc(city.x, city.y, 12, 0, Math.PI * 2);
    mapCtx.fillStyle = city.color.replace(')', ',0.15)').replace('rgb', 'rgba').replace('#', '');
    // Use a simpler approach for glow
    mapCtx.shadowColor = city.color;
    mapCtx.shadowBlur = 15;
    mapCtx.fillStyle = 'rgba(0,0,0,0)';
    mapCtx.fill();
    mapCtx.shadowBlur = 0;

    // Inner dot
    mapCtx.beginPath();
    mapCtx.arc(city.x, city.y, 4, 0, Math.PI * 2);
    mapCtx.fillStyle = city.color;
    mapCtx.fill();

    // Ring
    mapCtx.beginPath();
    mapCtx.arc(city.x, city.y, 10, 0, Math.PI * 2);
    mapCtx.strokeStyle = city.color;
    mapCtx.lineWidth = 1;
    mapCtx.stroke();

    // Label
    mapCtx.font = '10px Courier New';
    mapCtx.fillStyle = city.color;
    mapCtx.fillText(city.name, city.x + 14, city.y + 4);
  }

  function drawConvergenceLines() {
    var target = cities[cities.length - 1]; // GUATEMALA
    var sources = cities.slice(0, -1);
    var lineIndex = 0;

    mapStatus.innerHTML = '<span style="color:var(--magenta-neon);">TRIANGULANDO ORIGEN DEL VENDOR...</span>';

    function drawNextLine() {
      if (lineIndex >= sources.length) {
        // Draw final red line and alert
        setTimeout(drawFinalTrace, 600);
        return;
      }

      var src = sources[lineIndex];
      animateLine(src.x, src.y, target.x, target.y, 'rgba(0, 255, 65, 0.5)', function () {
        lineIndex++;
        drawNextLine();
      });
    }

    drawNextLine();
  }

  function animateLine(x1, y1, x2, y2, color, callback) {
    var steps = 30;
    var step = 0;

    var interval = setInterval(function () {
      var progress = step / steps;
      var cx = x1 + (x2 - x1) * progress;
      var cy = y1 + (y2 - y1) * progress;

      mapCtx.beginPath();
      mapCtx.moveTo(x1, y1);
      mapCtx.lineTo(cx, cy);
      mapCtx.strokeStyle = color;
      mapCtx.lineWidth = 1;
      mapCtx.setLineDash([4, 4]);
      mapCtx.stroke();
      mapCtx.setLineDash([]);

      step++;
      if (step > steps) {
        clearInterval(interval);
        if (callback) callback();
      }
    }, 30);
  }

  function drawFinalTrace() {
    var target = cities[cities.length - 1];

    playAlertSound();

    // Big red circle on Guatemala
    mapCtx.beginPath();
    mapCtx.arc(target.x, target.y, 20, 0, Math.PI * 2);
    mapCtx.strokeStyle = '#ff003c';
    mapCtx.lineWidth = 3;
    mapCtx.shadowColor = '#ff003c';
    mapCtx.shadowBlur = 20;
    mapCtx.stroke();
    mapCtx.shadowBlur = 0;

    // Red crosshairs
    mapCtx.strokeStyle = '#ff003c';
    mapCtx.lineWidth = 1;
    mapCtx.beginPath();
    mapCtx.moveTo(target.x - 30, target.y);
    mapCtx.lineTo(target.x + 30, target.y);
    mapCtx.stroke();
    mapCtx.beginPath();
    mapCtx.moveTo(target.x, target.y - 30);
    mapCtx.lineTo(target.x, target.y + 30);
    mapCtx.stroke();

    // Label
    mapCtx.font = 'bold 12px Courier New';
    mapCtx.fillStyle = '#ff003c';
    mapCtx.fillText('▼ TARGET LOCATED', target.x - 55, target.y + 40);

    mapStatus.innerHTML =
      '<span class="glow-red" style="color:var(--red-alert);font-size:16px;font-weight:bold;">' +
      '⚠ VENDOR LOCATED: ZONA 11 - COLEGIO CAPOUILLIEZ ⚠</span><br>' +
      '<span style="color:var(--text-dim);font-size:11px;">Coordenadas: 14.6°N, 90.5°W | País: GUATEMALA | Confianza: 97.3%</span>';

    mapCloseBtn.style.display = 'inline-block';
  }

  // ==================== FBI ALERT EVENT ====================
  var fbiAlert = document.getElementById('fbi-alert');

  function triggerFBIAlert() {
    if (!osActive) return;
    playAlertSound();
    fbiAlert.classList.add('active');

    // Flashing red border on body
    document.body.style.animation = 'none';
    var flashCount = 0;
    var flashInterval = setInterval(function () {
      fbiAlert.style.background = flashCount % 2 === 0
        ? 'rgba(255, 0, 60, 0.15)'
        : 'rgba(0, 0, 0, 0.96)';
      flashCount++;
      if (flashCount > 20) {
        fbiAlert.style.background = 'rgba(0, 0, 0, 0.96)';
        clearInterval(flashInterval);
      }
    }, 200);
  }

  function burnDrive() {
    playGlitchSound();
    fbiAlert.classList.remove('active');
    printSystemLine('');
    printSystemLine('🔥 [BURN] Drive quemado exitosamente. Evidencia eliminada.');
    printOutputLine('  Trace neutralizado. Federal nodes desconectados.');
    printDimLine('  Puedes continuar operando con normalidad.');
    printSystemLine('');

    // Reset threat level
    threatLevel.textContent = '██░░░ LOW';
    threatLevel.style.color = 'var(--red-alert)';

    cmdInput.focus();

    // Schedule another FBI alert in 90 seconds
    fbiTimer = setTimeout(triggerFBIAlert, 90000);
  }

  window.burnDrive = burnDrive;

  // ==================== START BOOT SEQUENCE ====================
  // Small delay to let CSS load
  setTimeout(function () {
    initAudio();
    runBootSequence();
  }, 300);

})();
