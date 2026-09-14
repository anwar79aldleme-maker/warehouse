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

// ======================================================
// إنشاء كروت المخازن
// ======================================================

for (let i = 1; i <= warehouseTotal; i++) {

  const card = document.createElement('article');
  card.className = 'warehouse-card';

  card.innerHTML = `
    <div class="warehouse-head">

      <h3>
        <i class="fa-solid fa-warehouse"></i>
        مخزن ${i}
      </h3>

      <a class="open-link" href="warehouse.html?location=${encodeURIComponent(loc)}&name=${encodeURIComponent(locName)}&warehouse=${i}">
        فتح المخزن
        <i class="fa-solid fa-up-right-from-square"></i>
      </a>

    </div>

    <div class="cams">

      <!-- كاميرا 1 -->
      <div>
        <div class="cam-label">
          <span>كاميرا 1</span>
          <span class="live-dot">LIVE</span>
        </div>

        <div
          id="camera-${i}-1"
          class="camera-preview"
          style="cursor:pointer">

          <div class="camera-noise"></div>

          <i class="fa-solid fa-video"></i>

          <strong>جاري تحميل الكاميرا...</strong>

          <small>كاميرا 1</small>

        </div>
      </div>


      <!-- كاميرا 2 -->
      <div>
        <div class="cam-label">
          <span>كاميرا 2</span>
          <span class="live-dot">LIVE</span>
        </div>

        <div
          id="camera-${i}-2"
          class="camera-preview"
          style="cursor:pointer">

          <div class="camera-noise"></div>

          <i class="fa-solid fa-video"></i>

          <strong>جاري تحميل الكاميرا...</strong>

          <small>كاميرا 2</small>

        </div>
      </div>

    </div>


    <div class="sensor-row">

      <!-- الحرارة -->
      <div class="mini-sensor">

        <i class="fa-solid fa-temperature-half"></i>

        <div>
          <span>الحرارة</span>

          <strong id="t-${i}">
            -- °C
          </strong>

        </div>

      </div>


      <!-- الرطوبة -->
      <div class="mini-sensor">

        <i class="fa-solid fa-droplet"></i>

        <div>

          <span>الرطوبة</span>

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

  grid.appendChild(card);
}


// ======================================================
// عرض الكاميرا
// ======================================================

function showCamera(warehouse, camera) {

  const box =
    document.getElementById(`camera-${warehouse}-${camera.id}`);

  if (!box) return;


  if (camera.online && camera.streamUrl) {

    box.classList.add('live-camera-frame');

    box.innerHTML = `
      <iframe
        src="${camera.streamUrl}"
        title="${camera.name || `كاميرا ${camera.id}`}"
        allow="autoplay; fullscreen; picture-in-picture"
        loading="lazy"
        style="
          width:100%;
          height:100%;
          border:0;
          display:block;
        ">
      </iframe>

      <div class="live-camera-badge">
        <i class="fa-solid fa-circle"></i>
        مباشر
      </div>
    `;

  } else {

    box.classList.remove('live-camera-frame');

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
// تحميل كاميرات مخزن واحد
// ======================================================

async function loadWarehouseCameras(warehouse) {

  try {

    const response = await fetch(
      `/api/cameras?location=${encodeURIComponent(loc)}&warehouse=${warehouse}`,
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

      throw new Error(
        data.error || 'CAMERA_API_ERROR'
      );
    }


    data.cameras.forEach(camera => {

      showCamera(
        warehouse,
        camera
      );

    });


  } catch (error) {

    console.error(
      `Camera warehouse ${warehouse}:`,
      error
    );

  }
}


// ======================================================
// تحميل حساس مخزن واحد
// ======================================================

async function loadWarehouseSensor(warehouse) {

  const temp =
    document.getElementById(`t-${warehouse}`);

  const hum =
    document.getElementById(`h-${warehouse}`);

  const status =
    document.getElementById(`sensor-status-${warehouse}`);


  try {

    const response = await fetch(
      `/api/sensor?location=${encodeURIComponent(loc)}&warehouse=${warehouse}&sensor=1`,
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

      status.title =
        'لا توجد قراءة لهذا المخزن';

      return;
    }


    const data = await response.json();


    if (!response.ok || !data.ok) {

      throw new Error(
        data.error || 'SENSOR_API_ERROR'
      );
    }


    const reading = data.reading;


    // الحرارة
    temp.textContent =
      reading.temperature == null
        ? '-- °C'
        : `${Number(reading.temperature).toFixed(1)} °C`;


    // الرطوبة
    hum.textContent =
      reading.humidity == null
        ? '-- %'
        : `${Number(reading.humidity).toFixed(1)} %`;


    // حالة الاتصال
    if (reading.online) {

      status.classList.remove(
        'sensor-offline'
      );

      status.classList.add(
        'sensor-online'
      );

      status.title =
        'الحساس متصل';

    } else {

      status.classList.remove(
        'sensor-online'
      );

      status.classList.add(
        'sensor-offline'
      );

      status.title =
        'القراءة قديمة';
    }


  } catch (error) {

    console.error(
      `Sensor warehouse ${warehouse}:`,
      error
    );

    temp.textContent = '-- °C';
    hum.textContent = '-- %';

    status.title =
      'تعذر الاتصال بالحساس';
  }
}


// ======================================================
// تحميل جميع الكاميرات
// ======================================================

async function loadAllCameras() {

  const jobs = [];

  for (let i = 1; i <= warehouseTotal; i++) {

    jobs.push(
      loadWarehouseCameras(i)
    );

  }

  await Promise.allSettled(jobs);
}


// ======================================================
// تحميل جميع الحساسات
// ======================================================

async function loadAllSensors() {

  const jobs = [];

  for (let i = 1; i <= warehouseTotal; i++) {

    jobs.push(
      loadWarehouseSensor(i)
    );

  }

  await Promise.allSettled(jobs);


  const lastUpdate =
    document.getElementById('lastUpdate');

  if (lastUpdate) {

    lastUpdate.textContent =
      new Date().toLocaleTimeString('ar-IQ');

  }
}


// ======================================================
// التشغيل
// ======================================================

loadAllCameras();

loadAllSensors();


// تحديث الحساسات كل 5 ثواني
setInterval(
  loadAllSensors,
  5000
);


// تحديث حالة الكاميرات كل 30 ثانية
setInterval(
  loadAllCameras,
  30000
);
