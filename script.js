// ----------------------------------------------------
// ESKİ SMART TV TARAYICILARI İÇİN UYUMLU SCRIPT
// ----------------------------------------------------

// Eski tarayıcılarda console yoksa hata vermesin
if (!window.console) {
  window.console = {
    log: function () {},
    warn: function () {},
    error: function () {}
  };
}

// -----------------------------
// TV ALGILAMA
// -----------------------------
function detectTV() {
  var ua = navigator.userAgent || "";
  var isTV =
    /TV|SmartTV|Tizen|WebTV|WebOS|NetCast|NetTV|HbbTV|VIDAA|Hisense|PhilipsTV|Opera TV|Vewd/i.test(
      ua
    ) || screen.width >= 2500; // büyük ekran algısı

  if (isTV) {
    document.body.className += " tv-view";
  }
}

// -----------------------------
// ZAMAN / TARİH (Intl KULLANMADAN)
// -----------------------------
var MONTH_NAMES_TR = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık"
];

var DAY_NAMES_TR = [
  "Pazar",
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi"
];

function pad2(n) {
  return n < 10 ? "0" + n : "" + n;
}

function updateLocalDateTime() {
  var now = new Date();

  var day = now.getDate();
  var month = now.getMonth();
  var year = now.getFullYear();
  var weekday = now.getDay();

  var h = now.getHours();
  var m = now.getMinutes();
  var s = now.getSeconds();

  var dateStr = pad2(day) + " " + MONTH_NAMES_TR[month] + " " + year;
  var dayStr = DAY_NAMES_TR[weekday];
  var timeStr = pad2(h) + ":" + pad2(m) + ":" + pad2(s);

  var dateEl = document.getElementById("current-date");
  var dayEl = document.getElementById("current-day");
  var timeEl = document.getElementById("current-time");

  if (dateEl) dateEl.innerHTML = dateStr;
  if (dayEl) dayEl.innerHTML = dayStr;
  if (timeEl) timeEl.innerHTML = timeStr;
}

// Dünya saatleri – UTC üstünden manuel hesap
function formatHM(dateObj) {
  return pad2(dateObj.getHours()) + ":" + pad2(dateObj.getMinutes());
}

function updateWorldClocks() {
  var now = new Date();

  // Lokal zamanı UTC'ye çevir
  var utcMs = now.getTime() + now.getTimezoneOffset() * 60000;

  // Saat farkları (yaklaşık)
  var london = new Date(utcMs + 0 * 3600000);   // UTC
  var newyork = new Date(utcMs - 5 * 3600000);  // UTC-5
  var tokyo = new Date(utcMs + 9 * 3600000);    // UTC+9

  var elLon = document.getElementById("time-london");
  var elNy = document.getElementById("time-ny");
  var elTk = document.getElementById("time-tokyo");

  if (elLon) elLon.innerHTML = formatHM(london);
  if (elNy) elNy.innerHTML = formatHM(newyork);
  if (elTk) elTk.innerHTML = formatHM(tokyo);
}

// -----------------------------
// BASİT XHR YARDIMCI FONKSİYON
// -----------------------------
function xhrGetJson(url, onSuccess, onError) {
  try {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            var data = JSON.parse(xhr.responseText);
            onSuccess(data);
          } catch (e) {
            console.error("JSON parse hatası:", e);
            if (onError) onError(e);
          }
        } else {
          console.error("XHR HTTP hata:", xhr.status);
          if (onError) onError(xhr);
        }
      }
    };
    xhr.send(null);
  } catch (e) {
    console.error("XHR çalışmadı:", e);
    if (onError) onError(e);
  }
}

// -----------------------------
// HAVA DURUMU (Open-Meteo, API KEY gerekmez)
// -----------------------------
var KARS_LAT = 40.601;
var KARS_LON = 43.097;

var weatherCodeMap = {
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
  99: "Kuvvetli dolu"
};

function fetchWeather() {
  var url =
    "https://api.open-meteo.com/v1/forecast?latitude=" +
    KARS_LAT +
    "&longitude=" +
    KARS_LON +
    "&current_weather=true&timezone=Europe%2FIstanbul";

  xhrGetJson(
    url,
    function (data) {
      if (!data || !data.current_weather) {
        console.error("Hava verisi yok");
        return;
      }
      var cw = data.current_weather;
      var temp = typeof cw.temperature === "number" ? cw.temperature : null;
      var code = cw.weathercode;

      var tempEl = document.getElementById("weather-temp");
      var descEl = document.getElementById("weather-desc");

      if (tempEl && temp !== null) {
        tempEl.innerHTML = Math.round(temp) + "°";
      }
      if (descEl) {
        if (weatherCodeMap.hasOwnProperty(code)) {
          descEl.innerHTML = weatherCodeMap[code];
        } else {
          descEl.innerHTML = "Hava bilgisi";
        }
      }
    },
    function () {
      console.error("Hava durumu alınamadı");
      var descEl = document.getElementById("weather-desc");
      if (descEl) descEl.innerHTML = "Bağlantı yok";
    }
  );
}

// -----------------------------
// DÖVİZ KURLARI
// -----------------------------
var currencyTargets = {
  JPY: { id: "rate-jpy", symbol: "¥" },
  USD: { id: "rate-usd", symbol: "$" },
  EUR: { id: "rate-eur", symbol: "€" },
  CHF: { id: "rate-chf", symbol: "Fr" },
  RUB: { id: "rate-rub", symbol: "₽" },
  GBP: { id: "rate-gbp", symbol: "£" }
};

function setRatesFromTryBase(rates) {
  for (var code in currencyTargets) {
    if (!currencyTargets.hasOwnProperty(code)) continue;
    var cfg = currencyTargets[code];
    var el = document.getElementById(cfg.id);
    if (!el) continue;

    var r = rates[code];
    if (!r || typeof r !== "number") {
      el.innerHTML = "--";
      continue;
    }

    // 1 TRY = r CODE -> 1 CODE = 1/r TRY
    var tlPerUnit = 1 / r;
    el.innerHTML = tlPerUnit.toFixed(2) + cfg.symbol;
  }
}

function fetchRatesPrimary(onDone) {
  var url = "https://open.er-api.com/v6/latest/TRY";
  xhrGetJson(
    url,
    function (data) {
      if (data && data.rates) {
        setRatesFromTryBase(data.rates);
        if (onDone) onDone(true);
      } else {
        console.error("Rates data invalid");
        if (onDone) onDone(false);
      }
    },
    function () {
      console.error("Rates primary API hata");
      if (onDone) onDone(false);
    }
  );
}

function fetchRatesFallback(onDone) {
  var url = "https://api.exchangerate.host/latest?base=TRY";
  xhrGetJson(
    url,
    function (data) {
      if (data && data.rates) {
        setRatesFromTryBase(data.rates);
        if (onDone) onDone(true);
      } else {
        console.error("Rates fallback data invalid");
        if (onDone) onDone(false);
      }
    },
    function () {
      console.error("Rates fallback API hata");
      if (onDone) onDone(false);
    }
  );
}

function fetchRates() {
  // Önce birincil API, olmazsa fallback
  fetchRatesPrimary(function (ok) {
    if (!ok) {
      fetchRatesFallback(function (ok2) {
        if (!ok2) {
          // Tamamen başarısızsa ekranda '--' göster
          for (var code in currencyTargets) {
            if (!currencyTargets.hasOwnProperty(code)) continue;
            var cfg = currencyTargets[code];
            var el = document.getElementById(cfg.id);
            if (el) el.innerHTML = "--";
          }
        }
      });
    }
  });
}

// -----------------------------
// VIDEO AUTOPLAY
// -----------------------------
function ensureVideoPlays() {
  var video = document.getElementById("hotel-video");
  if (!video) return;

  try {
    video.muted = true;
    video.setAttribute("playsinline", "");

    var playPromise = video.play && video.play();
    if (playPromise && playPromise.catch) {
      playPromise.catch(function () {
        setTimeout(ensureVideoPlays, 3000);
      });
    }
  } catch (e) {
    console.error("Video oynatılamadı:", e);
  }
}

// Uzaktan kumanda ok tuşları sayfayı kaydırmasın
document.addEventListener("keydown", function (e) {
  var keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "PageUp", "PageDown"];
  for (var i = 0; i < keys.length; i++) {
    if (e.key === keys[i]) {
      e.preventDefault();
      break;
    }
  }
});

// -----------------------------
// 24 SAATTE OTOMATİK YENİLE
// -----------------------------
function scheduleAutoReload() {
  var ONE_DAY_MS = 24 * 60 * 60 * 1000;
  setTimeout(function () {
    location.reload();
  }, ONE_DAY_MS);
}

// -----------------------------
// INIT
// -----------------------------
document.addEventListener("DOMContentLoaded", function () {
  detectTV();

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
