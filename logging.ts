import { DateTime, Interval } from 'luxon';
import { NapTimeResult } from './napTimeResult'

export function outputNaptime(napTimeResult: NapTimeResult, modified: boolean) {
    // Nap Start Time: 22:00 GMT-7 / 06:00 GMT+1
    // Nap End Time: 02:00 GMT-7 / 10:00 GMT+1
    let dateFormat = "HH:mm 'GMT'Z"
    let timezone = 'UTC' + napTimeResult.destinationTimezone
    if (napTimeResult.nap != undefined && napTimeResult.napFound) {
        console.log(modified ? 'Yes, the nap can be placed with modifying the time' : 'Yes, the nap can be placed without modifying the time')
        console.log('Nap Start Time: ', napTimeResult.nap.start.toFormat(dateFormat), '/', napTimeResult.nap.start.setZone(timezone).toFormat(dateFormat))
        console.log('Nap End Time: ', napTimeResult.nap.end.toFormat(dateFormat), '/', napTimeResult.nap.end.setZone(timezone).toFormat(dateFormat))
    } else {
        console.log("No nap can be placed")
    }
}