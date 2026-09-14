const params =
  new URLSearchParams(
    location.search
  );

const loc =
  (params.get('location') || 'tikrit')
    .trim();

const locName =
  (params.get('name') || 'مخازن تكريت')
    .trim();


const warehouseTotal =
  loc === 'mosul'
    ? 5
    : loc === 'jurf'
      ? 3
      : 12;


// ======================================================
// معلومات الموقع
// ======================================================

const warehouseCountEl =
  document.getElementById(
    'warehouseCount'
  );

const cameraCountEl =
  document.getElementById(
    'cameraCount'
  );

const sensorCountEl =
  document.getElementById(
    'sensorCount'
  );

const siteTitleEl =
  document.getElementById(
    'siteTitle'
  );

const lastUpdateEl =
  document.getElementById(
    'lastUpdate'
  );


if (warehouseCountEl) {

  warehouseCountEl.textContent =
    warehouseTotal;

}


if (cameraCountEl) {

  cameraCountEl.textContent =
    warehouseTotal * 2;

}


if (sensorCountEl) {

  sensorCountEl.textContent =
    warehouseTotal;

}


if (siteTitleEl) {

  siteTitleEl.innerHTML =
    `<i class="fa-solid fa-location-dot"></i> ${locName}`;

}


const grid =
  document.getElementById(
    'warehousesGrid'
  );


// ======================================================
// إنشاء بطاقات المخازن
// ======================================================

for (
  let i = 1;
  i <= warehouseTotal;
  i++
) {

  const card =
    document.createElement(
      'article'
    );


  card.className =
    'warehouse-card';


  card.innerHTML = `

    <div class="warehouse-head">

      <h3>

        <i class="fa-solid fa-warehouse"></i>

        مخزن ${i}

      </h3>


      <a
        class="open-link"
        href="warehouse.html?location=${encodeURIComponent(loc)}&name=${encodeURIComponent(locName)}&warehouse=${i}">

        فتح المخزن

        <i class="fa-solid fa-up-right-from-square"></i>

      </a>

    </div>


    <div class="cams">


      <!-- كاميرا 1 -->

      <div>

        <div class="cam-label">

          <span>
            كاميرا 1
          </span>

          <span class="live-dot">
            LIVE
          </span>

        </div>


        <div
          id="camera-${i}-1"
          class="camera-preview">

          <div class="camera-noise"></div>

          <i class="fa-solid fa-video"></i>

          <strong>
            جاري تحميل الكاميرا...
          </strong>

          <small>
            كاميرا 1
          </small>

        </div>

      </div>


      <!-- كاميرا 2 -->

      <div>

        <div class="cam-label">

          <span>
            كاميرا 2
          </span>

          <span class="live-dot">
            LIVE
          </span>

        </div>


        <div
          id="camera-${i}-2"
          class="camera-preview">

          <div class="camera-noise"></div>

          <i class="fa-solid fa-video"></i>

          <strong>
            جاري تحميل الكاميرا...
          </strong>

          <small>
            كاميرا 2
          </small>

        </div>

      </div>


    </div>


    <div class="sensor-row">


      <!-- الحرارة -->

      <div class="mini-sensor">

        <i class="fa-solid fa-temperature-half"></i>

        <div>

          <span>
            الحرارة
          </span>

          <strong id="t-${i}">
            -- °C
          </strong>

        </div>

      </div>


      <!-- الرطوبة -->

      <div class="mini-sensor">

        <i class="fa-solid fa-droplet"></i>

        <div>

          <span>
            الرطوبة
          </span>

          <strong id="h-${i}">
            -- %
          </strong>

        </div>

      </div>


      <!-- حالة الحساس -->

      <div
        id="sensor-status-${i}"
        class="sensor-online"
        title="حالة الحساس">

        <i class="fa-solid fa-wifi"></i>

      </div>


    </div>

  `;


  grid.appendChild(
    card
  );

}


// ======================================================
// عرض كاميرا حقيقية
// ======================================================

function showCamera(
  warehouse,
  camera
) {

  const box =
    document.getElementById(
      `camera-${warehouse}-${camera.id}`
    );


  if (!box) {

    return;
  }


  if (
    camera.online &&
    camera.streamUrl
  ) {

    box.classList.add(
      'live-camera-frame'
    );


    /*
      لا يوجد label "مباشر" داخل الفيديو.
      LIVE الموجودة أعلى الكاميرا تبقى.
    */

    box.innerHTML = `

      <iframe
        src="${camera.streamUrl}"
        title="${camera.name || `كاميرا ${camera.id}`}"
        allow="autoplay; fullscreen; picture-in-picture"
        loading="lazy">
      </iframe>

    `;

  }

  else {

    box.classList.remove(
      'live-camera-frame'
    );


    box.innerHTML = `

      <div class="camera-noise"></div>

      <i class="fa-solid fa-video"></i>

      <strong>
        الكاميرا غير مربوطة بعد
      </strong>

      <small>
        كاميرا ${camera.id}
      </small>

    `;

  }

}


// ======================================================
// تحميل كاميرات مخزن
// ======================================================

async function loadWarehouseCameras(
  warehouse
) {

  try {

    const url =
      `/api/cameras?location=${encodeURIComponent(loc)}&warehouse=${encodeURIComponent(warehouse)}`;


    const response =
      await fetch(
        url,
        {

          credentials:
            'same-origin',

          cache:
            'no-store'

        }
      );


    if (
      response.status === 401
    ) {

      location.replace(
        'index.html'
      );

      return;

    }


    const data =
      await response.json();


    if (
      !response.ok ||
      !data.ok
    ) {

      throw new Error(
        data.error ||
        'CAMERA_API_ERROR'
      );

    }


    data.cameras.forEach(
      camera => {

        showCamera(
          warehouse,
          camera
        );

      }
    );


  }

  catch (error) {

    console.error(
      `Camera error warehouse ${warehouse}:`,
      error
    );

  }

}


// ======================================================
// تحميل الحساس
// ======================================================

async function loadWarehouseSensor(
  warehouse
) {

  const temp =
    document.getElementById(
      `t-${warehouse}`
    );

  const hum =
    document.getElementById(
      `h-${warehouse}`
    );

  const status =
    document.getElementById(
      `sensor-status-${warehouse}`
    );


  try {

    const url =
      `/api/sensor?location=${encodeURIComponent(loc)}&warehouse=${encodeURIComponent(warehouse)}&sensor=1`;


    const response =
      await fetch(
        url,
        {

          credentials:
            'same-origin',

          cache:
            'no-store'

        }
      );


    if (
      response.status === 401
    ) {

      location.replace(
        'index.html'
      );

      return;

    }


    if (
      response.status === 404
    ) {

      if (temp) {

        temp.textContent =
          '-- °C';

      }


      if (hum) {

        hum.textContent =
          '-- %';

      }


      if (status) {

        status.classList.remove(
          'sensor-online'
        );


        status.classList.add(
          'sensor-waiting'
        );


        status.title =
          'لا توجد قراءة';

      }


      return;

    }


    const data =
      await response.json();


    if (
      !response.ok ||
      !data.ok
    ) {

      throw new Error(
        data.error ||
        'SENSOR_API_ERROR'
      );

    }


    const reading =
      data.reading;


    // الحرارة
    if (temp) {

      temp.textContent =
        reading.temperature == null
          ? '-- °C'
          : `${Number(reading.temperature).toFixed(1)} °C`;

    }


    // الرطوبة
    if (hum) {

      hum.textContent =
        reading.humidity == null
          ? '-- %'
          : `${Number(reading.humidity).toFixed(1)} %`;

    }


    // حالة الحساس
    if (status) {

      status.classList.remove(
        'sensor-online',
        'sensor-offline',
        'sensor-waiting'
      );


      if (reading.online) {

        status.classList.add(
          'sensor-online'
        );


        status.title =
          'الحساس متصل';

      }

      else {

        status.classList.add(
          'sensor-offline'
        );


        status.title =
          'القراءة قديمة';

      }

    }


  }

  catch (error) {

    console.error(
      `Sensor error warehouse ${warehouse}:`,
      error
    );


    if (temp) {

      temp.textContent =
        '-- °C';

    }


    if (hum) {

      hum.textContent =
        '-- %';

    }


    if (status) {

      status.classList.remove(
        'sensor-online',
        'sensor-waiting'
      );


      status.classList.add(
        'sensor-offline'
      );


      status.title =
        'تعذر الاتصال بالحساس';

    }

  }

}


// ======================================================
// جميع الكاميرات
// ======================================================

async function loadAllCameras() {

  const jobs = [];


  for (
    let i = 1;
    i <= warehouseTotal;
    i++
  ) {

    jobs.push(
      loadWarehouseCameras(i)
    );

  }


  await Promise.allSettled(
    jobs
  );

}


// ======================================================
// جميع الحساسات
// ======================================================

async function loadAllSensors() {

  const jobs = [];


  for (
    let i = 1;
    i <= warehouseTotal;
    i++
  ) {

    jobs.push(
      loadWarehouseSensor(i)
    );

  }


  await Promise.allSettled(
    jobs
  );


  if (lastUpdateEl) {

    lastUpdateEl.textContent =
      new Date()
        .toLocaleTimeString(
          'ar-IQ'
        );

  }

}


// ======================================================
// تشغيل النظام
// ======================================================

loadAllCameras();

loadAllSensors();


// تحديث الحساسات كل 5 ثواني
setInterval(
  loadAllSensors,
  5000
);


// تحديث الكاميرات كل 30 ثانية
setInterval(
  loadAllCameras,
  30000
);
