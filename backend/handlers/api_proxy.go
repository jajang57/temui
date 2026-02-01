package handlers

import (
	"io"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// ProxyRequest forwards the current request to the target client API
func ProxyRequest(c *gin.Context, targetBaseURL string) {
	// 1. Build Target URL
	// targetBaseURL example: "http://localhost:8080"
	// c.Request.URL.Path: "/api/pembelian"
	targetURL := strings.TrimRight(targetBaseURL, "/") + c.Request.URL.Path
	if c.Request.URL.RawQuery != "" {
		targetURL += "?" + c.Request.URL.RawQuery
	}

	// 2. Create New Request
	// We use the same Method and Body
	req, err := http.NewRequest(c.Request.Method, targetURL, c.Request.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create proxy request: " + err.Error()})
		c.Abort()
		return
	}

	// 3. Copy Headers
	// Forward Authorization, Content-Type, etc.
	for k, vv := range c.Request.Header {
		for _, v := range vv {
			req.Header.Add(k, v)
		}
	}

	// Remove headers that might cause issues?
	// req.Header.Del("Host")

	// 4. Send Request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "Failed to connect to Client API: " + err.Error()})
		c.Abort()
		return
	}
	defer resp.Body.Close()

	// 5. Copy Response to Original ResponseWriter
	// Headers
	for k, vv := range resp.Header {
		// Skip CORS headers (handled by our own middleware)
		if strings.HasPrefix(k, "Access-Control-") {
			continue
		}
		for _, v := range vv {
			c.Writer.Header().Add(k, v)
		}
	}

	// Status Code
	c.Status(resp.StatusCode)

	// Body
	io.Copy(c.Writer, resp.Body)

	// 6. Abort further processing (Middlewares/Handlers in this app)
	c.Abort()
}
