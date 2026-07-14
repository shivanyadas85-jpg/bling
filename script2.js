/* =========================================================
   BLING — site script
   1) 3D faceted gem (Three.js + lighting)  2) Nav & scroll
   3) Booking form (EmailJS)
   ========================================================= */

/* ---------- 1) 3D GEM ---------- */
(function initGem(){
  const canvas = document.getElementById('gem');
  if(!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 6);

  // low-poly icosahedron = visible flat facets, gem-like
  const geometry = new THREE.IcosahedronGeometry(1.7, 0);
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xC9A227,
    metalness: 0.85,
    roughness: 0.18,
    flatShading: true,
    clearcoat: 0.6,
    clearcoatRoughness: 0.25,
    reflectivity: 0.9,
  });
  const gem = new THREE.Mesh(geometry, material);
  scene.add(gem);

  // wire outline for extra facet definition
  const edges = new THREE.EdgesGeometry(geometry);
  const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xF5E7B8, transparent:true, opacity:0.35 }));
  gem.add(line);

  // lighting rig for sparkle
  scene.add(new THREE.AmbientLight(0x2a2010, 1.2));
  const key = new THREE.PointLight(0xFFE9B0, 2.2, 20); key.position.set(4, 3, 4); scene.add(key);
  const rim = new THREE.PointLight(0xFFFFFF, 1.4, 20); rim.position.set(-4, -2, 3); scene.add(rim);
  const warm = new THREE.PointLight(0xC9A227, 1.6, 20); warm.position.set(0, -4, 2); scene.add(warm);

  // ambient gold particles
  const particleCount = 140;
  const positions = new Float32Array(particleCount * 3);
  for(let i=0;i<particleCount;i++){
    positions[i*3]   = (Math.random()-0.5) * 14;
    positions[i*3+1] = (Math.random()-0.5) * 14;
    positions[i*3+2] = (Math.random()-0.5) * 8 - 2;
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particleMat = new THREE.PointsMaterial({ color: 0xE8C766, size: 0.02, transparent:true, opacity:0.5 });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  let mouseX = 0, mouseY = 0;
  window.addEventListener('pointermove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -((e.clientY / window.innerHeight) * 2 - 1);
  }, { passive:true });

  function resize(){
    const rect = canvas.parentElement.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  const clock = new THREE.Clock();
  function animate(){
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    gem.rotation.y = t * 0.22 + mouseX * 0.3;
    gem.rotation.x = Math.sin(t * 0.3) * 0.2 + mouseY * 0.2;
    particles.rotation.y = t * 0.02;
    key.position.x = Math.sin(t * 0.5) * 5;
    key.position.z = Math.cos(t * 0.5) * 5;
    renderer.render(scene, camera);
  }
  animate();
})();

/* ---------- 2) NAV & SCROLL ---------- */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('is-scrolled', window.scrollY > 40);
}, { passive:true });

const burger = document.getElementById('burger');
const navMobile = document.getElementById('navMobile');
burger.addEventListener('click', () => navMobile.classList.toggle('is-open'));
navMobile.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navMobile.classList.remove('is-open')));

document.getElementById('year').textContent = new Date().getFullYear();

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ---------- 3) BOOKING FORM (EmailJS) ---------- */
/*
  Same setup as the Nyxoris site:
  1. Create a free account at https://www.emailjs.com
  2. Add an Email Service + Email Template (To Email = the address that
     should receive bookings, e.g. Bling's own inbox).
  3. Replace the three placeholders below.
  Template variables used: {{name}} {{email}} {{phone}} {{date}} {{time}}
  {{interest}} {{message}}
*/
const EMAILJS_SERVICE_ID  = 'YOUR_SERVICE_ID';
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';
const EMAILJS_PUBLIC_KEY  = 'YOUR_PUBLIC_KEY';

if(window.emailjs && EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY'){
  emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
}

const bookingForm = document.getElementById('bookingForm');
const formStatus = document.getElementById('formStatus');
const submitBtn = document.getElementById('bookingSubmit');

bookingForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  submitBtn.disabled = true;
  formStatus.textContent = 'Sending your booking…';

  const data = Object.fromEntries(new FormData(bookingForm).entries());
  const isConfigured = EMAILJS_SERVICE_ID !== 'YOUR_SERVICE_ID';

  try{
    if(isConfigured && window.emailjs){
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, data);
    }
    if(!isConfigured){
      formStatus.textContent = 'Form works! Add EmailJS keys in script.js to receive these for real.';
    } else {
      formStatus.textContent = 'Booking sent — we\'ll confirm shortly.';
      bookingForm.reset();
    }
  } catch(err){
    console.error(err);
    formStatus.textContent = 'Something went wrong sending that — please call +971 52 243 6090 directly.';
  } finally {
    submitBtn.disabled = false;
  }
});