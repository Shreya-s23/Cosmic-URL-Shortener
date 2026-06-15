import React, { useEffect, useRef } from 'react';

const BackgroundParticles = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Star Class (Deep field stars)
    class Star {
      constructor() {
        this.reset(true);
      }

      reset(init = false) {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.z = init ? Math.random() * width : width;
        
        const colors = [
          'rgba(224, 231, 255, ', // Indigo
          'rgba(238, 242, 255, ', // White-indigo
          'rgba(167, 139, 250, ', // Violet
          'rgba(196, 181, 253, ', // Light violet
          'rgba(147, 197, 253, ', // Sky blue
        ];
        this.colorBase = colors[Math.floor(Math.random() * colors.length)];
        this.size = Math.random() * 1.2 + 0.3;
        this.alpha = Math.random() * 0.7 + 0.3;
      }

      update(speedMultiplier) {
        this.z -= speedMultiplier;
        if (this.z <= 0) {
          this.reset();
        }
      }

      draw(mouseX, mouseY, isHyper, speed) {
        const px = (this.x - width / 2) * (width / this.z) + width / 2;
        const py = (this.y - height / 2) * (width / this.z) + height / 2;
        
        const projectedSize = (this.size * (width / this.z)) * 0.15;
        const currentAlpha = Math.min(this.alpha * (width / this.z) * 0.05, 1);

        if (px < 0 || px > width || py < 0 || py > height) return;

        ctx.beginPath();
        ctx.fillStyle = `${this.colorBase}${currentAlpha})`;

        if (isHyper) {
          const prevPx = (this.x - width / 2) * (width / (this.z + speed * 1.5)) + width / 2;
          const prevPy = (this.y - height / 2) * (width / (this.z + speed * 1.5)) + height / 2;
          
          ctx.strokeStyle = `${this.colorBase}${currentAlpha * 0.8})`;
          ctx.lineWidth = projectedSize;
          ctx.moveTo(px, py);
          ctx.lineTo(prevPx, prevPy);
          ctx.stroke();
        } else {
          const dx = (mouseX - width / 2) * 0.015 * (1 - this.z / width);
          const dy = (mouseY - height / 2) * 0.015 * (1 - this.z / width);
          
          ctx.arc(px + dx, py + dy, projectedSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Shooting Star (Meteor) Class
    class ShootingStar {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * (height * 0.4); // spawn in upper sky
        this.dx = Math.random() * -10 - 6; // move leftwards
        this.dy = Math.random() * 5 + 3;    // move downwards
        this.length = Math.random() * 90 + 70;
        this.speed = Math.random() * 1.2 + 0.8;
        this.opacity = 1;
        this.fadeSpeed = Math.random() * 0.02 + 0.008;
        this.active = false;
      }

      trigger() {
        this.active = true;
      }

      update() {
        if (!this.active) return;
        this.x += this.dx * this.speed;
        this.y += this.dy * this.speed;
        this.opacity -= this.fadeSpeed;
        if (this.opacity <= 0) {
          this.reset();
        }
      }

      draw() {
        if (!this.active) return;
        
        ctx.beginPath();
        const gradient = ctx.createLinearGradient(
          this.x, 
          this.y, 
          this.x - this.dx * (this.length / 10), 
          this.y - this.dy * (this.length / 10)
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${this.opacity})`);
        gradient.addColorStop(0.3, `rgba(167, 139, 250, ${this.opacity * 0.6})`); // Violet tail
        gradient.addColorStop(1, `rgba(99, 102, 241, 0)`); // Indigo fade
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = Math.random() * 1.2 + 1.2;
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(
          this.x - this.dx * (this.length / 10), 
          this.y - this.dy * (this.length / 10)
        );
        ctx.stroke();
      }
    }

    // GitHub-style 3D Rotating Celestial Wireframe Globe
    class WireframeGlobe {
      constructor(xRatio, yRatio, radius) {
        this.xRatio = xRatio;
        this.yRatio = yRatio;
        this.radius = radius;
        this.rotationX = 0.4; // Tilted angle
        this.rotationY = 0;
      }

      update() {
        // Rotate slowly
        this.rotationY += 0.0012;
      }

      draw(mouseX, mouseY) {
        const cx = width * this.xRatio;
        const cy = height * this.yRatio;

        // Parallax offsets
        const dx = (mouseX - width / 2) * 0.01;
        const dy = (mouseY - height / 2) * 0.01;
        const posX = cx + dx;
        const posY = cy + dy;

        ctx.strokeStyle = 'rgba(99, 102, 241, 0.06)'; // Faint indigo wireframe
        ctx.lineWidth = 0.5;

        // Draw latitude rings
        const latLines = 8;
        for (let i = 1; i < latLines; i++) {
          const lat = (i / latLines) * Math.PI - Math.PI / 2;
          const r = this.radius * Math.cos(lat);
          const yOffset = this.radius * Math.sin(lat);
          
          ctx.beginPath();
          ctx.ellipse(
            posX, 
            posY + yOffset * Math.cos(this.rotationX), 
            r, 
            r * Math.sin(this.rotationX), 
            this.rotationY, 
            0, 
            Math.PI * 2
          );
          ctx.stroke();
        }

        // Draw longitude rings (meridians)
        const longLines = 10;
        for (let i = 0; i < longLines; i++) {
          const angle = (i / longLines) * Math.PI * 2 + this.rotationY;
          ctx.beginPath();
          ctx.ellipse(
            posX, 
            posY, 
            this.radius * Math.abs(Math.sin(angle)), 
            this.radius, 
            this.rotationX, 
            0, 
            Math.PI * 2
          );
          ctx.stroke();
        }

        // Draw a soft glowing dot at the center of the globe
        ctx.beginPath();
        const centerGrad = ctx.createRadialGradient(posX, posY, 1, posX, posY, 10);
        centerGrad.addColorStop(0, 'rgba(56, 189, 248, 0.6)');
        centerGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.arc(posX, posY, 10, 0, Math.PI * 2);
        ctx.fillStyle = centerGrad;
        ctx.fill();
      }
    }

    // Set up particles
    const starCount = 180;
    const stars = Array.from({ length: starCount }, () => new Star());
    
    // Shooting stars pool (10 elements for high activity)
    const shootingStars = Array.from({ length: 10 }, () => new ShootingStar());

    // 3D wireframe globe centered on the right-middle viewport (GitHub style)
    const globe = new WireframeGlobe(0.85, 0.5, 200);

    let mouseX = width / 2;
    let mouseY = height / 2;
    
    // Hyperdrive warp speed transition
    let speed = 40;
    let isHyper = true;

    // Track mouse
    const handleMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    // Handle resize
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      stars.forEach(s => s.reset(true));
      shootingStars.forEach(s => s.reset());
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    // Fade speed down after warp-in launch
    const speedInterval = setInterval(() => {
      if (speed > 1.2) {
        speed -= 1.8;
      } else {
        speed = 1.2; // Cruise speed
        isHyper = false;
        clearInterval(speedInterval);
      }
    }, 50);

    // Randomly trigger shooting stars (high frequency)
    const triggerShootingStar = () => {
      if (isHyper) return;
      const inactive = shootingStars.find(s => !s.active);
      if (inactive) {
        inactive.trigger();
      }
      setTimeout(triggerShootingStar, Math.random() * 1500 + 1000);
    };
    
    setTimeout(triggerShootingStar, 3000);

    // Render loop
    const render = () => {
      // Clear with dark space trail
      ctx.fillStyle = 'rgba(7, 6, 14, 0.18)'; 
      ctx.fillRect(0, 0, width, height);

      // Draw Vite-style dynamic mesh gradients
      const time = Date.now() * 0.0006;

      // Blob 1: Vibrant Purple (Vite-style)
      const blob1X = width * 0.2 + Math.sin(time * 0.4) * 80;
      const blob1Y = height * 0.3 + Math.cos(time * 0.3) * 80;
      const grad1 = ctx.createRadialGradient(blob1X, blob1Y, 50, blob1X, blob1Y, 500);
      grad1.addColorStop(0, 'rgba(139, 92, 246, 0.15)'); // Purple glow
      grad1.addColorStop(0.5, 'rgba(99, 102, 241, 0.05)'); // Indigo overlay
      grad1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, width, height);

      // Blob 2: Cyan / Sky Blue (Vite-style)
      const blob2X = width * 0.75 + Math.cos(time * 0.35) * 100;
      const blob2Y = height * 0.7 + Math.sin(time * 0.45) * 100;
      const grad2 = ctx.createRadialGradient(blob2X, blob2Y, 50, blob2X, blob2Y, 600);
      grad2.addColorStop(0, 'rgba(14, 165, 233, 0.12)'); // Cyan glow
      grad2.addColorStop(0.4, 'rgba(99, 102, 241, 0.04)');
      grad2.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, width, height);

      // Blob 3: Vibrant Pink / Magenta (Vite-style)
      const blob3X = width * 0.5 + Math.sin(time * 0.3) * 120;
      const blob3Y = height * 0.5 + Math.cos(time * 0.5) * 120;
      const grad3 = ctx.createRadialGradient(blob3X, blob3Y, 30, blob3X, blob3Y, 400);
      grad3.addColorStop(0, 'rgba(236, 72, 153, 0.08)'); // Pink highlight
      grad3.addColorStop(0.6, 'rgba(167, 139, 250, 0.02)');
      grad3.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad3;
      ctx.fillRect(0, 0, width, height);

      // Draw Rotating Coordinates Grid Globe (GitHub-inspired)
      if (!isHyper) {
        globe.update();
        globe.draw(mouseX, mouseY);
      }

      // Update and draw stars
      stars.forEach((star) => {
        star.update(speed);
        star.draw(mouseX, mouseY, isHyper, speed);
      });

      // Update and draw shooting stars
      if (!isHyper) {
        shootingStars.forEach(star => {
          star.update();
          star.draw();
        });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Clean up
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      clearInterval(speedInterval);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'none',
      }}
    />
  );
};

export default BackgroundParticles;
