import { DateTime, Interval } from 'luxon';
import { outputNaptime } from './logging';
import { NaptimeInput } from './napTimeInput'
import { NapTimeResult } from './napTimeResult'

export function getNapLengthHours(totalWakeTime: number): number {
    if (totalWakeTime <= 20) {
        return 0;
    } else if (totalWakeTime > 20 && totalWakeTime <= 24) {
        return 1;
    } else if (totalWakeTime > 24 && totalWakeTime <= 28) {
        return 2;
    } else if (totalWakeTime > 28 && totalWakeTime <= 36) {
        return 4;
    } else if (totalWakeTime > 36 && totalWakeTime <= 42) {
        return 6;
    } else { // more then 42 hours
        return 8;
    }
}

function differenceInHours(moments: [DateTime, DateTime]): number {
    var duration = moments[0].diff(moments[1], 'hours');
    var hours = duration.hours;
    return hours
}

export function runNaptime(naptimeInput: NaptimeInput) {
    let result = naptime(naptimeInput)
    if (result.napFound) {
        outputNaptime(result, false)
        return
    }

    let rule1NaptimeAdd = naptimeInput
    rule1NaptimeAdd.usualWakeTime = rule1NaptimeAdd.usualWakeTime.minus({ hours: 1.5 })

    result = naptime(rule1NaptimeAdd)
    if (result.napFound) {
        outputNaptime(result, true)
        return
    }

    let rule1NaptimeRemove = naptimeInput
    rule1NaptimeRemove.usualWakeTime = rule1NaptimeRemove.usualWakeTime.plus({ hours: 1.5 })

    result = naptime(rule1NaptimeRemove)
    if (result.napFound) {
        outputNaptime(result, true)
        return
    }

    let rule2NaptimeAdd = naptimeInput
    rule2NaptimeAdd.preferredBedTime = rule2NaptimeAdd.preferredBedTime.minus({ hours: 1.5 })

    result = naptime(rule2NaptimeAdd)
    if (result.napFound) {
        outputNaptime(result, true)
        return
    }

    let rule2NaptimeRemove = naptimeInput
    rule2NaptimeRemove.preferredBedTime = rule2NaptimeRemove.preferredBedTime.plus({ hours: 1.5 })

    result = naptime(rule2NaptimeRemove)
    if (result.napFound) {
        outputNaptime(result, true)
        return
    }

    let napLengths = [1, 2, 4, 6, 8]
    let index = napLengths.indexOf(result.napLength, 0)
    if (index > -1) {
        napLengths = napLengths.splice(index, 1)
    }
    //try lower nap lengths
    for (let napLength of napLengths) {
        result = naptime(naptimeInput, napLength)
        if (result.napFound) {
            outputNaptime(result, true)
            return
        }
    }

    outputNaptime(result, true)
}

export function naptime(naptimeInput: NaptimeInput, napLength?: number): NapTimeResult {

    let flightDayWakeTime = DateTime.min(naptimeInput.usualWakeTime, naptimeInput.flightDayLatestWakeTime)
    let arrivalDayBedTime = DateTime.max(naptimeInput.preferredBedTime, naptimeInput.arrivalDayEarliestBedTime)
    let totalWakeTime = Math.abs(differenceInHours([flightDayWakeTime, arrivalDayBedTime]))
    let napLengthHours = napLength != undefined ? napLength : getNapLengthHours(totalWakeTime)

    let nap = createNap(naptimeInput.usualBedTime, naptimeInput.preferredWakeTime, napLengthHours)
    return getNapTimeWithConditions(naptimeInput.flightDepartureTime, naptimeInput.flightArrivalTime, flightDayWakeTime, arrivalDayBedTime, nap, napLengthHours, naptimeInput.destinationTimezone)

}

function createNap(usualBedTime: DateTime, preferredWakeTime: DateTime, napLengthHours: number): Interval {
    let dateDifference = differenceInHours([preferredWakeTime, usualBedTime])
    let midpointDate = usualBedTime.plus({ hours: dateDifference / 2 })
    let halfMinutesForNap = napLengthHours / 2

    let napStart = midpointDate.minus({ hours: halfMinutesForNap })
    let napEnd = midpointDate.plus({ hours: halfMinutesForNap })
    return Interval.fromDateTimes(napStart, napEnd);
}

function getNapTimeWithConditions(flightDepartureTime: DateTime, flightArrivalTime: DateTime, flightDayWakeTime: DateTime, arrivalDayBedTime: DateTime, napRange: Interval, napLengthHours: number, destinationTimezone: string): NapTimeResult {
    var awakeInterval
    switch (napLengthHours) {
        case 1:
            awakeInterval = unallowedRangesSorroundingFlights(flightDayWakeTime, arrivalDayBedTime, 4, 6)
            break;
        case 2:
            awakeInterval = unallowedRangesSorroundingFlights(flightDayWakeTime, arrivalDayBedTime, 6, 8)
            break;
        case 4:
            awakeInterval = unallowedRangesSorroundingFlights(flightDayWakeTime, arrivalDayBedTime, 9, 10)
            break;
        case 6:
            awakeInterval = unallowedRangesSorroundingFlights(flightDayWakeTime, arrivalDayBedTime, 12, 12)
            break;
        case 8:
            awakeInterval = unallowedRangesSorroundingFlights(flightDayWakeTime, arrivalDayBedTime, 14, 12)
            break;
        default:
            console.log("no nap ranges found here ")
            return new NapTimeResult(false, destinationTimezone, napLengthHours)
    }

    // 4 hours before take off until 1 hour after take-off
    let takeoffRange = Interval.fromDateTimes(flightDepartureTime.minus({ hours: 4 }), flightDepartureTime.plus({ hours: 1 }))
    // 1 hours before landing until 2 hours after landing
    let landingRange = Interval.fromDateTimes(flightArrivalTime.minus({ hours: 1 }), flightArrivalTime.plus({ hours: 2 }))

    //during layover cannot be done without dates / mention in docs
    var napRanges: Interval[] = [
        Interval.fromDateTimes(awakeInterval.start, takeoffRange.start),
        Interval.fromDateTimes(takeoffRange.end, landingRange.start),
        Interval.fromDateTimes(landingRange.end, awakeInterval.end)
    ]

    var longEnoughRanges: Interval[] = []
    for (let range of napRanges) {
        if (range.engulfs(napRange)) {
            return new NapTimeResult(true, destinationTimezone, napLengthHours, napRange)
        }

        if (range.length('hours') >= napLengthHours) {
            longEnoughRanges.push(range)
        }
    }

    if (longEnoughRanges.length == 0) {
        return new NapTimeResult(false, destinationTimezone, napLengthHours)
    } else {
        var rangeFound = napRanges[0]
        let rangeStart = Math.abs(napRanges[0].start.millisecond - napRange.start.millisecond)

        for (let range of longEnoughRanges) {
            let calculatedStart = Math.abs(range.start.millisecond - napRange.start.millisecond)
            let calculatedEnd = Math.abs(range.end.millisecond - napRange.end.millisecond)
            if (calculatedStart < rangeStart) {
                rangeStart = calculatedStart
                rangeFound = range
            }
        }

        if (rangeFound.start.millisecond > napRange.start.millisecond) {
            return new NapTimeResult(true, destinationTimezone, napLengthHours, Interval.fromDateTimes(rangeFound.start, rangeFound.start.plus({ hours: napLengthHours })))
        } else {
            return new NapTimeResult(true, destinationTimezone, napLengthHours, Interval.fromDateTimes(rangeFound.end.minus({ hours: napLengthHours }), rangeFound.end))
        }
    }

    // 3. Maximum Time Awake
    //     a. The traveler must not have a time period of more than 20 hours without sleep.
    // cannot do this one as there will always be a nap. Im guessing this is a valid for multiple flights with layovers
}

function unallowedRangesSorroundingFlights(flightDayWakeTime: DateTime, arrivalDayBedTime: DateTime, flightDayBuffer: number, arrivalDayBuffer: number): Interval {
    return Interval.fromDateTimes(flightDayWakeTime.plus({ hours: flightDayBuffer }), arrivalDayBedTime.minus({ hours: arrivalDayBuffer }))
}