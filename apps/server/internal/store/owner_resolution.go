package store

import "strings"

func canonicalOwnerName(agents []Agent, value string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return ""
	}
	for _, agent := range agents {
		if agent.ID == value || strings.EqualFold(strings.TrimSpace(agent.Name), value) {
			return strings.TrimSpace(agent.Name)
		}
	}
	return value
}

func recentRunOwnerName(agents []Agent, runID string) string {
	runID = strings.TrimSpace(runID)
	if runID == "" {
		return ""
	}
	for _, agent := range agents {
		for _, recentRunID := range agent.RecentRunIDs {
			if recentRunID == runID {
				return strings.TrimSpace(agent.Name)
			}
		}
	}
	return ""
}

func resolveRunOwnerName(snapshot State, run Run) string {
	room, _ := findRoomInRunSnapshot(snapshot, run.RoomID)
	issue, _ := findIssueInRunSnapshot(snapshot, run.IssueKey)
	return resolveRunOwnerNameWithContext(snapshot, run, issue, room)
}

func resolveRunOwnerNameWithContext(snapshot State, run Run, issue Issue, room Room) string {
	for _, value := range []string{
		run.Owner,
		issue.Owner,
		room.Topic.Owner,
	} {
		if owner := canonicalOwnerName(snapshot.Agents, value); owner != "" {
			return owner
		}
	}
	return recentRunOwnerName(snapshot.Agents, run.ID)
}

func normalizeRunOwnerForView(snapshot State, run Run, issue Issue, room Room) Run {
	if owner := resolveRunOwnerNameWithContext(snapshot, run, issue, room); owner != "" {
		run.Owner = owner
	}
	return run
}
