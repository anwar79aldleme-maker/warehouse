(async function protectPage(){
  try {
    const r = await fetch('/api/session', { credentials: 'same-origin', cache: 'no-store' });
    if (!r.ok) location.replace('index.html');
  } catch {
    location.replace('index.html');
  }
})();

document.addEventListener('DOMContentLoaded',()=>{
  const b=document.getElementById('logoutBtn');
  if(b) b.addEventListener('click',async()=>{
    try {
      await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' });
    } finally {
      location.href='index.html';
    }
  });
});

function demoReading(warehouse){
  const t=22 + warehouse*0.17 + Math.sin(Date.now()/5000 + warehouse)*1.3;
  const h=46 + (warehouse%5)*1.8 + Math.cos(Date.now()/5500 + warehouse)*3.2;
  return {temperature:t, humidity:h};
}
