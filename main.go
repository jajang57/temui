package main

import (
	"os"
	"os/exec"
)

func main() {
	// Change to backend directory and run the actual application
	os.Chdir("backend")
	cmd := exec.Command("./main")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Run()
}