package store

const defaultStateStreamHistoryCap = 256

type StateStreamUpdate struct {
	Sequence int
	Snapshot State
}

type StateSubscription struct {
	ID      int
	Updates <-chan StateStreamUpdate
	Current StateStreamUpdate
	Replay  []StateStreamUpdate
	Resync  bool
}

func (s *Store) SubscribeState(afterSequence int) StateSubscription {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.ensureRealtimeHistoryLocked()
	if s.subscribers == nil {
		s.subscribers = make(map[int]chan StateStreamUpdate)
	}

	s.nextSubID++
	id := s.nextSubID
	ch := make(chan StateStreamUpdate, 4)
	s.subscribers[id] = ch

	replay, resync := s.replayStateUpdatesLocked(afterSequence)

	return StateSubscription{
		ID:      id,
		Updates: ch,
		Current: cloneStateStreamUpdate(s.currentStateUpdateLocked()),
		Replay:  replay,
		Resync:  resync,
	}
}

func (s *Store) UnsubscribeState(id int) {
	s.mu.Lock()
	defer s.mu.Unlock()

	ch, ok := s.subscribers[id]
	if !ok {
		return
	}
	delete(s.subscribers, id)
	close(ch)
}

func (s *Store) publishSnapshotLocked() {
	var update StateStreamUpdate
	if s.nextSequence == 0 && len(s.stateHistory) == 0 {
		s.nextSequence = 1
		update = StateStreamUpdate{
			Sequence: s.nextSequence,
			Snapshot: cloneState(s.state),
		}
		s.stateHistory = []StateStreamUpdate{cloneStateStreamUpdate(update)}
	} else {
		s.nextSequence++
		update = StateStreamUpdate{
			Sequence: s.nextSequence,
			Snapshot: cloneState(s.state),
		}
		s.stateHistory = append(s.stateHistory, cloneStateStreamUpdate(update))
	}
	if len(s.stateHistory) > defaultStateStreamHistoryCap {
		s.stateHistory = append([]StateStreamUpdate(nil), s.stateHistory[len(s.stateHistory)-defaultStateStreamHistoryCap:]...)
	}

	if len(s.subscribers) == 0 {
		return
	}

	for _, ch := range s.subscribers {
		select {
		case ch <- cloneStateStreamUpdate(update):
		default:
			select {
			case <-ch:
			default:
			}
			select {
			case ch <- cloneStateStreamUpdate(update):
			default:
			}
		}
	}
}

func (s *Store) ensureRealtimeHistoryLocked() {
	if s.nextSequence > 0 || len(s.stateHistory) > 0 {
		return
	}
	s.nextSequence = 1
	s.stateHistory = []StateStreamUpdate{{
		Sequence: s.nextSequence,
		Snapshot: cloneState(s.state),
	}}
}

func (s *Store) currentStateUpdateLocked() StateStreamUpdate {
	s.ensureRealtimeHistoryLocked()
	return s.stateHistory[len(s.stateHistory)-1]
}

func (s *Store) CurrentStateSequence() int {
	s.mu.Lock()
	defer s.mu.Unlock()

	return s.currentStateUpdateLocked().Sequence
}

func (s *Store) replayStateUpdatesLocked(afterSequence int) ([]StateStreamUpdate, bool) {
	s.ensureRealtimeHistoryLocked()

	if afterSequence <= 0 || len(s.stateHistory) == 0 {
		return nil, false
	}

	currentSequence := s.stateHistory[len(s.stateHistory)-1].Sequence
	if afterSequence > currentSequence {
		return nil, true
	}

	oldestSequence := s.stateHistory[0].Sequence
	if afterSequence < oldestSequence-1 {
		return nil, true
	}

	replay := make([]StateStreamUpdate, 0, len(s.stateHistory))
	for _, update := range s.stateHistory {
		if update.Sequence <= afterSequence {
			continue
		}
		replay = append(replay, cloneStateStreamUpdate(update))
	}
	return replay, false
}

func cloneStateStreamUpdate(update StateStreamUpdate) StateStreamUpdate {
	return StateStreamUpdate{
		Sequence: update.Sequence,
		Snapshot: cloneStoredState(update.Snapshot),
	}
}
