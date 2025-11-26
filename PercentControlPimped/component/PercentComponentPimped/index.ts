import { IInputs, IOutputs } from "./generated/ManifestTypes";

export class PercentComponentPimped implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    private container: HTMLDivElement;
    private percentContainer: HTMLDivElement;
    private contentWrapper: HTMLDivElement;
    private labelElement: HTMLDivElement;
    private valueElement: HTMLDivElement;
    private niceElement: HTMLDivElement;
    private lensFlareElement: HTMLDivElement;
    private particlesContainer: HTMLDivElement;
    private explosionContainer: HTMLDivElement;
    private borderCanvas: HTMLCanvasElement;
    private borderContext: CanvasRenderingContext2D | null;
    private currentValue: number = 0;
    private animationFrame: number | null = null;
    private sparkleInterval: number | null = null;
    private frostInterval: number | null = null;
    private lastThreshold: string = "";
    private sparkleContainer: HTMLDivElement;
    private waveOffset: number = 0;
    private waveAnimationFrame: number | null = null;
    private activeExplosions: number = 0;
    private notifyOutputChanged: () => void;
    
    // Drag state
    private isDragging: boolean = false;
    private dragStartY: number = 0;
    private dragStartValue: number = 0;
    private pendingValue: number = 0;
    private lastFlareTime: number = 0;
    private midThreshold: number = 40;
    private highThreshold: number = 75;
    private hasDragged: boolean = false;


    constructor() {}

    public init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        state: ComponentFramework.Dictionary,
        container: HTMLDivElement
    ): void {
        this.container = container;
        this.notifyOutputChanged = notifyOutputChanged;
        
        this.container.style.width = "100%";
        this.container.style.height = "100%";
        this.container.style.position = "relative";
        this.container.style.display = "flex";
        this.container.style.alignItems = "center";
        this.container.style.justifyContent = "center";
        this.container.style.minHeight = "200px";
        
        this.percentContainer = document.createElement("div");
        this.percentContainer.className = "percent-container";

        this.borderCanvas = document.createElement("canvas");
        this.borderCanvas.className = "wave-border-canvas";
        this.borderContext = this.borderCanvas.getContext("2d");

        this.contentWrapper = document.createElement("div");
        this.contentWrapper.className = "content-wrapper";

        this.particlesContainer = document.createElement("div");
        this.particlesContainer.className = "particles";

        this.explosionContainer = document.createElement("div");
        this.explosionContainer.className = "explosion-container";

        this.sparkleContainer = document.createElement("div");
        this.sparkleContainer.className = "sparkle-container";

        this.labelElement = document.createElement("div");
        this.labelElement.className = "percent-label";

        this.valueElement = document.createElement("div");
        this.valueElement.className = "percent-value";

        this.niceElement = document.createElement("div");
        this.niceElement.className = "nice-text";
        this.niceElement.textContent = "Nice!";
        this.niceElement.style.display = "none";

        // Add lens flare element
        this.lensFlareElement = document.createElement("div");
        this.lensFlareElement.className = "lens-flare";

        const overlay = document.createElement("div");
        overlay.className = "selection-overlay";
        
        overlay.style.pointerEvents = "auto";
        overlay.addEventListener("click", (e) => this.handleClick(e));

         overlay.addEventListener("mousemove", (e) => this.handleOverlayMouseMove(e));
        
        // Add drag handlers
        overlay.addEventListener("mousedown", (e) => this.handleMouseDown(e));
        window.addEventListener("mousemove", (e) => this.handleMouseMove(e));
        window.addEventListener("mouseup", (e) => this.handleMouseUp(e));

        this.contentWrapper.appendChild(this.particlesContainer);
        this.contentWrapper.appendChild(this.explosionContainer);
        this.contentWrapper.appendChild(this.sparkleContainer);
        this.contentWrapper.appendChild(this.lensFlareElement); 
        this.contentWrapper.appendChild(this.labelElement);
        this.contentWrapper.appendChild(this.valueElement);
        this.contentWrapper.appendChild(this.niceElement);
        this.contentWrapper.appendChild(overlay);

        this.percentContainer.appendChild(this.borderCanvas);
        this.percentContainer.appendChild(this.contentWrapper);
        this.container.appendChild(this.percentContainer);

        this.createParticles();
        
        setTimeout(() => {
            this.resizeCanvas();
            this.startWaveAnimation();
        }, 10);

        window.addEventListener('resize', () => this.resizeCanvas());
    }

    private triggerSubtleFlare(): void {
        this.lensFlareElement.classList.remove('flare-subtle', 'flare-threshold', 'flare-celebration');
        
        // Force reflow to restart animation
        void this.lensFlareElement.offsetWidth;
        
        this.lensFlareElement.classList.add('flare-subtle');
    }

    private triggerThresholdFlare(): void {
        this.lensFlareElement.classList.remove('flare-subtle', 'flare-threshold', 'flare-celebration');
        void this.lensFlareElement.offsetWidth;
        this.lensFlareElement.classList.add('flare-threshold');
    }

    private triggerCelebrationFlare(): void {
        this.lensFlareElement.classList.remove('flare-subtle', 'flare-threshold', 'flare-celebration');
        void this.lensFlareElement.offsetWidth;
        this.lensFlareElement.classList.add('flare-celebration');
    }

    private handleClick(event: MouseEvent): void {
        // Only create explosion if it was a real click (not a drag)
        if (this.hasDragged) {
            this.hasDragged = false; // Reset for next interaction
            return;
        }
        
        // Get click coordinates relative to the container
        const rect = this.percentContainer.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Trigger explosion at click position
        this.createExplosion(x, y);
    }

    public updateView(context: ComponentFramework.Context<IInputs>): void {
        const value = context.parameters.percent.raw;
        const label = context.parameters.label.raw;
        
        // Get threshold values from parameters with validation
        let midThreshold = context.parameters.midThreshold.raw ?? 40;
        let highThreshold = context.parameters.highThreshold.raw ?? 75;
        
        // Validate midThreshold (clamp between 10 and 80)
        if (midThreshold < 10) {
            midThreshold = 10;
        } else if (midThreshold > 80) {
            midThreshold = 80;
        }
        
        // Validate highThreshold (clamp between 20 and 90)
        if (highThreshold < 20) {
            highThreshold = 20;
        } else if (highThreshold > 90) {
            highThreshold = 90;
        }
        
        // Ensure highThreshold is always greater than midThreshold
        if (highThreshold <= midThreshold) {
            highThreshold = midThreshold + 10;
            // Re-validate high threshold doesn't exceed 90
            if (highThreshold > 90) {
                highThreshold = 90;
                midThreshold = 80; // Adjust mid down if needed
            }
        }
        
        this.midThreshold = midThreshold;
        this.highThreshold = highThreshold;

        if (label) {
            this.labelElement.textContent = label;
            this.labelElement.style.display = "block";
        } else {
            this.labelElement.style.display = "none";
        }

        if (!this.isDragging && value != null) {
            this.currentValue = value;
            this.pendingValue = value;
            this.updateVisuals(value);
        } else if (value == null) {
            this.valueElement.textContent = "--";
            this.updateBackgroundColor(0);
            this.updateBreathingFrequency(0);
            this.updateFontColor(0);
            this.currentValue = 0;
            this.pendingValue = 0;
            this.lastThreshold = "";
        }
    }

    public getOutputs(): IOutputs {
        return {
            percent: this.pendingValue
        };
    }

    public destroy(): void {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        if (this.sparkleInterval) {
            clearInterval(this.sparkleInterval);
        }
        if (this.frostInterval) {
            clearInterval(this.frostInterval);
        }
        if (this.waveAnimationFrame) {
            cancelAnimationFrame(this.waveAnimationFrame);
        }
        window.removeEventListener('resize', () => this.resizeCanvas());
    }

    private handleMouseDown(event: MouseEvent): void {
        this.isDragging = true;
        this.hasDragged = false; // Reset drag flag
        this.dragStartY = event.clientY;
        this.dragStartValue = this.currentValue;
        this.percentContainer.style.cursor = "ns-resize";
    }

    private handleMouseMove(event: MouseEvent): void {
        if (!this.isDragging) return;

        const deltaY = this.dragStartY - event.clientY;
        const pixelsPerPercent = 5;
        const steps = Math.floor(deltaY / pixelsPerPercent);
        
        const oldValue = this.currentValue;
        const newValue = Math.max(0, Math.min(100, this.dragStartValue + steps));
        
        // Mark as dragged if value changed
        if (newValue !== this.dragStartValue) {
            this.hasDragged = true;
        }
        
        if (newValue > oldValue) {
            const crossedThreshold = (oldValue < this.midThreshold && newValue >= this.midThreshold) || 
                                    (oldValue < this.highThreshold && newValue >= this.highThreshold);
            
            if (crossedThreshold) {
                this.currentValue = newValue;
                this.createExplosion();
                this.triggerThresholdFlare();
            }
            
            if (newValue === 100 && oldValue < 100) {
                this.triggerCelebrationFlare();
            }
        }
        
        this.currentValue = newValue;
        this.pendingValue = newValue;
        this.updateVisuals(newValue);
    }

    private handleOverlayMouseMove(event: MouseEvent): void {
        // Only trigger subtle flare if not dragging and enough time has passed
        if (this.isDragging) return;
        
        const now = performance.now();
        if (now - this.lastFlareTime > 2000) { // Trigger every 2 seconds max
            this.triggerSubtleFlare();
            this.lastFlareTime = now;
        }
    }

    private handleMouseUp(event: MouseEvent): void {
        if (!this.isDragging) return;

        this.isDragging = false;
        this.percentContainer.style.cursor = "";
        
        // Notify the framework to update the bound field
        this.notifyOutputChanged();
    }

    private updateVisuals(value: number): void {
        // Format value
        const isWholeNumber = value % 1 === 0;
        this.valueElement.textContent = isWholeNumber 
            ? `${Math.round(value)}%` 
            : `${value.toFixed(1)}%`;
        
        // Show "Nice!" only at exactly 69%
        const shouldShow = Math.round(value) === 69;
        const isCurrentlyVisible = this.niceElement.classList.contains('visible');
        
        if (shouldShow && !isCurrentlyVisible) {
            // Trigger fall-in animation
            this.niceElement.style.display = "block";
            this.niceElement.classList.remove('hidden');
            this.niceElement.classList.add('visible');
        } else if (!shouldShow && isCurrentlyVisible) {
            // Trigger fall-out animation
            this.niceElement.classList.remove('visible');
            this.niceElement.classList.add('hidden');
            
            // Hide after animation completes
            setTimeout(() => {
                if (this.niceElement.classList.contains('hidden')) {
                    this.niceElement.style.display = "none";
                    this.niceElement.classList.remove('hidden');
                }
            }, 400); // Match animation duration
        }
        
        // Update all visual effects
        this.updateBackgroundColor(value);
        this.updateBreathingFrequency(value);
        this.updateFontColor(value);
    }

    private resizeCanvas(): void {
        const rect = this.percentContainer.getBoundingClientRect();
        this.borderCanvas.width = rect.width;
        this.borderCanvas.height = rect.height;
    }

    private startWaveAnimation(): void {
        const animateWave = () => {
            this.waveOffset += 0.05;
            this.drawWavyClip();
            this.waveAnimationFrame = requestAnimationFrame(animateWave);
        };
        animateWave();
    }

    private drawWavyClip(): void {
        if (!this.borderContext) return;

        const canvas = this.borderCanvas;
        const ctx = this.borderContext;
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        const amplitude = 3;
        const frequency = 4;
        
        // Use actual center of canvas
        const centerX = width / 2;
        const centerY = height / 2;
        const baseRadius = Math.min(width, height) / 2 - amplitude - 5; // Reduced padding

        // Generate wavy circular path
        const points: {x: number, y: number}[] = [];
        const numPoints = 360;

        for (let i = 0; i <= numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            
            const waveOffset = amplitude * Math.sin(frequency * angle + this.waveOffset);
            const radius = baseRadius + waveOffset;
            
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            
            points.push({x, y});
        }

        // Draw the wavy circle
        ctx.beginPath();
        points.forEach((point, index) => {
            if (index === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        });
        ctx.closePath();

        // Apply clip path
        const clipPath = this.generateCircularClipPath(centerX, centerY, baseRadius, amplitude, frequency);
        this.contentWrapper.style.clipPath = clipPath;
    }

    private generateCircularClipPath(centerX: number, centerY: number, baseRadius: number, amplitude: number, frequency: number): string {
        const points: string[] = [];
        const numPoints = 180;

        for (let i = 0; i <= numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const waveOffset = amplitude * Math.sin(frequency * angle + this.waveOffset);
            const radius = baseRadius + waveOffset;
            
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            
            points.push(`${x}px ${y}px`);
        }

        return `polygon(${points.join(', ')})`;
    }

    private createParticles(): void {
        for (let i = 0; i < 15; i++) {
            const particle = document.createElement("div");
            particle.className = "particle";
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            particle.style.animationDelay = `${Math.random() * 8}s`;
            particle.style.animationDuration = `${8 + Math.random() * 12}s`;
            this.particlesContainer.appendChild(particle);
        }
    }

    private createExplosion(originX?: number, originY?: number): void {
        // Get current threshold for particle count
        const currentThreshold = this.getThreshold(this.currentValue);
        
        // WILD COLOR PALETTE
        const wildColors = [
            "#ff6b6b", "#ff4757", "#ff6348", "#ff0080", "#ff1744",
            "#ffa726", "#ffb74d", "#ff9800", "#ffd700", "#ffeb3b",
            "#66bb6a", "#4caf50", "#00ff88", "#1de9b6", "#76ff03",
            "#42a5f5", "#2196f3", "#7c4dff", "#d500f9", "#651fff",
            "#00bcd4", "#00e5ff", "#1de9b6", "#64ffda",
            "#ffffff", "#f8f8f8"
        ];

        let numParticles: number;
        if (currentThreshold === "low") {
            numParticles = 30;
        } else if (currentThreshold === "medium") {
            numParticles = 40;
        } else {
            numParticles = 50;
        }

        const shapes = ["circle", "star", "diamond", "triangle"];
        const explosionId = this.activeExplosions++;
        
        // Get container center as default
        const containerRect = this.explosionContainer.getBoundingClientRect();
        const centerX = containerRect.width / 2;
        const centerY = containerRect.height / 2;
        
        // Use provided origin or default to center
        const explosionX = originX !== undefined ? originX : centerX;
        const explosionY = originY !== undefined ? originY : centerY;
        
        for (let i = 0; i < numParticles; i++) {
            const explosionParticle = document.createElement("div");
            
            const shape = shapes[Math.floor(Math.random() * shapes.length)];
            explosionParticle.className = `explosion-particle explosion-${shape}`;
            explosionParticle.setAttribute('data-explosion-id', explosionId.toString());
            
            const angle = (Math.PI * 2 * i) / numParticles + (Math.random() - 0.5) * 0.3;
            const distance = 80 + Math.random() * 120;
            const endX = Math.cos(angle) * distance;
            const endY = Math.sin(angle) * distance;
            
            const size = 10 + Math.random() * 15;
            const color = wildColors[Math.floor(Math.random() * wildColors.length)];
            
            // Position particle at explosion origin
            explosionParticle.style.left = `${explosionX}px`;
            explosionParticle.style.top = `${explosionY}px`;
            
            explosionParticle.style.setProperty('--end-x', `${endX}px`);
            explosionParticle.style.setProperty('--end-y', `${endY}px`);
            explosionParticle.style.width = `${size}px`;
            explosionParticle.style.height = `${size}px`;
            explosionParticle.style.background = color;
            explosionParticle.style.boxShadow = `0 0 20px ${color}, 0 0 40px ${color}`;
            explosionParticle.style.animationDelay = `${Math.random() * 0.1}s`;
            explosionParticle.style.animationDuration = `${0.8 + Math.random() * 0.4}s`;
            
            this.explosionContainer.appendChild(explosionParticle);
        }

        // Add a flash effect at explosion origin
        const flash = document.createElement("div");
        flash.className = "explosion-flash";
        flash.setAttribute('data-explosion-id', explosionId.toString());
        flash.style.left = `${explosionX}px`;
        flash.style.top = `${explosionY}px`;
        this.explosionContainer.appendChild(flash);

        // Remove THIS explosion's particles after animation
        setTimeout(() => {
            const particlesToRemove = this.explosionContainer.querySelectorAll(`[data-explosion-id="${explosionId}"]`);
            particlesToRemove.forEach(particle => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            });
        }, 1500);
    }

    private animateToValue(targetValue: number): void {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }

        const startValue = this.currentValue;
        const duration = 1200;
        const startTime = performance.now();
        const isCountingUp = targetValue > startValue;

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const easeProgress = 1 - Math.pow(1 - progress, 3);

            this.currentValue = startValue + (targetValue - startValue) * easeProgress;
            
            if (isCountingUp) {
                const currentThreshold = this.getThreshold(this.currentValue);
                if (currentThreshold !== this.lastThreshold && this.lastThreshold !== "") {
                    this.createExplosion(); // Center explosion
                    this.triggerThresholdFlare();
                }
                this.lastThreshold = currentThreshold;
                
                if (this.currentValue >= 100 && startValue < 100) {
                    this.triggerCelebrationFlare();
                }
            } else {
                this.lastThreshold = this.getThreshold(this.currentValue);
            }

            const isWholeNumber = targetValue % 1 === 0;
            this.valueElement.textContent = isWholeNumber 
                ? `${Math.round(this.currentValue)}%` 
                : `${this.currentValue.toFixed(1)}%`;
            
            this.updateBackgroundColor(this.currentValue);
            this.updateBreathingFrequency(this.currentValue);
            this.updateFontColor(this.currentValue);

            if (progress < 1) {
                this.animationFrame = requestAnimationFrame(animate);
            } else {
                this.currentValue = targetValue;
                this.valueElement.textContent = isWholeNumber 
                    ? `${targetValue}%` 
                    : `${targetValue.toFixed(1)}%`;
                this.updateBackgroundColor(targetValue);
                this.updateBreathingFrequency(targetValue);
                this.updateFontColor(targetValue);
            }
        };

        this.animationFrame = requestAnimationFrame(animate);
    }

    private updateFontColor(value: number): void {
        const clampedValue = Math.max(0, Math.min(100, value));
        
        const colorWhite = { r: 255, g: 255, b: 255 };
        const colorGolden = { r: 255, g: 215, b: 0 };
        
        const color = this.interpolateColor(colorWhite, colorGolden, clampedValue / 100);
        const colorStr = `rgb(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)})`;
        
        this.valueElement.style.color = colorStr;
        this.labelElement.style.color = colorStr;
        
        // Use dynamic thresholds for frost/sparkle effects
        if (clampedValue < this.midThreshold) {
            // Frost effect
            this.startFrostEffect();
            this.stopSparkles();
            
            const frostIntensity = (this.midThreshold - clampedValue) / this.midThreshold;
            this.valueElement.style.textShadow = `
                0 0 ${3 + frostIntensity * 5}px rgba(173, 216, 230, ${0.6 + frostIntensity * 0.4}),
                0 0 ${6 + frostIntensity * 10}px rgba(173, 216, 230, ${0.4 + frostIntensity * 0.3}),
                0 0 ${10 + frostIntensity * 15}px rgba(135, 206, 235, ${0.3 + frostIntensity * 0.2}),
                2px 2px 4px rgba(0, 0, 0, 0.3)
            `;
            this.labelElement.style.textShadow = `
                0 0 ${2 + frostIntensity * 3}px rgba(173, 216, 230, ${0.5 + frostIntensity * 0.3}),
                1px 1px 3px rgba(0, 0, 0, 0.2)
            `;
        } else if (clampedValue >= this.midThreshold && clampedValue <= this.highThreshold) {
            // Transition zone
            this.stopFrostEffect();
            this.stopSparkles();
            
            const transitionProgress = (clampedValue - this.midThreshold) / (this.highThreshold - this.midThreshold);
            const frostIntensity = 1 - transitionProgress;
            const goldenIntensity = transitionProgress;
            
            this.valueElement.style.textShadow = `
                0 0 ${3 + frostIntensity * 5}px rgba(173, 216, 230, ${0.6 * frostIntensity}),
                0 0 ${6 + frostIntensity * 10}px rgba(173, 216, 230, ${0.4 * frostIntensity}),
                0 0 ${3 + goldenIntensity * 8}px rgba(255, 215, 0, ${0.4 * goldenIntensity}),
                0 0 ${6 + goldenIntensity * 12}px rgba(255, 215, 0, ${0.3 * goldenIntensity}),
                0 0 ${10 + goldenIntensity * 20}px rgba(255, 215, 0, ${0.2 * goldenIntensity}),
                2px 2px 4px rgba(0, 0, 0, 0.3)
            `;
            this.labelElement.style.textShadow = `
                0 0 ${2 + frostIntensity * 3}px rgba(173, 216, 230, ${0.5 * frostIntensity}),
                0 0 ${2 + goldenIntensity * 5}px rgba(255, 215, 0, ${0.4 * goldenIntensity}),
                1px 1px 3px rgba(0, 0, 0, 0.2)
            `;
        } else {
            // Golden glow + sparkles
            this.stopFrostEffect();
            const sparkleIntensity = (clampedValue - this.highThreshold) / (100 - this.highThreshold);
            
            if (!this.sparkleInterval) {
                this.startContinuousSparkles(sparkleIntensity);
            }
            
            const glowIntensity = 0.5 + sparkleIntensity * 0.5;
            this.valueElement.style.textShadow = `
                0 0 ${5 + glowIntensity * 15}px rgba(255, 215, 0, ${0.6 * glowIntensity}),
                0 0 ${10 + glowIntensity * 20}px rgba(255, 215, 0, ${0.5 * glowIntensity}),
                0 0 ${20 + glowIntensity * 30}px rgba(255, 215, 0, ${0.4 * glowIntensity}),
                0 0 ${30 + glowIntensity * 40}px rgba(255, 180, 0, ${0.3 * glowIntensity}),
                2px 2px 4px rgba(0, 0, 0, 0.3)
            `;
            this.labelElement.style.textShadow = `
                0 0 ${3 + glowIntensity * 8}px rgba(255, 215, 0, ${0.5 * glowIntensity}),
                0 0 ${6 + glowIntensity * 12}px rgba(255, 215, 0, ${0.4 * glowIntensity}),
                1px 1px 3px rgba(0, 0, 0, 0.2)
            `;
        }
    }

    private startFrostEffect(): void {
        // Clear any existing frost interval
        if (this.frostInterval) {
            return; // Already running
        }
        
        // Create frost crystals continuously
        this.frostInterval = window.setInterval(() => {
            // Only create if still below 40%
            if (this.currentValue < 40) {
                const frostIntensity = (40 - this.currentValue) / 40;
                this.createFrostCrystal(frostIntensity);
            }
        }, 300); // Create new frost crystal every 300ms
    }

    private stopFrostEffect(): void {
        if (this.frostInterval) {
            clearInterval(this.frostInterval);
            this.frostInterval = null;
        }
        // Clear existing frost crystals
        const frostCrystals = this.sparkleContainer.querySelectorAll('.frost-crystal');
        frostCrystals.forEach(crystal => crystal.remove());
    }

    private createFrostCrystal(intensity: number): void {
        const frost = document.createElement("div");
        frost.className = "frost-crystal";
        
        // Get bounds of value element
        const rect = this.valueElement.getBoundingClientRect();
        const containerRect = this.percentContainer.getBoundingClientRect();
        
        // Random position around the text
        const relativeTop = rect.top - containerRect.top;
        const relativeLeft = rect.left - containerRect.left;
        
        // Add some padding around the text for frost positioning
        const padding = 30;
        const randomX = relativeLeft - padding + Math.random() * (rect.width + padding * 2);
        const randomY = relativeTop - padding + Math.random() * (rect.height + padding * 2);
        
        frost.style.left = `${randomX}px`;
        frost.style.top = `${randomY}px`;
        
        // Random size based on intensity
        const size = (4 + Math.random() * 6) * (0.5 + intensity * 0.5);
        frost.style.width = `${size}px`;
        frost.style.height = `${size}px`;
        
        // Random animation duration
        const duration = 1.5 + Math.random() * 1;
        frost.style.animationDuration = `${duration}s`;
        
        // Random rotation
        frost.style.transform = `rotate(${Math.random() * 360}deg)`;
        
        this.sparkleContainer.appendChild(frost);
        
        // Remove frost after animation
        setTimeout(() => {
            if (frost.parentNode) {
                frost.parentNode.removeChild(frost);
            }
        }, duration * 1000);
    }

    private stopSparkles(): void {
        if (this.sparkleInterval) {
            clearInterval(this.sparkleInterval);
            this.sparkleInterval = null;
        }
        // Clear existing sparkles
        const sparkles = this.sparkleContainer.querySelectorAll('.sparkle');
        sparkles.forEach(sparkle => sparkle.remove());
    }

    private startContinuousSparkles(intensity: number): void {
        // Clear any existing interval
        if (this.sparkleInterval) {
            clearInterval(this.sparkleInterval);
        }
        
        // Create sparkles continuously
        this.sparkleInterval = window.setInterval(() => {
            // Only create if still above threshold
            if (this.currentValue > 75) {
                const sparkleIntensity = (this.currentValue - 75) / 25;
                this.createSparkle(sparkleIntensity);
            }
        }, 200); // Create new sparkle every 200ms
    }

    private createSparkle(intensity: number): void {
        const sparkle = document.createElement("div");
        sparkle.className = "sparkle";
        
        // Get bounds of value element
        const rect = this.valueElement.getBoundingClientRect();
        const containerRect = this.percentContainer.getBoundingClientRect();
        
        // Random position around the text
        const relativeTop = rect.top - containerRect.top;
        const relativeLeft = rect.left - containerRect.left;
        
        // Add some padding around the text for sparkle positioning
        const padding = 20;
        const randomX = relativeLeft - padding + Math.random() * (rect.width + padding * 2);
        const randomY = relativeTop - padding + Math.random() * (rect.height + padding * 2);
        
        sparkle.style.left = `${randomX}px`;
        sparkle.style.top = `${randomY}px`;
        
        // Random size based on intensity
        const size = (2 + Math.random() * 4) * (0.5 + intensity * 0.5);
        sparkle.style.width = `${size}px`;
        sparkle.style.height = `${size}px`;
        
        // Random animation duration
        const duration = 0.8 + Math.random() * 0.6;
        sparkle.style.animationDuration = `${duration}s`;
        
        this.sparkleContainer.appendChild(sparkle);
        
        // Remove sparkle after animation
        setTimeout(() => {
            if (sparkle.parentNode) {
                sparkle.parentNode.removeChild(sparkle);
            }
        }, duration * 1000);
    }

    private getThreshold(value: number): string {
        if (value < this.midThreshold) return "low";
        if (value < this.highThreshold) return "medium";
        return "high";
    }

    private updateBreathingFrequency(value: number): void {
        // Clamp value between 0 and 100
        const clampedValue = Math.max(0, Math.min(100, value));
        
        // Map value to breathing duration: 
        // 0% = 6s (slow breathing)
        // 100% = 2s (fast breathing)
        const minDuration = 2;
        const maxDuration = 6;
        const duration = maxDuration - ((clampedValue / 100) * (maxDuration - minDuration));
        
        // Update CSS animation duration
        this.percentContainer.style.animationDuration = `${duration}s, 10s`;
    }

    private updateBackgroundColor(value: number): void {
        const clampedValue = Math.max(0, Math.min(100, value));
        
        // Define color stops (RGB values)
        const colorLow = { r: 242, g: 184, b: 184 };      // Red
        const colorMedium = { r: 245, g: 208, b: 168 };   // Orange
        const colorHigh = { r: 180, g: 217, b: 186 };     // Green

        let color;

        if (clampedValue < this.midThreshold) {
            // Transition from red to orange (0% to midThreshold)
            const progress = clampedValue / this.midThreshold;
            color = this.interpolateColor(colorLow, colorMedium, progress);
        } else if (clampedValue < this.highThreshold) {
            // Transition from orange to green (midThreshold to highThreshold)
            const progress = (clampedValue - this.midThreshold) / (this.highThreshold - this.midThreshold);
            color = this.interpolateColor(colorMedium, colorHigh, progress);
        } else {
            // Stay green (highThreshold to 100%)
            const progress = (clampedValue - this.highThreshold) / (100 - this.highThreshold);
            const colorBrighter = { r: 180, g: 217, b: 186 };
            color = this.interpolateColor(colorHigh, colorBrighter, progress * 0.1);
        }

        // Create gradient with interpolated color
        const colorStr = `rgb(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)})`;
        const darkerColor = this.darkenColor(color, 0.15);
        const darkerColorStr = `rgb(${Math.round(darkerColor.r)}, ${Math.round(darkerColor.g)}, ${Math.round(darkerColor.b)})`;

        this.contentWrapper.style.background = `linear-gradient(135deg, ${colorStr} 0%, ${darkerColorStr} 50%, ${colorStr} 100%)`;
        this.contentWrapper.style.backgroundSize = '200% 200%';
    }

    private interpolateColor(color1: {r: number, g: number, b: number}, color2: {r: number, g: number, b: number}, progress: number): {r: number, g: number, b: number} {
        return {
            r: color1.r + (color2.r - color1.r) * progress,
            g: color1.g + (color2.g - color1.g) * progress,
            b: color1.b + (color2.b - color1.b) * progress
        };
    }

    private darkenColor(color: {r: number, g: number, b: number}, factor: number): {r: number, g: number, b: number} {
        return {
            r: color.r * (1 - factor),
            g: color.g * (1 - factor),
            b: color.b * (1 - factor)
        };
    }
}