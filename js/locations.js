
document.querySelectorAll('.location-card').forEach(card=>{
  card.addEventListener('click',()=>{
    const id=card.dataset.id;
    const name=card.dataset.name;
    location.href=`warehouses.html?location=${encodeURIComponent(id)}&name=${encodeURIComponent(name)}`;
  });
});
