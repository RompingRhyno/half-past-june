// Simple global image prefetch scheduler to control concurrency.
// Prioritizes earlier enqueued jobs (top-to-bottom) and prevents network flooding.

type PrefetchJob = { src: string; resolve: () => void; reject: () => void };

class PrefetchScheduler {
  private queue: PrefetchJob[] = [];
  private activeCount = 0;
  private readonly maxConcurrent = 3; // Adjustable for bandwidth

  enqueue(src: string) {
    return new Promise<void>((resolve, reject) => {
      this.queue.push({ src, resolve, reject });
      this.runNext();
    });
  }

  private runNext() {
    if (this.activeCount >= this.maxConcurrent || this.queue.length === 0) return;

    const job = this.queue.shift()!;
    this.activeCount++;

    const img = new Image();
    img.loading = "lazy";
    img.src = job.src;
    img.onload = () => this.finish(job);
    img.onerror = () => this.finish(job);
  }

  private finish(job: PrefetchJob) {
    this.activeCount--;
    job.resolve();
    this.runNext();
  }
}

export const prefetchScheduler = new PrefetchScheduler();
