const params = new URLSearchParams(location.search);

const loc = params.get('location') || 'tikrit';
const locName = params.get('name') || 'مخازن تكريت';

const warehouseTotal =
  loc === 'mosul' ? 5 :
  loc === 'jurf' ? 3 :
  12;

document.getElementById('warehouseCount').textContent = warehouseTotal;
document.getElementById('cameraCount').textContent = warehouseTotal * 2;
document.getElementById('sensorCount').textContent = warehouseTotal;

document.getElementById('siteTitle').innerHTML =
  `<i class="fa-solid fa-location-dot"></i> ${locName}`;

const grid = document.getElementById('warehousesGrid');

/* =========================================
   إنشاء بطاقات المخازن
========================================= */

for (let i = 1; i <= warehouseTotal; i++) {

  const card = document.createElement('article');

  card.className = 'warehouse-card';

  card.innerHTML = `
    <div class="warehouse-head">

      <h3>
        <i class="fa-solid fa-warehouse"></i>
        مخزن ${i}
      </h3>

      <a
        class="open-link"
        href="warehouse.html?location=${encodeURIComponent(loc)}
        &name=${encodeURIComponent(locName)}
        &warehouse=${i}">
        فتح المخزن
        <i class="fa-solid fa-up-right-from-square"></i>
      </a>

    </div>

    <div class="cams">

      <div>
        <div class="cam-label">
          <span>كاميرا 1</span>
          <span id="cam-status-${i}-1" class="live-dot">
            ...
          </span>
        </div>

        <div
          id="cam-${i}-1"
          class="camera-preview">

          <i class="fa-solid fa-video"></i>
          <strong>جاري التحميل...</strong>

        </div>
      </div>


      <div>
        <div class="cam-label">
          <span>كاميرا 2</span>
          <span id="cam-status-${i}-2" class="live-dot">
            ...
          </span>
        </div>

        <div
          id="cam-${i}-2"
          class="camera-preview">

          <i class="fa-solid fa-video"></i>
          <strong>جاري التحميل...</strong>

        </div>
      </div>

    </div>


    <div class="sensor-row">

      <div class="mini-sensor">

        <i class="fa-solid fa-temperature-half"></i>

        <div>
          <span>الحرارة</span>
          <strong id="t-${i}">-- °C</strong>
        </div>

      </div>


      <div class="mini-sensor">

        <i class="fa-solid fa-droplet"></i>

        <div>
          <span>الرطوبة</span>
          <strong id="h-${i}">-- %</strong>
        </div>

      </div>


      <div
        id="sensor-status-${i}"
        class="sensor-online"
        title="حالة الحساس">

        <i class="fa-solid fa-wifi"></i>

      </div>

    </div>
  `;

  grid.appendChild(card);
}


/* =========================================
   الكاميرات
========================================= */

async function loadWarehouseCameras(warehouseId) {

  try {

    const response = await fetch(
      `/api/cameras?location=${encodeURIComponent(loc)}&warehouse=${warehouseId}`,
      {
        credentials: 'same-origin',
        cache: 'no-store'
      }
    );

    if (response.status === 401) {
      location.replace('index.html');
      return;
    }

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error('CAMERA_API_ERROR');
    }

    data.cameras.forEach(camera => {

      const box =
        document.getElementById(
          `cam-${warehouseId}-${camera.id}`
        );

      const status =
        document.getElementById(
          `cam-status-${warehouseId}-${camera.id}`
        );

      if (!box || !status) return;


      if (camera.online && camera.streamUrl) {

        status.textContent = 'LIVE';

        status.style.color = '#6ee7b7';

        box.innerHTML = `
          <iframe
            src="${camera.streamUrl}"
            title="${camera.name}"
            allow="autoplay; fullscreen; picture-in-picture"
            loading="lazy">
          </iframe>

          <div class="live-camera-badge">
            <i class="fa-solid fa-circle"></i>
            مباشر
          </div>
        `;

        box.classList.add('live-camera-frame');

      } else {

        status.textContent = 'OFF';

        box.innerHTML = `
          <i class="fa-solid fa-video"></i>
          <strong>غير مربوطة</strong>
          <small>${camera.name}</small>
        `;
      }

    });

  } catch (error) {

    console.error(
      'Camera error warehouse',
      warehouseId,
      error
    );

  }

}


/* =========================================
   الحساسات
========================================= */

async function loadWarehouseSensor(warehouseId) {

  const temp =
    document.getElementById(`t-${warehouseId}`);

  const hum =
    document.getElementById(`h-${warehouseId}`);

  const status =
    document.getElementById(
      `sensor-status-${warehouseId}`
    );


  try {

    const response = await fetch(
      `/api/sensor?location=${encodeURIComponent(loc)}
      &warehouse=${warehouseId}
      &sensor=1`,
      {
        credentials: 'same-origin',
        cache: 'no-store'
      }
    );


    if (response.status === 401) {

      location.replace('index.html');

      return;
    }


    if (response.status === 404) {

      temp.textContent = '-- °C';

      hum.textContent = '-- %';

      status.style.color = '#64748b';

      status.title = 'لا توجد قراءة';

      return;
    }


    const data = await response.json();


    if (!response.ok || !data.ok) {

      throw new Error('SENSOR_API_ERROR');

    }


    const reading = data.reading;


    temp.textContent =
      reading.temperature == null
        ? '-- °C'
        : `${Number(reading.temperature).toFixed(1)} °C`;


    hum.textContent =
      reading.humidity == null
        ? '-- %'
        : `${Number(reading.humidity).toFixed(1)} %`;


    if (reading.online) {

      status.style.color = '#10b981';

      status.title = 'الحساس متصل';

    } else {

      status.style.color = '#f59e0b';

      status.title = 'القراءة قديمة';

    }

  } catch (error) {

    console.error(
      'Sensor error warehouse',
      warehouseId,
      error
    );

    temp.textContent = '-- °C';

    hum.textContent = '-- %';

    status.style.color = '#ef4444';

    status.title = 'تعذر الاتصال';

  }

}


/* =========================================
   تحديث جميع المخازن
========================================= */

async function updateAll() {

  const jobs = [];

  for (let i = 1; i <= warehouseTotal; i++) {

    jobs.push(loadWarehouseCameras(i));

    jobs.push(loadWarehouseSensor(i));

  }

  await Promise.allSettled(jobs);

  document.getElementById(
    'lastUpdate'
  ).textContent =
    new Date().toLocaleTimeString('ar-IQ');

}


/* =========================================
   بدء الصفحة
========================================= */

updateAll();

setInterval(() => {

  for (let i = 1; i <= warehouseTotal; i++) {

    loadWarehouseSensor(i);

  }

  document.getElementById(
    'lastUpdate'
  ).textContent =
    new Date().toLocaleTimeString('ar-IQ');

}, 5000);
