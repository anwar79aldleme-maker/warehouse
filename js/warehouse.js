const p=new URLSearchParams(location.search);
const loc=p.get('location')||'tikrit';
const name=p.get('name')||'مخازن تكريت';
const wh=Number(p.get('warehouse')||1);
const sensorId=1;

const cameraState = new Map();

document.getElementById('warehouseTitle').innerHTML=
  `<i class="fa-solid fa-warehouse"></i> مخزن ${wh}`;

document.getElementById('warehouseSubtitle').textContent=name;

document.getElementById('backBtn').href=
  `warehouses.html?location=${encodeURIComponent(loc)}&name=${encodeURIComponent(name)}`;

const tempEl = document.getElementById('temp');
const humEl = document.getElementById('hum');
const sensorStatusEl = document.getElementById('sensorStatus');
const sensorUpdatedEl = document.getElementById('sensorUpdated');

function setSensorStatus(text, cssClass=''){
  if(!sensorStatusEl) return;
  sensorStatusEl.textContent=text;
  sensorStatusEl.className=cssClass;
}

async function updateSensor(){
  try{
    const r=await fetch(`/api/sensor?location=${encodeURIComponent(loc)}&warehouse=${wh}&sensor=${sensorId}`,{
      credentials:'same-origin',
      cache:'no-store'
    });

    if(r.status===401){
      location.replace('index.html');
      return;
    }

    if(r.status===404){
      tempEl.textContent='-- °C';
      humEl.textContent='-- %';
      setSensorStatus('بانتظار أول قراءة','sensor-waiting');
      if(sensorUpdatedEl) sensorUpdatedEl.textContent='لا توجد بيانات بعد';
      return;
    }

    const data=await r.json();
    if(!r.ok || !data.ok) throw new Error(data.error||'SENSOR_API_ERROR');

    const reading=data.reading;
    tempEl.textContent = reading.temperature == null
      ? '-- °C'
      : `${Number(reading.temperature).toFixed(1)} °C`;

    humEl.textContent = reading.humidity == null
      ? '-- %'
      : `${Number(reading.humidity).toFixed(1)} %`;

    setSensorStatus(reading.online ? 'متصل' : 'القراءة قديمة', reading.online ? 'sensor-online' : 'sensor-offline');

    if(sensorUpdatedEl){
      const d=new Date(reading.updatedAt);
      sensorUpdatedEl.textContent=`آخر تحديث: ${d.toLocaleTimeString('ar-IQ')}`;
    }
  }catch(err){
    console.error(err);
    setSensorStatus('تعذر الاتصال بالحساس','sensor-offline');
  }
}

updateSensor();
setInterval(updateSensor,2000);

function renderCameraPlaceholder(cameraNumber, message){
  const box = document.getElementById(`cameraPreview${cameraNumber}`);
  if(!box) return;
  box.classList.remove('live-camera-frame');
  box.innerHTML = `
    <div class="camera-noise"></div>
    <i class="fa-solid fa-video"></i>
    <strong>${message}</strong>
    <small>اضغط لعرض الكاميرا بالحجم الكامل</small>`;
}

function renderLiveCamera(camera){
  const box = document.getElementById(`cameraPreview${camera.id}`);
  if(!box || !camera.streamUrl) return;
  box.classList.add('live-camera-frame');
  box.innerHTML = `
    <iframe
      src="${camera.streamUrl}"
      title="${camera.name}"
      allow="autoplay; fullscreen; picture-in-picture"
      loading="eager"></iframe>
    <div class="live-camera-badge"><i class="fa-solid fa-circle"></i> مباشر</div>`;
}

async function loadCameras(){
  [1,2].forEach(i=>renderCameraPlaceholder(i, `جاري تحميل كاميرا ${i}...`));
  try {
    const r = await fetch(`/api/cameras?location=${encodeURIComponent(loc)}&warehouse=${wh}`, {
      credentials:'same-origin', cache:'no-store'
    });
    if(r.status === 401){
      location.replace('index.html');
      return;
    }
    const data = await r.json();
    if(!r.ok || !data.ok) throw new Error(data.error || 'API_ERROR');

    data.cameras.forEach(camera=>{
      cameraState.set(Number(camera.id), camera);
      if(camera.online && camera.streamUrl){
        renderLiveCamera(camera);
      }else if(camera.linked && !data.cameraServerConfigured){
        renderCameraPlaceholder(camera.id, 'خادم البث غير مُعدّ');
      }else{
        renderCameraPlaceholder(camera.id, 'الكاميرا غير مربوطة بعد');
      }
    });
  }catch(err){
    console.error(err);
    [1,2].forEach(i=>renderCameraPlaceholder(i, 'تعذر تحميل إعداد الكاميرا'));
  }
}

loadCameras();

const fullscreenOverlay = document.getElementById('cameraFullscreen');
const fullscreenCameraTitle = document.getElementById('fullscreenCameraTitle');
const closeFullscreenBtn = document.getElementById('closeFullscreenBtn');
const browserFullscreenBtn = document.getElementById('browserFullscreenBtn');
const fullscreenCameraArea = document.getElementById('fullscreenCameraArea');

function openCameraFullscreen(cameraNumber){
  cameraNumber = Number(cameraNumber);
  fullscreenCameraTitle.textContent = `كاميرا ${cameraNumber}`;
  const camera = cameraState.get(cameraNumber);

  if(camera?.online && camera.streamUrl){
    fullscreenCameraArea.innerHTML = `
      <div class="fullscreen-live-wrap">
        <iframe
          src="${camera.streamUrl}"
          title="${camera.name}"
          allow="autoplay; fullscreen; picture-in-picture"></iframe>
        <div class="fullscreen-live-label">
          <span><i class="fa-solid fa-circle"></i> بث مباشر</span>
          <span>${name} - مخزن ${wh}</span>
        </div>
      </div>`;
  }else{
    fullscreenCameraArea.innerHTML = `
      <div class="fullscreen-demo-feed">
        <div class="camera-noise"></div>
        <div class="fullscreen-center">
          <i class="fa-solid fa-video"></i>
          <strong>كاميرا ${cameraNumber} غير متاحة</strong>
          <small>اربط مسار البث لهذه الكاميرا في data/cameras.json</small>
        </div>
        <div class="fullscreen-info">
          <span><i class="fa-solid fa-circle"></i> غير متصل</span>
          <span>${name} - مخزن ${wh}</span>
        </div>
      </div>`;
  }

  fullscreenOverlay.classList.add('show');
  fullscreenOverlay.setAttribute('aria-hidden','false');
  document.body.classList.add('camera-modal-open');
}

function closeCameraFullscreen(){
  fullscreenOverlay.classList.remove('show');
  fullscreenOverlay.setAttribute('aria-hidden','true');
  document.body.classList.remove('camera-modal-open');
  if(document.fullscreenElement){
    document.exitFullscreen().catch(()=>{});
  }
}

document.querySelectorAll('.camera-clickable').forEach(camera=>{
  camera.addEventListener('click',()=>openCameraFullscreen(camera.dataset.camera));
  camera.addEventListener('keydown',e=>{
    if(e.key==='Enter' || e.key===' '){
      e.preventDefault();
      openCameraFullscreen(camera.dataset.camera);
    }
  });
});

closeFullscreenBtn.addEventListener('click',closeCameraFullscreen);
fullscreenOverlay.addEventListener('click',e=>{
  if(e.target===fullscreenOverlay) closeCameraFullscreen();
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape' && fullscreenOverlay.classList.contains('show')) closeCameraFullscreen();
});

browserFullscreenBtn.addEventListener('click',async()=>{
  try{
    if(!document.fullscreenElement){
      await fullscreenOverlay.requestFullscreen();
      browserFullscreenBtn.innerHTML = '<i class="fa-solid fa-compress"></i><span>تصغير الشاشة</span>';
    }else{
      await document.exitFullscreen();
      browserFullscreenBtn.innerHTML = '<i class="fa-solid fa-expand"></i><span>ملء الشاشة</span>';
    }
  }catch(err){ console.log(err); }
});

document.addEventListener('fullscreenchange',()=>{
  if(!document.fullscreenElement){
    browserFullscreenBtn.innerHTML = '<i class="fa-solid fa-expand"></i><span>ملء الشاشة</span>';
  }
});
