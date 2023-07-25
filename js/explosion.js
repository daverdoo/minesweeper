function initializeAnimation(x, y) {
    const CANVAS_WIDTH = window.innerWidth;
    const CANVAS_HEIGHT = window.innerHeight;
    const MIN = 0;
    const MAX = CANVAS_WIDTH;
    const COUNT = 24;
    const mouse = { x: x, y: y };
  
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
  
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
  
    function clamp(number, min = MIN, max = MAX) {
      return Math.max(min, Math.min(number, max));
    }
  
    function random(factor) {
      return clamp(Math.floor(Math.random() * factor));
    }
  
    function degreeToRadian(deg) {
      return deg * (Math.PI / 180);
    }
  
    // All the properties for Satellite
    class Satellite {
      x = 0;
      y = 0;
      size = 0;
      r = 0;
      deg = 0;
      bgColor = "";
  
      constructor(ctx, deg) {
        this.ctx = ctx;
        this.deg = deg;
        this.reset();
        // this.deg = clamp(Math.floor(Math.random() * 360));
      }
  
      draw() {
        this.ctx.beginPath();
        this.ctx.fillStyle = this.bgColor;
        this.ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.closePath();
      }
  
      reset() {
        this.x = CANVAS_WIDTH / 2;
        this.y = CANVAS_HEIGHT / 2;
        this.size = random(8);
        this.r = random(100);
        this.bgColor = this.randomColor;
      }
  
      get randomColor() {
        const r = random(255);
        const g = random(255);
        const b = random(255);
        const rgba = `rgba(${r},${g},${b}, 1)`;
        return rgba;
      }
    }
  
    // All the properties for Ring
    class Ring {
      x = 0;
      y = 0;
      radius = 0;
      color = "";
      velocity = 0;
  
      constructor(ctx, deg) {
        this.ctx = ctx;
        this.reset();
      }
  
      draw() {
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        this.ctx.strokeStyle = this.color;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        this.ctx.closePath();
      }
  
      reset() {
        this.x = 0;
        this.y = 0;
        this.radius = 0;
        this.color = "#ffffffaa";
        this.velocity = 2;
      }
    }
  
    // Array for storing all the generated satellites
    let satellites = [];
  
    // Generate satellites
    for (let i = 0; i < COUNT; i++) {
      let deg = 360 / COUNT;
      satellites.push(new Satellite(ctx, i * deg));
    }
  
    // Ring instance
    let ring = new Ring(ctx);
  
    // Clear canvas
    function clearCanvas() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  
    let myReq,
      flag = 0;
  
    function animate() {
      clearCanvas();
  
      if (flag === 80) {
        cancelAnimationFrame(myReq);
        flag = 0;
  
        ring.reset();
        satellites.forEach((el) => {
          el.reset();
        });
        return;
      }
  
      ring.x = mouse.x;
      ring.y = mouse.y;
      ring.radius = ring.radius + ring.velocity;
      ring.draw();
  
      satellites.forEach((el) => {
        el.x = mouse.x + el.r * Math.cos(degreeToRadian(el.deg));
        el.y = mouse.y + el.r * Math.sin(degreeToRadian(el.deg));
        el.r = el.r + 0.02 * el.r;
        el.draw();
      });
  
      flag++;
  
      myReq = requestAnimationFrame(animate);
    }

    animate();
  }