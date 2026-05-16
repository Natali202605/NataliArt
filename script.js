const magicCursor = document.getElementById("magicCursor");
const magicSparks = document.getElementById("magicSparks");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

const siteAudio = {
  ctx: null,
  musicGain: null,
  playing: false,
  noteTimer: null,
  noteIndex: 0,
  melody: [261.63, 293.66, 329.63, 392, 440, 493.88, 440, 392, 329.63, 293.66],
};

const getAudioContext = () => {
  if (!siteAudio.ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    siteAudio.ctx = new AudioCtx();
    siteAudio.musicGain = siteAudio.ctx.createGain();
    siteAudio.musicGain.gain.value = 0.055;
    siteAudio.musicGain.connect(siteAudio.ctx.destination);
  }
  return siteAudio.ctx;
};

const ensureAudioReady = async () => {
  const ctx = getAudioContext();
  if (!ctx) return false;
  if (ctx.state === "suspended") {
    await ctx.resume();
  }
  return true;
};

const playSoftNote = (frequency, duration = 1.15, volume = 0.28) => {
  const ctx = getAudioContext();
  if (!ctx || !siteAudio.musicGain) return;

  const now = ctx.currentTime;
  const voiceGain = ctx.createGain();
  voiceGain.gain.setValueAtTime(0, now);
  voiceGain.gain.linearRampToValueAtTime(volume, now + 0.12);
  voiceGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  voiceGain.connect(siteAudio.musicGain);

  const tone = ctx.createOscillator();
  tone.type = "triangle";
  tone.frequency.setValueAtTime(frequency, now);
  tone.connect(voiceGain);
  tone.start(now);
  tone.stop(now + duration + 0.05);

  const shimmer = ctx.createOscillator();
  shimmer.type = "sine";
  shimmer.frequency.setValueAtTime(frequency * 2, now);
  const shimmerGain = ctx.createGain();
  shimmerGain.gain.setValueAtTime(0, now);
  shimmerGain.gain.linearRampToValueAtTime(volume * 0.08, now + 0.1);
  shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.7);
  shimmer.connect(shimmerGain);
  shimmerGain.connect(siteAudio.musicGain);
  shimmer.start(now);
  shimmer.stop(now + duration);
};

const scheduleMelodyStep = () => {
  if (!siteAudio.playing) return;
  const note = siteAudio.melody[siteAudio.noteIndex % siteAudio.melody.length];
  siteAudio.noteIndex += 1;
  playSoftNote(note, 1.25, 0.26);
};

const startPersonaMusic = () => {
  if (prefersReducedMotion) return;
  if (siteAudio.playing) return;
  siteAudio.playing = true;
  scheduleMelodyStep();
  siteAudio.noteTimer = setInterval(scheduleMelodyStep, 1050);
};

const stopPersonaMusic = () => {
  siteAudio.playing = false;
  if (siteAudio.noteTimer) {
    clearInterval(siteAudio.noteTimer);
    siteAudio.noteTimer = null;
  }
};

const togglePersonaMusic = async () => {
  const ready = await ensureAudioReady();
  if (!ready) return;
  if (siteAudio.playing) {
    stopPersonaMusic();
  } else {
    startPersonaMusic();
  }
};

const buttonChimeSets = [
  [523.25, 659.25],
  [587.33, 739.99],
  [659.25, 830.61],
  [493.88, 622.25],
];

let chimeVariant = 0;

const playButtonChime = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.value = 0.09;
  master.connect(ctx.destination);

  const pair = buttonChimeSets[chimeVariant % buttonChimeSets.length];
  chimeVariant += 1;

  pair.forEach((frequency, index) => {
    const start = now + index * 0.045;
    const noteGain = ctx.createGain();
    noteGain.gain.setValueAtTime(0, start);
    noteGain.gain.linearRampToValueAtTime(0.14, start + 0.015);
    noteGain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);
    noteGain.connect(master);

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(frequency, start);
    osc.connect(noteGain);
    osc.start(start);
    osc.stop(start + 0.24);
  });
};

const sparkColors = ["#ff3de8", "#3df5ff", "#ffe566", "#b06bff", "#ffffff"];

const burstMagic = (x, y, intensity = 1) => {
  if (!magicSparks || prefersReducedMotion) return;

  const count = Math.round(10 + intensity * 8);
  for (let i = 0; i < count; i += 1) {
    const spark = document.createElement("span");
    const isStar = false;
    const angle = Math.random() * Math.PI * 2;
    const distance = (Math.random() * 42 + 18) * intensity;
    const sx = Math.cos(angle) * distance;
    const sy = Math.sin(angle) * distance;
    const color = sparkColors[Math.floor(Math.random() * sparkColors.length)];
    const size = Math.random() * 5 + (isStar ? 8 : 3);

    spark.className = isStar ? "magic-spark star" : "magic-spark";
    spark.style.left = x + "px";
    spark.style.top = y + "px";
    spark.style.setProperty("--sx", sx + "px");
    spark.style.setProperty("--sy", sy + "px");
    spark.style.setProperty("--color", color);
    spark.style.setProperty("--size", size + "px");
    spark.style.setProperty("--dur", Math.random() * 280 + 380 + "ms");

    if (isStar) {
      spark.textContent = Math.random() < 0.5 ? "✦" : "✧";
    }

    magicSparks.appendChild(spark);
    spark.addEventListener(
      "animationend",
      () => spark.remove(),
      { once: true }
    );
  }
};

if (hasFinePointer && magicCursor && !prefersReducedMotion) {
  document.body.classList.add("has-magic-cursor");

  let cursorX = 0;
  let cursorY = 0;

  const moveCursor = (x, y) => {
    cursorX = x;
    cursorY = y;
    magicCursor.style.transform = `translate(${x - 13}px, ${y - 13}px)`;
  };

  document.addEventListener(
    "mousemove",
    (event) => {
      moveCursor(event.clientX, event.clientY);
    },
    { passive: true }
  );

  document.addEventListener(
    "mousedown",
    (event) => {
      magicCursor.classList.add("clicking");
      burstMagic(event.clientX, event.clientY, 1.15);
    },
    { passive: true }
  );

  document.addEventListener(
    "mouseup",
    () => {
      magicCursor.classList.remove("clicking");
    },
    { passive: true }
  );

  document.addEventListener(
    "mouseleave",
    () => {
      magicCursor.style.opacity = "0";
    },
    { passive: true }
  );

  document.addEventListener(
    "mouseenter",
    () => {
      magicCursor.style.opacity = "1";
    },
    { passive: true }
  );

  moveCursor(window.innerWidth / 2, window.innerHeight / 2);
} else if (magicCursor) {
  magicCursor.hidden = true;

  if (!prefersReducedMotion) {
    document.addEventListener(
      "pointerdown",
      (event) => {
        burstMagic(event.clientX, event.clientY, 0.85);
      },
      { passive: true }
    );
  }
}

const mainScreen = document.getElementById("mainScreen");
const worksScreen = document.getElementById("worksScreen");
const showWorksBtn = document.getElementById("showWorksBtn");
const backBtn = document.getElementById("backBtn");

showWorksBtn.addEventListener("click", () => {
  mainScreen.classList.remove("active");
  worksScreen.classList.add("active");
});

backBtn.addEventListener("click", () => {
  worksScreen.classList.remove("active");
  mainScreen.classList.add("active");
});

const snowLayer = document.getElementById("snowLayer");
const flakes = 26;

for (let i = 0; i < flakes; i += 1) {
  const flake = document.createElement("span");
  const size = Math.random() * 5 + 3;
  const left = Math.random() * 100;
  const delay = Math.random() * 8;
  const duration = Math.random() * 12 + 8;
  const opacity = Math.random() * 0.5 + 0.25;

  flake.style.left = left + "%";
  flake.style.width = size + "px";
  flake.style.height = size + "px";
  flake.style.opacity = opacity;
  flake.style.animationDuration = duration + "s";
  flake.style.animationDelay = -delay + "s";
  snowLayer.appendChild(flake);
}

const categoryButtons = document.querySelectorAll(".category-btn");
const galleryItems = document.querySelectorAll(".gallery-item");

const showCategory = (category) => {
  galleryItems.forEach((item) => {
    const isVisible = item.dataset.category === category;
    item.classList.toggle("hidden", !isVisible);
  });
};

categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    categoryButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    showCategory(button.dataset.category);
  });
});

showCategory("portraits");

const galleryList = document.getElementById("galleryList");
const galleryLightbox = document.getElementById("galleryLightbox");
const galleryLightboxImg = document.getElementById("galleryLightboxImg");

galleryList?.addEventListener("click", (event) => {
  const item = event.target.closest(".gallery-item");
  if (!item || item.classList.contains("hidden")) return;
  const img = item.querySelector("img");
  if (!img) return;
  galleryLightboxImg.src = img.currentSrc || img.src;
  galleryLightboxImg.alt = img.alt || "";
  galleryLightbox.classList.add("open");
  document.body.style.overflow = "hidden";
});

const openModalButtons = document.querySelectorAll("[data-modal-open]");
const closeModalButtons = document.querySelectorAll("[data-modal-close]");
const modals = document.querySelectorAll(".modal");

const closeAllModals = () => {
  modals.forEach((modal) => modal.classList.remove("open"));
  if (galleryLightboxImg) {
    galleryLightboxImg.removeAttribute("src");
    galleryLightboxImg.alt = "";
  }
  document.body.style.overflow = "";
};

openModalButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const modalId = button.dataset.modalOpen;
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
  });
});

closeModalButtons.forEach((button) => {
  button.addEventListener("click", closeAllModals);
});

modals.forEach((modal) => {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeAllModals();
    }
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeAllModals();
  }
});

const contactForm = document.querySelector(".contact-form");

contactForm.addEventListener("submit", (event) => {
  event.preventDefault();
  alert("Спасибо! Ваша заявка отправлена.");
  contactForm.reset();
  closeAllModals();
});

const moodArtist = document.getElementById("moodArtist");
const artistTip = document.getElementById("artistTip");
const artistTipText = artistTip?.querySelector(".artist-tip-text");
const aboutBtn = document.querySelector('[data-modal-open="aboutModal"]');
const connectBtn = document.querySelector('[data-modal-open="connectModal"]');

const promoPhrases = [
  "Привет! Я Акварелька.",
  "Пусть сегодня будет день красоты, тепла и маленьких чудес!",
  "Ваша улыбка + мой портрет = идеальный подарок.",
  "Если захотите, оформим заказ под ключ: рамка и упаковка уже ждут.",
  "Тут действует правило: чем больше улыбок, тем лучше картина!",
  "Немного магии кисти, щепотка юмора - и заказ готов радовать.",
  "Вы прекрасны, а в портрете это станет еще заметнее!",
  "Кликните по мне - расскажу ещё что-нибудь доброе!",
  "Шарж с характером или нежный портрет - выберите настроение, а я добавлю свет.",
  "Каждая работа начинается с вашей истории - расскажите, и я переведу её в краски.",
  "Подарок, от которого светлеет комната и сердце - это не магия, это акварель.",
  "Рамка и ленточка - мелочь, а смотрится как праздник в коробке.",
  "Девять лет за кистью - и всё ещё ловлю вдохновение от ваших идей.",
  "Напишите, что важно: цвет глаз, любимый наряд или фон из мечты - учту всё.",
  "Портрет на память, шарж на улыбку, картина на стену - тут есть варианты на любой вкус.",
  "Если сомневаетесь с форматом - спросите: подскажу честно, без лишнего.",
  "Акварель любит свет - как и хорошее настроение, так что держим оба!",
  "Маленький сюрприз в конверте идёт в подарок - потому что приятные мелочи важны.",
  "Из Перми с любовью: дистанция не помеха, обсудим заказ так же тепло, как вживую.",
  "Вдохновение приходит от людей - спасибо, что заглянули в это творческое место.",
  "Пусть у вас сегодня будет чашка чая по душе и хотя бы один повод улыбнуться!",
  "Вы уже молодец, что зашли сюда - дальше я помогу с идеей и сроками, без стресса.",
  "Иногда достаточно одного шага к мечте - например, написать мне про портрет. Я рядом!",
  "Ваш уютный вечер может начаться с простого: 'хочу картину, которая радует каждый день'.",
  "Комплимент дня: вы справляетесь лучше, чем думаете. А я нарисую это в красках!",
  "Шутка на кухне художника: кисть никогда не спорит - только слушает и добавляет блик.",
  "Пусть эта страница будет вашим тихим островком добра среди суеты.",
  "Подарок себе - тоже нормально: вы заслуживаете красоту на стене и тепло в душе.",
  "Сомневаетесь, успеете ли к празднику? Напишите заранее - подстроимся и сохраним спокойствие.",
  "Хорошее настроение продаётся плохо, зато портрет его дарит надолго - проверено клиентами!",
  "Вы не обязаны быть 'идеальными' на портрете - достаточно быть собой, остальное моя работа.",
  "Маленькая радость: открыть посылку и увидеть себя такими, какими вас любят близкие.",
  "Если день выдался серым - я за яркий акцент в интерьере и доброе слово в чате.",
  "Мотивация простая: то, что вы откладывали 'на потом', может стать вашим любимым кадром.",
  "Клиенты часто говорят: 'не ожидали, что так тепло получится'. Давайте и вам так же!",
  "Уют - это когда на стене своя история, а не чужой постер из магазина.",
  "Немного флирта с мечтой: представьте портрет уже висит - приятно? Тогда поехали!",
  "Я верю: хороший заказ начинается с доверия. Спрашивайте что угодно - отвечу честно.",
  "Пусть сегодняшний список дел закончится чем-то светлым - хотя бы мыслью о подарке близким.",
  "Шарж не обидит - он только подчеркнёт ваш характер и вызовет смех в хорошем смысле!",
  "Вы выбираете не просто картину, а настроение в доме на годы вперёд - я это ценю.",
  "Добрый знак: вы читаете это сообщение - значит, красота вам не чужда. Обнимаю словами!",
  "Скидки на улыбки не распространяются - зато за них я добавляю души в каждый мазок.",
  "Когда устали решать за всех - доверьте мне визуальную часть: с кистью я не промахнусь.",
  "Ваш заказ - не 'ещё одна задача', а совместное творчество. Так спокойнее и интереснее.",
  "Пусть этот клик станет началом истории, которую потом с гордостью покажете гостям."
];

const buttonPhrases = {
  about: [
    "Здесь я рассказываю о творческом пути - загляните, вам понравится!",
    "В блоке 'Обо мне' много тепла и вдохновения.",
    "Девять лет рисую для людей - там об этом поподробнее, без скуки.",
    "Хотите узнать, как я работаю и что люблю в заказах? Раздел ждёт вас.",
    "Там же про подарочный конверт и оформление под ключ - загляните!",
    "Загляните в 'Обо мне' - там про опыт, заботу и то, как я люблю своих заказчиков.",
    "Хотите почувствовать атмосферу до заказа? Этот раздел как короткое знакомство за чаем.",
    "Там без сухих фактов - только живые детали, почему мне доверяют портреты и подарки."
  ],
  works: [
    "Покажу лучшие работы - выбирайте стиль, и начнем ваш заказ!",
    "В разделе работ уже ждут портреты, шаржи и картины.",
    "Листайте галерею: портреты, шаржи, картины и оформление - выбирайте настроение.",
    "Есть примеры по категориям - так проще представить свой будущий заказ.",
    "Понравился стиль? Напишите - повторим дух, но с вашим лицом и историей.",
    "Откройте работы - пусть глаза скажут 'хочу так же', а я помогу воплотить!",
    "Галерея для вдохновения: кликните на фото - посмотрите крупно, как будет у вас дома.",
    "Выберите направление и мечтайте вслух - я рядом, чтобы превратить это в эскиз и краски."
  ],
  connect: [
    "Нажмите 'Связаться' - помогу подобрать идеальный формат заказа.",
    "Пара кликов, и мы обсудим ваш будущий шедевр!",
    "Форма рядом - опишите идею, а я отвечу и предложу варианты.",
    "Имя, почта, пара строк о желании - и мы уже на одной волне.",
    "Не откладывайте красоту на потом - напишите, и разберёмся с деталями спокойно.",
    "Первый шаг к подарку - просто сообщение. Я отвечу тепло и по делу, без давления.",
    "Хотите обсудить бюджет и сроки без стеснения? Пишите - найдём комфортный вариант.",
    "Связаться - значит уже почти держать в руках идею будущей картины. Я за вас порадуюсь!"
  ]
};

const AUTO_TIP_MS = 8500;
const FIRST_TIP_DELAY_MS = 1800;
const PAUSE_AFTER_MANUAL_MS = 14000;

const showTip = (text) => {
  if (artistTipText) {
    artistTipText.textContent = text;
  } else {
    artistTip.textContent = text;
  }
  artistTip.classList.remove("show");
  requestAnimationFrame(() => {
    artistTip.classList.add("show");
  });
};

let tipIndex = 0;
let pauseAutoUntil = 0;
let autoTipTimer = null;

const pauseAutoTips = () => {
  pauseAutoUntil = Date.now() + PAUSE_AFTER_MANUAL_MS;
};

const startAutoTips = () => {
  if (autoTipTimer) clearInterval(autoTipTimer);
  autoTipTimer = setInterval(() => {
    if (Date.now() < pauseAutoUntil) return;
    tipIndex = (tipIndex + 1) % promoPhrases.length;
    showTip(promoPhrases[tipIndex]);
  }, AUTO_TIP_MS);
};

setTimeout(() => {
  tipIndex = 0;
  showTip(promoPhrases[0]);
  startAutoTips();
}, FIRST_TIP_DELAY_MS);

moodArtist.addEventListener("click", async (event) => {
  event.stopPropagation();
  pauseAutoTips();
  tipIndex = (tipIndex + 1) % promoPhrases.length;
  showTip(promoPhrases[tipIndex]);
  await togglePersonaMusic();
});

const pickRandom = (items) => items[Math.floor(Math.random() * items.length)];

aboutBtn?.addEventListener("click", (event) => {
  event.stopPropagation();
  pauseAutoTips();
  showTip(pickRandom(buttonPhrases.about));
});

showWorksBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  pauseAutoTips();
  showTip(pickRandom(buttonPhrases.works));
});

connectBtn?.addEventListener("click", (event) => {
  event.stopPropagation();
  pauseAutoTips();
  showTip(pickRandom(buttonPhrases.connect));
});

document.addEventListener("click", () => {
  artistTip.classList.remove("show");
});

document.addEventListener("click", async (event) => {
  const button = event.target.closest(".btn, .modal-close");
  if (!button || prefersReducedMotion) return;
  const ready = await ensureAudioReady();
  if (ready) playButtonChime();
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopPersonaMusic();
});

const artistVideo = document.querySelector(".artist-photo video");
const personaVideoSource = artistVideo?.querySelector("source");
const personaVideoRemotes = [
  "https://media.githubusercontent.com/media/Natali202605/NataliArt/main/video/persona.mp4",
  "https://media.githubusercontent.com/media/Natali202605/----------1/main/video/persona.mp4"
];

if (artistVideo) {
  const playPersonaVideo = () => {
    artistVideo.play().catch(() => {});
  };

  const setPersonaVideoSrc = (url) => {
    if (personaVideoSource) {
      personaVideoSource.src = url;
    } else {
      artistVideo.src = url;
    }
    artistVideo.load();
  };

  if (location.hostname.endsWith("github.io")) {
    setPersonaVideoSrc(personaVideoRemotes[0]);
    artistVideo.addEventListener(
      "error",
      () => {
        if (personaVideoSource?.src !== personaVideoRemotes[1]) {
          setPersonaVideoSrc(personaVideoRemotes[1]);
        }
      },
      { once: true }
    );
  }

  playPersonaVideo();
  artistVideo.addEventListener("loadeddata", playPersonaVideo, { once: true });
  artistVideo.addEventListener("canplay", playPersonaVideo, { once: true });

  document.addEventListener(
    "visibilitychange",
    () => {
      if (!document.hidden) playPersonaVideo();
    },
    { passive: true }
  );
}
