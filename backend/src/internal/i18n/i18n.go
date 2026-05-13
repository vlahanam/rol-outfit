package i18n

import (
	"embed"
	"encoding/json"

	goi18n "github.com/nicksnyder/go-i18n/v2/i18n"
	"golang.org/x/text/language"
)

//go:embed locales/*.json
var localeFS embed.FS

var bundle *goi18n.Bundle

func init() {
	bundle = goi18n.NewBundle(language.Vietnamese)
	bundle.RegisterUnmarshalFunc("json", json.Unmarshal)
	for _, name := range []string{"locales/vi.json", "locales/ja.json"} {
		if _, err := bundle.LoadMessageFileFS(localeFS, name); err != nil {
			panic("i18n: failed to load " + name + ": " + err.Error())
		}
	}
}

// T returns the translated message for the given lang and messageID.
// Falls back to messageID if translation not found.
func T(lang, messageID string) string {
	loc := goi18n.NewLocalizer(bundle, lang)
	msg, err := loc.Localize(&goi18n.LocalizeConfig{MessageID: messageID})
	if err != nil {
		return messageID
	}
	return msg
}

// LangFromHeader extracts a supported language tag from Accept-Language header.
// Returns "vi" if not set or unsupported.
func LangFromHeader(acceptLang string) string {
	if acceptLang == "" {
		return "vi"
	}
	tags, _, err := language.ParseAcceptLanguage(acceptLang)
	if err != nil || len(tags) == 0 {
		return "vi"
	}
	supported := []language.Tag{language.Vietnamese, language.Japanese}
	matcher := language.NewMatcher(supported)
	tag, _, _ := matcher.Match(tags...)
	base, _ := tag.Base()
	return base.String()
}
