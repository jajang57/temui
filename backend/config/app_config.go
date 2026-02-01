package config

import (
	"os"
)

var AppMode string

func InitAppMode() {
	AppMode = os.Getenv("APP_MODE")
	if AppMode == "" {
		AppMode = "client"
	}
}

func IsConsultantMode() bool {
	return AppMode == "consultant"
}
