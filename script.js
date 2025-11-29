// -----------------------------
// MASRAFSIZ ÇÖZÜM 1 — TV ALGILAMA
// -----------------------------
function detectTV() {
  const ua = navigator.userAgent || "";
  const isTV =
    /TV|SmartTV|Tizen|WebTV|WebOS|NetCast|NetTV|HbbTV|VIDAA|Hisense|PhilipsTV|Opera TV|Vewd/i.test(ua) ||
    screen.width >= 2500; // büyük ekran algısı

  if (isTV) {
    document.body.classList.add("tv-view");
  }
}

// -----------------------------
// ZAMAN / TARİH
// -----------------------------
function updateLocalDateTime() {
  const now = new Date();

  const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const timeFormatter = new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const weekdayFormatter = new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    weekday: "long",
  });

  document.getElementById("current-date").textContent =
    dateFormatter.format(now);
  document.getElementById("current-day").textContent =
    weekdayFormatter.format(now);
  document.getElementById("current-time").textContent =
    timeFormatter.format(now);
}

function updateWorldClocks() {
  const zones = [
    { id: "time-london", tz: "Europe/London" },
    { id: "time-ny", tz: "America/New_York" },
    { id: "time-tokyo", tz: "Asia/Tokyo" },
  ];

  zones.forEach((z) => {
    const t = new Intl.DateTimeFormat("en-GB", {
      timeZone: z.tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date());

    const el = document.getElementById(z.id);
    if (el) el.textContent = t;
  });
}

// -----------------------------
// HAVA DURUMU (Open-Meteo, API KEY gerekmez)
// -----------------------------
const KARS_LAT = 40.601;
const KARS_LON = 43.097;

const weatherCodeMap = {
  0: "Açık",
  1: "Genelde açık",
  2: "Parçalı bulutlu",
  3: "Bulutlu",
  45: "Sisli",
  48: "Yoğun sis",
  51: "Çiseleme",
  53: "Çiseleme",
  55: "Yoğun çiseleme",
  61: "Hafif yağmur",
  63: "Yağmur",
  65: "Kuvvetli yağmur",
  71: "Kar",
  73: "Kar",
  75: "Yoğun kar",
  80: "Sağanak",
  81: "Kuvvetli sağanak",
  82: "Fırtınalı sağanak",
  95: "Gök gürültülü",
  96: "Dolu",
  99: "Kuvvetli dolu",
};

async function fetchWeather() {
  try {
    const url =
      "https://api.open-meteo.com/v1/forecast?latitude=" +
      KARS_LAT +
      "&longitude=" +
      KARS_LON +
      "&current_weather=true&timezone=Europe%2FIstanbul";

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Weather HTTP " + res.status);

    const data = await res.json();
    const cw = data.current_weather;

    const temp = typeof cw.temperature === "number" ? cw.temperature : null;
    const code = cw.weathercode;

    const tempEl = document.getElementById("weather-temp");
    const descEl = document.getElementById("weather-desc");

    if (tempEl && temp !== null) {
      tempEl.textContent = Math.round(temp) + "°";
    }

    if (descEl) {
      descEl.textContent =
        weatherCodeMap[code] !== undefined ? weatherCodeMap[code] : "Hava bilgisi";
    }
  } catch (err) {
    console.error("Hava durumu alınamadı:", err);
    const descEl = document.getElementById("weather-desc");
    if (descEl) descEl.textContent = "Bağlantı yok";
  }
}

// -----------------------------
// DÖVİZ KURLARI
// 1 BİRİM yabancı para = X TL (rakam), ekranda kendi sembolü ile
// -----------------------------
const currencyTargets = {
  JPY: { id: "rate-jpy", symbol: "¥" },
  USD: { id: "rate-usd", symbol: "$" },
  EUR: { id: "rate-eur", symbol: "€" },
  CHF: { id: "rate-chf", symbol: "Fr" },
  RUB: { id: "rate-rub", symbol: "₽" },
  GBP: { id: "rate-gbp", symbol: "£" },
};

function setRatesFromTryBase(rates) {
  Object.entries(currencyTargets).forEach(([code, cfg]) => {
    const el = document.getElementById(cfg.id);
    if (!el) return;

    const r = rates[code];
    if (!r || typeof r !== "number") {
      el.textContent = "--";
      return;
    }

    // 1 TRY = r CODE -> 1 CODE = 1/r TRY
    const tlPerUnit = 1 / r;
    el.textContent = tlPerUnit.toFixed(2) + cfg.symbol;
  });
}

async function fetchRatesPrimary() {
  const url = "https://open.er-api.com/v6/latest/TRY";
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Rates HTTP " + res.status);
  const data = await res.json();
  if (data && data.rates) {
    setRatesFromTryBase(data.rates);
  } else {
    throw new Error("Rates data invalid");
  }
}

async function fetchRatesFallback() {
  const url = "https://api.exchangerate.host/latest?base=TRY";
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Rates Fallback HTTP " + res.status);
  const data = await res.json();
  if (data && data.rates) {
    setRatesFromTryBase(data.rates);
  } else {
    throw new Error("Rates fallback data invalid");
  }
}

async function fetchRates() {
  try {
    await fetchRatesPrimary();
  } catch (err) {
    console.warn("Birinci döviz API başarısız, yedek API deneniyor:", err);
    try {
      await fetchRatesFallback();
    } catch (err2) {
      console.error("Döviz kurları alınamadı:", err2);
      Object.values(currencyTargets).forEach((cfg) => {
        const el = document.getElementById(cfg.id);
        if (el) el.textContent = "--";
      });
    }
  }
}

// -----------------------------
// VIDEO AUTOPLAY GÜVENCESİ
// -----------------------------
function ensureVideoPlays() {
  const video = document.getElementById("hotel-video");
  if (!video) return;

  // Bazı TV tarayıcıları autoplay için muted flag'ini gerektirir
  video.muted = true;
  video.setAttribute("playsinline", "");

  const playPromise = video.play();
  if (playPromise !== undefined) {
    playPromise.catch(() => {
      setTimeout(ensureVideoPlays, 3000);
    });
  }
}

// Uzaktan kumanda uyumu için basit ok tuşu desteği (opsiyonel)
document.addEventListener("keydown", (e) => {
  // Bazı TV'ler PageUp/PageDown, ok tuşlarıyla sayfayı kaydırır; engelle
  const keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "PageUp", "PageDown"];
  if (keys.includes(e.key)) {
    e.preventDefault();
  }
});

// -----------------------------
// 24 SAATTE BİR OTOMATİK YENİLE
// -----------------------------
function scheduleAutoReload() {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  setTimeout(() => {
    location.reload();
  }, ONE_DAY_MS);
}

// -----------------------------
// INIT
// -----------------------------
document.addEventListener("DOMContentLoaded", () => {
  detectTV();                // önce TV modunu algıla

  updateLocalDateTime();
  updateWorldClocks();
  fetchWeather();
  fetchRates();
  ensureVideoPlays();
  scheduleAutoReload();

  setInterval(updateLocalDateTime, 1000);
  setInterval(updateWorldClocks, 1000);
  setInterval(fetchWeather, 10 * 60 * 1000);
  setInterval(fetchRates, 5 * 60 * 1000);
});
