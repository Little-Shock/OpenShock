package acp

type EventKind string

const (
	EventStdoutChunk EventKind = "stdout_chunk"
	EventStderrChunk EventKind = "stderr_chunk"
	EventToolCall    EventKind = "tool_call"
	EventCompleted   EventKind = "completed"
)

type ToolCall struct {
	ToolName  string
	Arguments string
	Status    string
}

type Event struct {
	Kind        EventKind
	Content     string
	LastMessage string
	ToolCall    *ToolCall
}
