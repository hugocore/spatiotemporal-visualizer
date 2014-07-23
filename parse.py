from os import listdir
from os.path import isfile, isdir, join, splitext

import sys
import time
import datetime
import calendar

def dateToTimestamp(format, date):
    return calendar.timegm(time.strptime(date, format))

args = sys.argv[1:]
mainFolder = args[0]
maxUsers = int(args[1])
maxDate = time.strptime(args[2], "%Y%m%d%H%M%S")
minInterval = int(args[3])
trajectoryLabel = "Trajectory"

userFolders = [ f for f in listdir(mainFolder) if isdir(join(mainFolder,f)) ]

print 'user,lat,lng,timestamp'

# For every user folder
for userFolder in userFolders:

    userId = int(userFolder)

    # Check if user is under the maximum
    if userId<maxUsers:

        trajectoryFolder = join(mainFolder, userFolder, trajectoryLabel)
        meteringFiles = [ f for f in listdir(trajectoryFolder) if isfile(join(trajectoryFolder,f)) ]

        # For every metering file of the user
        for meteringFile in meteringFiles:

            meteringDateString = splitext(meteringFile)[0]
            meteringDate = time.strptime(meteringDateString, "%Y%m%d%H%M%S")

            # Open the metering file
            with open(join(trajectoryFolder, meteringFile)) as f:
                lastTimestamp = 0

                # For every line in the file
                for line in f:
                    line = line.strip(' \t\n\r')
                    splited = line.split(',')

                    # Check if line is complete
                    if len(splited)==7:
                        currentTimestamp = dateToTimestamp("%Y-%m-%d %H:%M:%S", splited[5] + " " + splited[6])

                        # Check if metering is under the maximum date
                        if currentTimestamp <= calendar.timegm(maxDate):

                            # Check for interval sampling between meterings
                            if currentTimestamp-lastTimestamp>=minInterval:
                                print "%s,%s,%s,%s" % (userId, splited[0], splited[1], currentTimestamp)
                                lastTimestamp = dateToTimestamp("%Y-%m-%d %H:%M:%S", splited[5] + " " + splited[6])
                        else:
                            # Move to next file otherwise
                            break
