import sys
import time
import datetime
import calendar

args = sys.argv[1:]
filename = args[0]
index = 1

def dateToTimestamp(format, date):
	return calendar.timegm(time.strptime(date, format))

print '{"objects":['

with open(filename) as f:
    for line in f:
        line = line.strip(' \t\n\r')
        splited = line.split(',')
        prefix = ""
        if index>1:
        	prefix = ","
        if len(splited)==7:
        	print prefix + "{\"point\": {\"coordinates\":[%s,%s], \"timestamp\":%s, \"date\":\"%s\" }}" % (splited[0], splited[1], dateToTimestamp("%Y-%m-%d %H:%M:%S", splited[5] + " " + splited[6]),  splited[5] + " " + splited[6])
        	index = index + 1
print ']}'
