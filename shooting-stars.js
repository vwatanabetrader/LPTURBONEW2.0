/**
 * Shooting Stars Effect - Vanilla JavaScript
 * Adaptado do componente React para uso em HTML/CSS/JS vanilla
 */

class ShootingStars {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Container with id "${containerId}" not found`);
            return;
        }

        // Configurações
        this.config = {
            minSpeed: options.minSpeed || 10,
            maxSpeed: options.maxSpeed || 30,
            minDelay: options.minDelay || 1200,
            maxDelay: options.maxDelay || 4200,
            starColor: options.starColor || '#169E5F',
            trailColor: options.trailColor || '#2EB9DF',
            starWidth: options.starWidth || 10,
            starHeight: options.starHeight || 1,
            className: options.className || ''
        };

        this.stars = [];
        this.animationFrameId = null;
        this.createTimeoutId = null;

        this.init();
    }

    init() {
        // Criar SVG container
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('class', `shooting-stars-svg ${this.config.className}`);
        this.svg.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 3;
        `;

        // Criar definições de gradiente
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        gradient.setAttribute('id', 'shooting-star-gradient');
        gradient.setAttribute('x1', '0%');
        gradient.setAttribute('y1', '0%');
        gradient.setAttribute('x2', '100%');
        gradient.setAttribute('y2', '100%');

        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('style', `stop-color: ${this.config.trailColor}; stop-opacity: 0`);

        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('style', `stop-color: ${this.config.starColor}; stop-opacity: 1`);

        gradient.appendChild(stop1);
        gradient.appendChild(stop2);
        defs.appendChild(gradient);
        this.svg.appendChild(defs);

        this.container.appendChild(this.svg);

        // Iniciar criação de estrelas
        this.createStar();

        // Iniciar loop de animação
        this.animate();
    }

    getRandomStartPoint() {
        const side = Math.floor(Math.random() * 4);
        const offset = Math.random() * window.innerWidth;

        switch (side) {
            case 0:
                return { x: offset, y: 0, angle: 45 };
            case 1:
                return { x: window.innerWidth, y: offset, angle: 135 };
            case 2:
                return { x: offset, y: window.innerHeight, angle: 225 };
            case 3:
                return { x: 0, y: offset, angle: 315 };
            default:
                return { x: 0, y: 0, angle: 45 };
        }
    }

    createStar() {
        const { x, y, angle } = this.getRandomStartPoint();
        const speed = Math.random() * (this.config.maxSpeed - this.config.minSpeed) + this.config.minSpeed;

        const star = {
            id: Date.now() + Math.random(),
            x,
            y,
            angle,
            scale: 1,
            speed,
            distance: 0,
            element: null
        };

        // Criar elemento SVG rect
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('fill', 'url(#shooting-star-gradient)');
        star.element = rect;

        this.svg.appendChild(rect);
        this.stars.push(star);

        // Agendar próxima estrela
        const randomDelay = Math.random() * (this.config.maxDelay - this.config.minDelay) + this.config.minDelay;
        this.createTimeoutId = setTimeout(() => this.createStar(), randomDelay);
    }

    updateStar(star) {
        const radians = (star.angle * Math.PI) / 180;
        star.x += star.speed * Math.cos(radians);
        star.y += star.speed * Math.sin(radians);
        star.distance += star.speed;
        star.scale = 1 + star.distance / 100;

        // Verificar se a estrela saiu da tela
        if (
            star.x < -20 ||
            star.x > window.innerWidth + 20 ||
            star.y < -20 ||
            star.y > window.innerHeight + 20
        ) {
            return false; // Remover estrela
        }

        // Atualizar elemento SVG
        if (star.element) {
            const width = this.config.starWidth * star.scale;
            const height = this.config.starHeight;

            star.element.setAttribute('x', star.x);
            star.element.setAttribute('y', star.y);
            star.element.setAttribute('width', width);
            star.element.setAttribute('height', height);
            star.element.setAttribute(
                'transform',
                `rotate(${star.angle}, ${star.x + width / 2}, ${star.y + height / 2})`
            );
        }

        return true; // Manter estrela
    }

    animate() {
        // Atualizar todas as estrelas
        this.stars = this.stars.filter(star => {
            const shouldKeep = this.updateStar(star);
            if (!shouldKeep && star.element) {
                this.svg.removeChild(star.element);
            }
            return shouldKeep;
        });

        this.animationFrameId = requestAnimationFrame(() => this.animate());
    }

    destroy() {
        // Limpar timeouts e animation frames
        if (this.createTimeoutId) {
            clearTimeout(this.createTimeoutId);
        }
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }

        // Remover SVG do DOM
        if (this.svg && this.svg.parentNode) {
            this.svg.parentNode.removeChild(this.svg);
        }

        this.stars = [];
    }
}

// Exportar para uso global
window.ShootingStars = ShootingStars;
