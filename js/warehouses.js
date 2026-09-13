const params=new URLSearchParams(location.search);
const loc=params.get('location')||'tikrit';
const locName=params.get('name')||'مخازن تكريت';
const warehouseTotal = loc === 'mosul' ? 5 : (loc === 'jurf' ? 3 : 12);
document.getElementById('warehouseCount').textContent = warehouseTotal;
document.getElementById('cameraCount').textContent = warehouseTotal * 2;
document.getElementById('sensorCount').textContent = warehouseTotal;
document.getElementById('siteTitle').innerHTML=`<i class="fa-solid fa-location-dot"></i> ${locName}`;
const grid=document.getElementById('warehousesGrid');

for(let i=1;i<=warehouseTotal;i++){
  const card=document.createElement('article');
  card.className='warehouse-card';
  card.innerHTML=`
    <div class="warehouse-head">
      <h3><i class="fa-solid fa-warehouse"></i> مخزن ${i}</h3>
      <a class="open-link" href="warehouse.html?location=${encodeURIComponent(loc)}&name=${encodeURIComponent(locName)}&warehouse=${i}">
        فتح المخزن <i class="fa-solid fa-up-right-from-square"></i>
      </a>
    </div>
    <div class="cams">
      <div>
        <div class="cam-label"><span>كاميرا 1</span><span class="live-dot">LIVE</span></div>
        <div class="camera-preview"><div class="camera-noise"></div><i class="fa-solid fa-video"></i><strong>بث تجريبي</strong><small>كاميرا 1</small></div>
      </div>
      <div>
        <div class="cam-label"><span>كاميرا 2</span><span class="live-dot">LIVE</span></div>
        <div class="camera-preview"><div class="camera-noise"></div><i class="fa-solid fa-video"></i><strong>بث تجريبي</strong><small>كاميرا 2</small></div>
      </div>
    </div>
    <div class="sensor-row">
      <div class="mini-sensor"><i class="fa-solid fa-temperature-half"></i><div><span>الحرارة</span><strong id="t-${i}">-- °C</strong></div></div>
      <div class="mini-sensor"><i class="fa-solid fa-droplet"></i><div><span>الرطوبة</span><strong id="h-${i}">-- %</strong></div></div>
      <div class="sensor-online" title="حساس تجريبي متصل"><i class="fa-solid fa-wifi"></i></div>
    </div>`;
  grid.appendChild(card);
}
function update(){
  for(let i=1;i<=warehouseTotal;i++){
    const r=demoReading(i);
    document.getElementById(`t-${i}`).textContent=r.temperature.toFixed(1)+' °C';
    document.getElementById(`h-${i}`).textContent=r.humidity.toFixed(1)+' %';
  }
  document.getElementById('lastUpdate').textContent=new Date().toLocaleTimeString('ar-IQ');
}
update(); setInterval(update,3000);
