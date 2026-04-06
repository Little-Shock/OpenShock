package daemon

import "errors"

var (
	ErrLaneNotFound         = errors.New("lane not found")
	ErrRunNotFound          = errors.New("run not found")
	ErrApprovalHoldNotFound = errors.New("approval hold not found")
)
