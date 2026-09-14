const p = new URLSearchParams(location.search);

const loc = (p.get('location') || 'tikrit').trim();
const name = (p.get('name') || 'مخازن تكريت').trim();
const wh = Number((p.get('warehouse') || '1').trim());

const sensorId = 1;

const cameraState = new Map();


// ======================================================
// معلومات المخزن
// ======================================================

document.getElementById('warehouseTitle').innerHTML =
  `<i class="fa-solid fa-warehouse"></i> مخزن ${wh}`;

document.getElementById('warehouseSubtitle').textContent = name;

document.getElementById('backBtn').href =
  `warehouses.html?location=${encodeURIComponent(loc)}&name=${encodeURIComponent(name)}`;


// ======================================================
// عناصر الحساس
// ======================================================

const tempEl = document.getElementById('temp');
const humEl = document.getElementById('hum');
const sensorStatusEl = document.getElementById('sensorStatus');
const sensorUpdatedEl = document.getElementById('sensorUpdated');


// ======================================================
// حالة الحساس
// ======================================================

function setSensorStatus(text, cssClass = '') {

  if (!sensorStatusEl) return;

  sensorStatusEl.textContent = text;
  sensorStatusEl.className = cssClass;
}


// ======================================================
// قراءة الحساس
// ======================================================

async function updateSensor() {

  try {

    const url =
      `/api/sensor?location=${encodeURIComponent(loc)}&warehouse=${encodeURIComponent(wh)}&sensor=${encodeURIComponent(sensorId)}`;

    const r = await fetch(url, {
      credentials: 'same-origin',
      cache: 'no-store'
    });


    if (r.status === 401) {

      location.replace('index.html');

      return;
    }


    if (r.status === 404) {

      if (tempEl) tempEl.textContent = '-- °C';

      if (humEl) humEl.textContent = '-- %';

      setSensorStatus(
        'بانتظار أول قراءة',
        'sensor-waiting'
      );

      if (sensorUpdatedEl) {

        sensorUpdatedEl.textContent =
          'لا توجد بيانات بعد';
      }

      return;
    }


    const data = await r.json();


    if (!r.ok || !data.ok) {

      throw new Error(
        data.error || 'SENSOR_API_ERROR'
      );
    }


    const reading = data.reading;


    // الحرارة
    if (tempEl) {

      tempEl.textContent =
        reading.temperature == null
          ? '-- °C'
          : `${Number(reading.temperature).toFixed(1)} °C`;

    }


    // الرطوبة
    if (humEl) {

      humEl.textContent =
        reading.humidity == null
          ? '-- %'
          : `${Number(reading.humidity).toFixed(1)} %`;

    }


    // حالة الحساس
    setSensorStatus(
      reading.online
        ? 'متصل'
        : 'القراءة قديمة',

      reading.online
        ? 'sensor-online'
        : 'sensor-offline'
    );


    // آخر تحديث
    if (sensorUpdatedEl) {

      if (reading.updatedAt) {

        const d =
          new Date(reading.updatedAt);

        sensorUpdatedEl.textContent =
          `آخر تحديث: ${d.toLocaleTimeString('ar-IQ')}`;

      } else {

        sensorUpdatedEl.textContent =
          'وقت التحديث غير متوفر';

      }
    }


  } catch (err) {

    console.error(
      'Sensor error:',
      err
    );

    if (tempEl) {
      tempEl.textContent = '-- °C';
    }

    if (humEl) {
      humEl.textContent = '-- %';
    }

    setSensorStatus(
      'تعذر الاتصال بالحساس',
      'sensor-offline'
    );
  }
}


// تشغيل الحساس
updateSensor();

setInterval(
  updateSensor,
  2000
);


// ======================================================
// حالة عدم توفر الكاميرا
// ======================================================

function renderCameraPlaceholder(
  cameraNumber,
  message
) {

  const box =
    document.getElementById(
      `cameraPreview${cameraNumber}`
    );

  if (!box) return;


  box.classList.remove(
    'live-camera-frame'
  );


  box.innerHTML = `
    <div class="camera-noise"></div>

    <i class="fa-solid fa-video"></i>

    <strong>
      ${message}
    </strong>

    <small>
      اضغط لعرض الكاميرا بالحجم الكامل
    </small>
  `;
}


// ======================================================
// عرض الكاميرا الحقيقية
// ======================================================

function renderLiveCamera(camera) {

  const box =
    document.getElementById(
      `cameraPreview${camera.id}`
    );


  if (!box || !camera.streamUrl) {

    return;
  }


  box.classList.add(
    'live-camera-frame'
  );


  /*
    لا يوجد Label "مباشر" داخل الفيديو.
    عبارة LIVE الموجودة أعلى البطاقة تبقى كما هي في HTML.
  */

  box.innerHTML = `
    <iframe
      src="${camera.streamUrl}"
      title="${camera.name || `كاميرا ${camera.id}`}"
      allow="autoplay; fullscreen; picture-in-picture"
      loading="eager">
    </iframe>
  `;
}


// ======================================================
// تحميل الكاميرات
// ======================================================

async function loadCameras() {

  [1, 2].forEach(i => {

    renderCameraPlaceholder(
      i,
      `جاري تحميل كاميرا ${i}...`
    );

  });


  try {

    const url =
      `/api/cameras?location=${encodeURIComponent(loc)}&warehouse=${encodeURIComponent(wh)}`;


    const r = await fetch(url, {

      credentials: 'same-origin',

      cache: 'no-store'

    });


    if (r.status === 401) {

      location.replace('index.html');

      return;
    }


    const data =
      await r.json();


    if (!r.ok || !data.ok) {

      throw new Error(
        data.error || 'CAMERA_API_ERROR'
      );

    }


    cameraState.clear();


    data.cameras.forEach(camera => {

      const cameraId =
        Number(camera.id);


      cameraState.set(
        cameraId,
        camera
      );


      if (
        camera.online &&
        camera.streamUrl
      ) {

        renderLiveCamera(
          camera
        );

      }

      else if (
        camera.linked &&
        !data.cameraServerConfigured
      ) {

        renderCameraPlaceholder(
          cameraId,
          'خادم البث غير مُعدّ'
        );

      }

      else if (
        camera.linked
      ) {

        renderCameraPlaceholder(
          cameraId,
          'الكاميرا غير متاحة حالياً'
        );

      }

      else {

        renderCameraPlaceholder(
          cameraId,
          'الكاميرا غير مربوطة بعد'
        );

      }

    });


  } catch (err) {

    console.error(
      'Camera loading error:',
      err
    );


    [1, 2].forEach(i => {

      renderCameraPlaceholder(
        i,
        'تعذر تحميل إعداد الكاميرا'
      );

    });

  }
}


// تشغيل الكاميرات
loadCameras();


// إعادة الفحص كل 30 ثانية
setInterval(
  loadCameras,
  30000
);


// ======================================================
// Full Screen
// ======================================================

const fullscreenOverlay =
  document.getElementById(
    'cameraFullscreen'
  );

const fullscreenCameraTitle =
  document.getElementById(
    'fullscreenCameraTitle'
  );

const closeFullscreenBtn =
  document.getElementById(
    'closeFullscreenBtn'
  );

const browserFullscreenBtn =
  document.getElementById(
    'browserFullscreenBtn'
  );

const fullscreenCameraArea =
  document.getElementById(
    'fullscreenCameraArea'
  );


// ======================================================
// فتح الكاميرا بالحجم الكامل
// ======================================================

function openCameraFullscreen(cameraNumber) {

  cameraNumber =
    Number(cameraNumber);


  if (fullscreenCameraTitle) {

    fullscreenCameraTitle.textContent =
      `كاميرا ${cameraNumber}`;

  }


  const camera =
    cameraState.get(
      cameraNumber
    );


  if (
    camera?.online &&
    camera.streamUrl
  ) {

    fullscreenCameraArea.innerHTML = `
      <div class="fullscreen-live-wrap">

        <iframe
          src="${camera.streamUrl}"
          title="${camera.name || `كاميرا ${cameraNumber}`}"
          allow="autoplay; fullscreen; picture-in-picture">
        </iframe>

      </div>
    `;

  }

  else {

    fullscreenCameraArea.innerHTML = `
      <div class="fullscreen-demo-feed">

        <div class="camera-noise"></div>

        <div class="fullscreen-center">

          <i class="fa-solid fa-video"></i>

          <strong>
            كاميرا ${cameraNumber} غير متاحة
          </strong>

          <small>
            اربط مسار البث لهذه الكاميرا في data/cameras.json
          </small>

        </div>

        <div class="fullscreen-info">

          <span>
            غير متصل
          </span>

          <span>
            ${name} - مخزن ${wh}
          </span>

        </div>

      </div>
    `;
  }


  if (fullscreenOverlay) {

    fullscreenOverlay.classList.add(
      'show'
    );


    fullscreenOverlay.setAttribute(
      'aria-hidden',
      'false'
    );

  }


  document.body.classList.add(
    'camera-modal-open'
  );
}


// ======================================================
// إغلاق Full Screen
// ======================================================

function closeCameraFullscreen() {

  if (fullscreenOverlay) {

    fullscreenOverlay.classList.remove(
      'show'
    );


    fullscreenOverlay.setAttribute(
      'aria-hidden',
      'true'
    );

  }


  document.body.classList.remove(
    'camera-modal-open'
  );


  if (document.fullscreenElement) {

    document.exitFullscreen()
      .catch(() => {});

  }
}


// ======================================================
// الضغط على بطاقة الكاميرا
// ======================================================

document
  .querySelectorAll(
    '.camera-clickable'
  )
  .forEach(camera => {

    camera.addEventListener(
      'click',
      () => {

        openCameraFullscreen(
          camera.dataset.camera
        );

      }
    );


    camera.addEventListener(
      'keydown',
      e => {

        if (
          e.key === 'Enter' ||
          e.key === ' '
        ) {

          e.preventDefault();

          openCameraFullscreen(
            camera.dataset.camera
          );

        }

      }
    );

  });


// ======================================================
// زر الإغلاق
// ======================================================

if (closeFullscreenBtn) {

  closeFullscreenBtn.addEventListener(
    'click',
    closeCameraFullscreen
  );

}


// ======================================================
// الضغط خارج النافذة
// ======================================================

if (fullscreenOverlay) {

  fullscreenOverlay.addEventListener(
    'click',
    e => {

      if (
        e.target === fullscreenOverlay
      ) {

        closeCameraFullscreen();

      }

    }
  );

}


// ======================================================
// ESC
// ======================================================

document.addEventListener(
  'keydown',
  e => {

    if (
      e.key === 'Escape' &&
      fullscreenOverlay &&
      fullscreenOverlay.classList.contains(
        'show'
      )
    ) {

      closeCameraFullscreen();

    }

  }
);


// ======================================================
// Fullscreen المتصفح
// ======================================================

if (
  browserFullscreenBtn &&
  fullscreenOverlay
) {

  browserFullscreenBtn.addEventListener(
    'click',
    async () => {

      try {

        if (
          !document.fullscreenElement
        ) {

          await fullscreenOverlay
            .requestFullscreen();


          browserFullscreenBtn.innerHTML =
            '<i class="fa-solid fa-compress"></i><span>تصغير الشاشة</span>';

        }

        else {

          await document
            .exitFullscreen();


          browserFullscreenBtn.innerHTML =
            '<i class="fa-solid fa-expand"></i><span>ملء الشاشة</span>';

        }

      }

      catch (err) {

        console.error(
          'Fullscreen error:',
          err
        );

      }

    }
  );

}


// ======================================================
// عند الخروج من Full Screen
// ======================================================

document.addEventListener(
  'fullscreenchange',
  () => {

    if (
      !document.fullscreenElement &&
      browserFullscreenBtn
    ) {

      browserFullscreenBtn.innerHTML =
        '<i class="fa-solid fa-expand"></i><span>ملء الشاشة</span>';

    }

  }
);
