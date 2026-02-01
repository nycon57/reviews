/**
 * Carousel Engine — manages auto-play, navigation state, and visibility observation.
 * Pure vanilla JS, no external dependencies. Designed for Shadow DOM embed context.
 */

export interface CarouselEngineOptions {
  totalSlides: number;
  visibleCards: number;
  interval: number;
  autoplay: boolean;
  onNavigate: (index: number, direction: "next" | "prev" | "dot") => void;
}

export class CarouselEngine {
  private currentIndex = 0;
  private totalSlides: number;
  private visibleCards: number;
  private interval: number;
  private autoplay: boolean;
  private onNavigate: CarouselEngineOptions["onNavigate"];

  private timer: ReturnType<typeof setInterval> | null = null;
  private paused = false;
  private visible = true;
  private observer: IntersectionObserver | null = null;

  constructor(options: CarouselEngineOptions) {
    this.totalSlides = options.totalSlides;
    this.visibleCards = options.visibleCards;
    this.interval = options.interval;
    this.autoplay = options.autoplay;
    this.onNavigate = options.onNavigate;
  }

  /** Maximum index the carousel can scroll to (prevents overscrolling). */
  get maxIndex(): number {
    return Math.max(0, this.totalSlides - this.visibleCards);
  }

  get index(): number {
    return this.currentIndex;
  }

  /** Start auto-play if enabled. */
  start(): void {
    if (!this.autoplay || this.totalSlides <= this.visibleCards) return;
    this.stopTimer();
    this.timer = setInterval(() => {
      if (!this.paused && this.visible) {
        this.next();
      }
    }, this.interval);
  }

  /** Stop auto-play timer. */
  stop(): void {
    this.stopTimer();
  }

  /** Navigate to the next slide (infinite loop). */
  next(): void {
    const nextIndex = this.currentIndex >= this.maxIndex ? 0 : this.currentIndex + 1;
    this.goTo(nextIndex, "next");
  }

  /** Navigate to the previous slide (infinite loop). */
  prev(): void {
    const prevIndex = this.currentIndex <= 0 ? this.maxIndex : this.currentIndex - 1;
    this.goTo(prevIndex, "prev");
  }

  /** Navigate to a specific slide index via dot click. */
  goTo(index: number, direction: "next" | "prev" | "dot" = "dot"): void {
    const clamped = Math.max(0, Math.min(index, this.maxIndex));
    this.currentIndex = clamped;
    this.onNavigate(clamped, direction);
  }

  /** Pause auto-play (on hover). */
  pause(): void {
    this.paused = true;
  }

  /** Resume auto-play (on mouse leave). */
  resume(): void {
    this.paused = false;
  }

  /** Toggle play/pause state. Returns new playing state. */
  togglePlay(): boolean {
    if (this.paused) {
      this.resume();
      if (!this.timer) this.start();
      return true;
    } else {
      this.pause();
      return false;
    }
  }

  /** Observe element visibility for auto-play pause when off-screen. */
  observeVisibility(element: HTMLElement): void {
    if (typeof IntersectionObserver === "undefined") return;
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          this.visible = entry.isIntersecting;
        }
      },
      { threshold: 0.1 },
    );
    this.observer.observe(element);
  }

  /** Clean up all timers and observers. */
  destroy(): void {
    this.stopTimer();
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
