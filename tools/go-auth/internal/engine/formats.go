package engine

import (
	"regexp"
	"strconv"
	"strings"
)

var formatPatterns = map[string]*regexp.Regexp{
	"formatEmail":    regexp.MustCompile("^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$"),
	"formatPhoneJP":  regexp.MustCompile(`^0[0-9]{9,10}$`),
	"formatPostalJP": regexp.MustCompile(`^[0-9]{7}$`),
	"formatKatakana": regexp.MustCompile(`^[ァ-ヺー　 ]+$`),
	"formatDate":     regexp.MustCompile(`^[0-9]{4}-[0-9]{2}-[0-9]{2}$`),
}

func validFormat(name string, value any) bool {
	s, ok := value.(string)
	if !ok {
		return false
	}
	p := formatPatterns[name]
	if p == nil || !p.MatchString(s) {
		return false
	}
	if name != "formatDate" {
		return true
	}
	parts := strings.Split(s, "-")
	y, _ := strconv.Atoi(parts[0])
	m, _ := strconv.Atoi(parts[1])
	d, _ := strconv.Atoi(parts[2])
	days := []int{31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31}
	if y%4 == 0 && (y%100 != 0 || y%400 == 0) {
		days[1] = 29
	}
	return y >= 1900 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= days[m-1]
}
