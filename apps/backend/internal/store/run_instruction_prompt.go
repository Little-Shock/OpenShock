package store

import (
	"bytes"
	_ "embed"
	"strings"
	"text/template"

	"openshock/backend/internal/core"
)

//go:embed run_instruction_prompt.md.tmpl
var runInstructionPromptTemplateSource string

var runInstructionPromptTemplate = template.Must(
	template.New("run_instruction_prompt.md.tmpl").Parse(runInstructionPromptTemplateSource),
)

type runInstructionPromptData struct {
	TaskID          string
	TaskTitle       string
	BranchName      string
	AssigneeAgentID string
	Description     string
	ActorID         string
}

func buildRunInstruction(task core.Task) string {
	actorID := strings.TrimSpace(task.AssigneeAgentID)
	if actorID == "" {
		actorID = "agent_runtime"
	}

	data := runInstructionPromptData{
		TaskID:          task.ID,
		TaskTitle:       task.Title,
		BranchName:      task.BranchName,
		AssigneeAgentID: strings.TrimSpace(task.AssigneeAgentID),
		Description:     strings.TrimSpace(task.Description),
		ActorID:         actorID,
	}

	var rendered bytes.Buffer
	if err := runInstructionPromptTemplate.Execute(&rendered, data); err != nil {
		panic(err)
	}
	return rendered.String()
}
