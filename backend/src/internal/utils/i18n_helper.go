package utils

// GetLocalizedString returns the Japanese value if lang is "ja" and value exists,
// otherwise returns the default (Vietnamese) value.
func GetLocalizedString(defaultVal, jaVal, lang string) string {
	if IsJapanese(lang) && jaVal != "" {
		return jaVal
	}
	return defaultVal
}

// SupportedLanguages for i18n content
var SupportedLanguages = []string{"vi", "ja"}

// IsJapanese checks if the language code indicates Japanese
func IsJapanese(lang string) bool {
	return lang == "ja" || lang == "ja-JP" || lang == "jp"
}
