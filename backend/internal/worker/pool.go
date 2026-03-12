package worker

import (
	"context"
	"log"
	"sync"
)

// Job is a unit of work submitted to the pool.
type Job struct {
	ID      string
	Execute func(ctx context.Context) error
	Result  chan<- error
}

// Pool manages a fixed number of goroutine workers.
type Pool struct {
	size    int
	jobs    chan Job
	wg      sync.WaitGroup
	once    sync.Once
	cancelFn context.CancelFunc
	ctx     context.Context
}

// NewPool creates a pool with the given worker count.
func NewPool(size int) *Pool {
	if size <= 0 {
		size = 1
	}
	ctx, cancel := context.WithCancel(context.Background())
	return &Pool{
		size:     size,
		jobs:     make(chan Job, size*4), // buffered queue
		cancelFn: cancel,
		ctx:      ctx,
	}
}

// Start launches the worker goroutines.
func (p *Pool) Start() {
	p.once.Do(func() {
		for i := 0; i < p.size; i++ {
			p.wg.Add(1)
			go p.runWorker(i)
		}
		log.Printf("[WorkerPool] Started %d workers\n", p.size)
	})
}

// Submit enqueues a job. Blocks if the queue is full.
func (p *Pool) Submit(job Job) {
	select {
	case p.jobs <- job:
	case <-p.ctx.Done():
		if job.Result != nil {
			job.Result <- context.Canceled
		}
	}
}

// Stop gracefully drains the queue and shuts down workers.
func (p *Pool) Stop() {
	p.cancelFn()
	close(p.jobs)
	p.wg.Wait()
	log.Println("[WorkerPool] All workers stopped.")
}

// WorkerCount returns the pool size.
func (p *Pool) WorkerCount() int {
	return p.size
}

func (p *Pool) runWorker(id int) {
	defer p.wg.Done()
	for job := range p.jobs {
		log.Printf("[Worker %d] Processing job %s\n", id, job.ID)
		err := job.Execute(p.ctx)
		if job.Result != nil {
			job.Result <- err
		}
	}
}
