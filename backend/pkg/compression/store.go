package compression

import (
	"fmt"
	"sync"
	"time"
)

// Entry stores a compressed file in memory with a TTL.
type Entry struct {
	Data      []byte
	Filename  string
	Format    string
	CreatedAt time.Time
}

// Store is a thread-safe in-memory file store with TTL eviction.
type Store struct {
	mu      sync.RWMutex
	entries map[string]*Entry
	ttl     time.Duration
}

// NewStore creates a Store with automatic cleanup.
func NewStore(ttl time.Duration) *Store {
	s := &Store{
		entries: make(map[string]*Entry),
		ttl:     ttl,
	}
	go s.startEviction()
	return s
}

// Set stores a compressed entry under fileID.
func (s *Store) Set(fileID string, entry *Entry) {
	s.mu.Lock()
	defer s.mu.Unlock()
	entry.CreatedAt = time.Now()
	s.entries[fileID] = entry
}

// Get retrieves an entry by fileID.
func (s *Store) Get(fileID string) (*Entry, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	e, ok := s.entries[fileID]
	if !ok {
		return nil, fmt.Errorf("file %s not found", fileID)
	}
	return e, nil
}

// Delete removes an entry.
func (s *Store) Delete(fileID string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.entries, fileID)
}

// startEviction runs periodic cleanup of expired entries.
func (s *Store) startEviction() {
	ticker := time.NewTicker(s.ttl / 2)
	defer ticker.Stop()
	for range ticker.C {
		s.evict()
	}
}

func (s *Store) evict() {
	s.mu.Lock()
	defer s.mu.Unlock()
	now := time.Now()
	for id, e := range s.entries {
		if now.Sub(e.CreatedAt) > s.ttl {
			delete(s.entries, id)
		}
	}
}
