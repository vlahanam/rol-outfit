package common

import (
	"regexp"
	"strings"
	"unicode"

	"golang.org/x/text/runes"
	"golang.org/x/text/transform"
	"golang.org/x/text/unicode/norm"
)

var (
	nonAlphanumeric = regexp.MustCompile(`[^a-z0-9]+`)
	// normalizer strips diacritical marks (e.g. "Áo" → "Ao") before slugifying.
	normalizer = transform.Chain(norm.NFD, runes.Remove(runes.In(unicode.Mn)), norm.NFC)
)

// Slugify converts a string to a URL-friendly ASCII slug.
// Vietnamese and other accented characters are transliterated (e.g. "Áo Nam" → "ao-nam").
func Slugify(s string) string {
	normalized, _, _ := transform.String(normalizer, s)
	normalized = strings.ToLower(normalized)
	normalized = nonAlphanumeric.ReplaceAllString(normalized, "-")
	return strings.Trim(normalized, "-")
}
