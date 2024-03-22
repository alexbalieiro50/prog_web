const slider = document.querySelector('.list-produtos');
const products = document.querySelectorAll('.produto');

let currentIndex = 0;
const interval = 3000; // Tempo em milissegundos

function nextSlide() {
    currentIndex = (currentIndex + 1) % products.length;
    updateSlider();
}

function updateSlider() {
    const slideWidth = products[0].offsetWidth;
    slider.style.transform = `translateX(${-slideWidth * currentIndex}px)`;
}

setInterval(nextSlide, interval);